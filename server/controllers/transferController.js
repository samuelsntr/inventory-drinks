const db = require("../models");
const InventoryItem = db.InventoryItem;
const StockTransferBatch = db.StockTransferBatch;
const { Op } = require("sequelize");
const { logAudit } = require("../utils/audit");

exports.transferStock = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { items, fromWarehouse, toWarehouse } = req.body;

    if (!items || items.length === 0) {
        await t.rollback();
        return res.status(400).json({ message: "No items to transfer" });
    }

    if (fromWarehouse === toWarehouse) {
        await t.rollback();
        return res.status(400).json({ message: "Cannot transfer to the same warehouse" });
    }

    const normalizedItems = [];

    for (const item of items) {
        const { itemCode, quantity } = item;

        if (quantity <= 0) {
            throw new Error(`Quantity must be positive for item ${itemCode}`);
        }

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

        let destItem = await InventoryItem.findOne({
          where: { code: itemCode, warehouse: toWarehouse },
          transaction: t
        });

        if (destItem) {
          destItem.quantity += parseInt(quantity);
          destItem.userId = req.session.user.id;
          await destItem.save({ transaction: t });
        } else {
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

        sourceItem.quantity -= parseInt(quantity);
        sourceItem.userId = req.session.user.id;
        await sourceItem.save({ transaction: t });

        normalizedItems.push({
          itemCode,
          itemName: sourceItem.name,
          quantity: parseInt(quantity),
        });
    }

    const totalItems = normalizedItems.length;
    const totalQuantity = normalizedItems.reduce((sum, it) => sum + it.quantity, 0);
    await StockTransferBatch.create(
      {
        items: JSON.stringify(normalizedItems),
        fromWarehouse,
        toWarehouse,
        totalItems,
        totalQuantity,
        userId: req.session.user.id,
      },
      { transaction: t },
    );
    await t.commit();
    await logAudit(req, {
      action: 'transfer.create',
      entityType: 'transfer',
      description: `Transfer from ${fromWarehouse} to ${toWarehouse}`,
      metadata: { totalItems, totalQuantity, items: normalizedItems },
    });
    res.json({ message: "Transfer successful", count: totalItems, totalQuantity });

  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: error.message || "Error processing transfer" });
  }
};

exports.getTransferHistory = async (req, res) => {
    try {
        const { search, page = 1, limit = 10, startDate, endDate } = req.query;
        const offset = (page - 1) * limit;
        const whereClause = {};

        if (search) {
            whereClause[Op.or] = [
                { items: { [Op.like]: `%${search}%` } },
                { fromWarehouse: { [Op.like]: `%${search}%` } },
                { toWarehouse: { [Op.like]: `%${search}%` } },
            ];
        }
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            
            if (start && end) {
                whereClause.createdAt = { [Op.between]: [start, end] };
            } else if (start) {
                whereClause.createdAt = { [Op.gte]: start };
            } else if (end) {
                whereClause.createdAt = { [Op.lte]: end };
            }
        }

        const { count, rows } = await StockTransferBatch.findAndCountAll({
            where: whereClause,
            include: [{ model: db.User, as: 'user', attributes: ['username'] }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const items = rows.map((row) => ({
          id: row.id,
          fromWarehouse: row.fromWarehouse,
          toWarehouse: row.toWarehouse,
          totalItems: row.totalItems,
          totalQuantity: row.totalQuantity,
          user: row.user,
          createdAt: row.createdAt,
          items: JSON.parse(row.items || '[]'),
        }));
        res.json({
            items,
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
    const t = await db.sequelize.transaction();
    try {
        if (req.session.user.role !== 'super admin') {
            await t.rollback();
            return res.status(403).json({ message: "Only Super Admin can delete transfer records" });
        }
        const { id } = req.params;
        const batch = await StockTransferBatch.findByPk(id, { transaction: t });
        if (!batch) {
            await t.rollback();
            return res.status(404).json({ message: "Transfer record not found" });
        }

        const batchItems = JSON.parse(batch.items || '[]');
        for (const it of batchItems) {
          const destItem = await InventoryItem.findOne({
            where: { code: it.itemCode, warehouse: batch.toWarehouse },
            transaction: t,
          });
          if (!destItem || destItem.quantity < parseInt(it.quantity)) {
            await t.rollback();
            return res.status(400).json({ message: `Cannot revert: invalid destination state for ${it.itemCode}` });
          }
          destItem.quantity -= parseInt(it.quantity);
          destItem.userId = req.session.user.id;
          await destItem.save({ transaction: t });

          let sourceItem = await InventoryItem.findOne({
            where: { code: it.itemCode, warehouse: batch.fromWarehouse },
            transaction: t,
          });
          if (sourceItem) {
            sourceItem.quantity += parseInt(it.quantity);
            sourceItem.userId = req.session.user.id;
            await sourceItem.save({ transaction: t });
          } else {
            // Restore item with details from the destination item
            await InventoryItem.create(
              {
                name: it.itemName,
                code: it.itemCode,
                quantity: parseInt(it.quantity),
                price: destItem.price,
                category: destItem.category,
                condition: destItem.condition,
                image: destItem.image,
                note: destItem.note,
                warehouse: batch.fromWarehouse,
                userId: req.session.user.id,
              },
              { transaction: t },
            );
          }
        }

        await StockTransferBatch.destroy({ where: { id }, transaction: t });
        await t.commit();

    await logAudit(req, {
      action: 'transfer.delete',
      entityType: 'transfer',
      entityId: id,
      description: `Deleted transfer batch and reverted stock`,
      metadata: { id, from: batch.fromWarehouse, to: batch.toWarehouse, items: batchItems },
    });
    res.json({ message: "Transfer record deleted and stock reverted" });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: "Error deleting record" });
    }
}
