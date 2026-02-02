const db = require("../models");
const InventoryItem = db.InventoryItem;
const User = db.User;
const { Op } = require("sequelize");

exports.getAllItems = async (req, res) => {
  try {
    const { warehouse, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (warehouse && warehouse !== 'All') {
      whereClause.warehouse = warehouse;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await InventoryItem.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'lastUpdatedBy', attributes: ['username'] }
      ],
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
    res.status(500).json({ message: "Error retrieving inventory items" });
  }
};

exports.getItem = async (req, res) => {
  try {
    const item = await InventoryItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving item" });
  }
};

exports.createItem = async (req, res) => {
  try {
    // Check permissions (Admin and Super Admin only)
    if (req.session.user.role === 'staff') {
      return res.status(403).json({ message: "Access denied. Staff cannot create items." });
    }

    const { name, code, quantity, price, category, condition, image, note, warehouse } = req.body;
    
    // Check if code already exists in that warehouse
    const existingItem = await InventoryItem.findOne({ where: { code, warehouse } });
    if (existingItem) {
      return res.status(400).json({ message: `Item with code ${code} already exists in ${warehouse}` });
    }

    const newItem = await InventoryItem.create({
      name,
      code,
      quantity,
      price,
      category,
      condition,
      image,
      note,
      warehouse,
      userId: req.session.user.id
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating item" });
  }
};

exports.updateItem = async (req, res) => {
  try {
     // Check permissions (Admin and Super Admin only)
     if (req.session.user.role === 'staff') {
        return res.status(403).json({ message: "Access denied. Staff cannot update items." });
      }

    const { id } = req.params;
    const { name, code, quantity, price, category, condition, image, note, warehouse } = req.body;

    const item = await InventoryItem.findByPk(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.name = name || item.name;
    item.code = code || item.code;
    item.quantity = quantity !== undefined ? quantity : item.quantity;
    item.price = price !== undefined ? price : item.price;
    item.category = category || item.category;
    item.condition = condition || item.condition;
    item.image = image || item.image;
    item.note = note || item.note;
    item.warehouse = warehouse || item.warehouse;
    item.userId = req.session.user.id; // Update last updated by

    await item.save();
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating item" });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    // Check permissions (Admin and Super Admin only)
    if (req.session.user.role === 'staff') {
        return res.status(403).json({ message: "Access denied. Staff cannot delete items." });
    }

    const { id } = req.params;
    const item = await InventoryItem.findByPk(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    await item.destroy();
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting item" });
  }
};
