const db = require("../models");
const InventoryItem = db.InventoryItem;
const CheckoutLog = db.CheckoutLog;
const { Op } = require("sequelize");

exports.checkoutItem = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { itemCode, quantity, reason } = req.body;
    const warehouse = 'JAAN'; // Requirement says from JAAN

    if (quantity <= 0) {
        await t.rollback();
        return res.status(400).json({ message: "Quantity must be positive" });
    }

    const item = await InventoryItem.findOne({
      where: { code: itemCode, warehouse },
      transaction: t
    });

    if (!item) {
      await t.rollback();
      return res.status(404).json({ message: `Item ${itemCode} not found in ${warehouse}` });
    }

    if (item.quantity < quantity) {
      await t.rollback();
      return res.status(400).json({ message: `Insufficient quantity in ${warehouse}` });
    }

    // Decrease quantity
    item.quantity -= parseInt(quantity);
    item.userId = req.session.user.id;
    await item.save({ transaction: t });

    // Log checkout
    await CheckoutLog.create({
      itemCode,
      itemName: item.name,
      warehouse,
      quantity,
      reason,
      userId: req.session.user.id
    }, { transaction: t });

    await t.commit();
    res.json({ message: "Checkout successful", item });

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
        { itemCode: { [Op.like]: `%${search}%` } },
        { itemName: { [Op.like]: `%${search}%` } },
        { reason: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await CheckoutLog.findAndCountAll({
      where: whereClause,
      include: [{ model: db.User, as: "user", attributes: ["username"] }],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      items: rows,
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
  try {
    if (req.session.user.role !== "super admin") {
      return res
        .status(403)
        .json({ message: "Only Super Admin can delete checkout records" });
    }

    const { id } = req.params;
    await CheckoutLog.destroy({ where: { id } });
    res.json({ message: "Checkout record deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting record" });
  }
};
