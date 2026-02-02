const db = require("../models");
const InventoryItem = db.InventoryItem;
const StockTransfer = db.StockTransfer;
const { Op } = require("sequelize");

exports.transferStock = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { items, fromWarehouse, toWarehouse } = req.body; // items is array of { itemCode, quantity }

    if (!items || items.length === 0) {
        await t.rollback();
        return res.status(400).json({ message: "No items to transfer" });
    }

    if (fromWarehouse === toWarehouse) {
        await t.rollback();
        return res.status(400).json({ message: "Cannot transfer to the same warehouse" });
    }

    const transferRecords = [];

    for (const item of items) {
        const { itemCode, quantity } = item;

        if (quantity <= 0) {
            throw new Error(`Quantity must be positive for item ${itemCode}`);
        }

        // 1. Find source item
        const sourceItem = await InventoryItem.findOne({
          where: { code: itemCode, warehouse: fromWarehouse },
          transaction: t
        });

        if (!sourceItem) {
          throw new Error(`Item ${itemCode} not found in ${fromWarehouse}`);
        }

        if (sourceItem.quantity < quantity) {
          throw new Error(`Insufficient quantity for ${itemCode} in ${fromWarehouse}`);
        }

        // 2. Find or create destination item
        let destItem = await InventoryItem.findOne({
          where: { code: itemCode, warehouse: toWarehouse },
          transaction: t
        });

        if (destItem) {
          destItem.quantity += parseInt(quantity);
          destItem.userId = req.session.user.id;
          await destItem.save({ transaction: t });
        } else {
          // Create new item in destination
          destItem = await InventoryItem.create({
            name: sourceItem.name,
            code: sourceItem.code,
            quantity: parseInt(quantity),
            price: sourceItem.price,
            category: sourceItem.category,
            condition: sourceItem.condition,
            image: sourceItem.image,
            note: sourceItem.note,
            warehouse: toWarehouse,
            userId: req.session.user.id
          }, { transaction: t });
        }

        // 3. Decrease source quantity
        sourceItem.quantity -= parseInt(quantity);
        sourceItem.userId = req.session.user.id;
        await sourceItem.save({ transaction: t });

        // 4. Log transfer
        const record = await StockTransfer.create({
          itemCode,
          itemName: sourceItem.name,
          fromWarehouse,
          toWarehouse,
          quantity,
          userId: req.session.user.id
        }, { transaction: t });
        
        transferRecords.push(record);
    }

    await t.commit();
    res.json({ message: "Transfer successful", records: transferRecords });

  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: error.message || "Error processing transfer" });
  }
};

exports.getTransferHistory = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const whereClause = {};

        if (search) {
            whereClause[Op.or] = [
                { itemCode: { [Op.like]: `%${search}%` } },
                { itemName: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await StockTransfer.findAndCountAll({
            where: whereClause,
            include: [{ model: db.User, as: 'user', attributes: ['username'] }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            items: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            totalItems: count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching history" });
    }
}

// Just for deleting history record (Does NOT revert stock automatically for safety reasons, unless requested)
// Usually stock transfer deletion should be restricted. Assuming just deleting the log for now.
exports.deleteTransfer = async (req, res) => {
    try {
        if (req.session.user.role !== 'super admin') {
            return res.status(403).json({ message: "Only Super Admin can delete transfer records" });
        }
        const { id } = req.params;
        await StockTransfer.destroy({ where: { id } });
        res.json({ message: "Transfer record deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting record" });
    }
}
