const db = require("../models");
const { Op } = require("sequelize");

exports.getLogs = async (req, res) => {
  try {
    const { user, action, entityType, page = 1, limit = 10, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (user) {
      where.username = { [Op.like]: `%${user}%` };
    }
    if (action) {
      where.action = { [Op.like]: `%${action}%` };
    }
    if (entityType) {
      where.entityType = entityType;
    }
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);
      if (start && end) {
        where.createdAt = { [Op.between]: [start, end] };
      } else if (start) {
        where.createdAt = { [Op.gte]: start };
      } else if (end) {
        where.createdAt = { [Op.lte]: end };
      }
    }

    const { count, rows } = await db.AuditLog.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{ model: db.User, as: "user", attributes: ["username"] }],
    });

    res.json({
      logs: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalItems: count,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving audit logs" });
  }
};
