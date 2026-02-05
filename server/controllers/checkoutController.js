const db = require("../models");
const InventoryItem = db.InventoryItem;
const CheckoutBatch = db.CheckoutBatch;
const { Op } = require("sequelize");

exports.checkoutItem = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const warehouse = "JAAN";
    const { reason } = req.body;
    const items =
      Array.isArray(req.body.items) && req.body.items.length > 0
        ? req.body.items
        : req.body.itemCode && req.body.quantity
        ? [{ itemCode: req.body.itemCode, quantity: req.body.quantity }]
        : [];
    if (!items.length) {
      await t.rollback();
      return res.status(400).json({ message: "No items provided for checkout" });
    }
    for (const it of items) {
      if (!it.itemCode) {
        await t.rollback();
        return res.status(400).json({ message: "Item code is required" });
      }
      if (!it.quantity || parseInt(it.quantity) <= 0) {
        await t.rollback();
        return res.status(400).json({ message: "Quantity must be positive" });
      }
    }
    const foundItems = [];
    for (const it of items) {
      const item = await InventoryItem.findOne({
        where: { code: it.itemCode, warehouse },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!item) {
        await t.rollback();
        return res
          .status(404)
          .json({ message: `Item ${it.itemCode} not found in ${warehouse}` });
      }
      if (item.quantity < parseInt(it.quantity)) {
        await t.rollback();
        return res
          .status(400)
          .json({
            message: `Insufficient quantity for ${it.itemCode} in ${warehouse}`,
          });
      }
      foundItems.push(item);
    }
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const item = foundItems[i];
      item.quantity -= parseInt(it.quantity);
      item.userId = req.session.user.id;
      await item.save({ transaction: t });
    }
    const normalizedItems = items.map((it, idx) => ({
      itemCode: it.itemCode,
      itemName: foundItems[idx].name,
      quantity: parseInt(it.quantity),
    }));
    const totalItems = normalizedItems.length;
    const totalQuantity = normalizedItems.reduce((sum, it) => sum + it.quantity, 0);
    await CheckoutBatch.create(
      {
        items: JSON.stringify(normalizedItems),
        warehouse,
        reason,
        totalItems,
        totalQuantity,
        userId: req.session.user.id,
      },
      { transaction: t },
    );
    await t.commit();
    res.json({
      message: "Checkout successful",
      count: items.length,
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: "Error processing checkout" });
  }
};

exports.getCheckoutHistory = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { reason: { [Op.like]: `%${search}%` } },
        { items: { [Op.like]: `%${search}%` } },
      ];
    }
    const { count, rows } = await CheckoutBatch.findAndCountAll({
      where: whereClause,
      include: [{ model: db.User, as: "user", attributes: ["username"] }],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    const items = rows.map((row) => ({
      id: row.id,
      warehouse: row.warehouse,
      reason: row.reason,
      totalItems: row.totalItems,
      totalQuantity: row.totalQuantity,
      user: row.user,
      createdAt: row.createdAt,
      items: JSON.parse(row.items || "[]"),
    }));
    res.json({
      items,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalItems: count,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching history" });
  }
};

exports.deleteCheckout = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    if (req.session.user.role !== "super admin") {
      await t.rollback();
      return res.status(403).json({ message: "Only Super Admin can delete checkout records" });
    }
    const { id } = req.params;
    const batch = await CheckoutBatch.findByPk(id, { transaction: t });
    if (!batch) {
      await t.rollback();
      return res.status(404).json({ message: "Checkout record not found" });
    }
    const batchItems = JSON.parse(batch.items || "[]");
    for (const it of batchItems) {
      const item = await InventoryItem.findOne({
        where: { code: it.itemCode, warehouse: batch.warehouse },
        transaction: t,
      });
      if (item) {
        item.quantity += parseInt(it.quantity);
        item.userId = req.session.user.id;
        await item.save({ transaction: t });
      } else {
        await InventoryItem.create(
          {
            name: it.itemName,
            code: it.itemCode,
            quantity: parseInt(it.quantity),
            warehouse: batch.warehouse,
            userId: req.session.user.id,
          },
          { transaction: t },
        );
      }
    }
    await CheckoutBatch.destroy({ where: { id }, transaction: t });
    await t.commit();
    res.json({ message: "Checkout record deleted and stock reverted" });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: "Error deleting record" });
  }
};
