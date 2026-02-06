const db = require("../models");

async function logAudit(req, { action, entityType, entityId, description, metadata }) {
  try {
    const user = req.session?.user || {};
    const payload = {
      userId: user.id || null,
      username: user.username || null,
      role: user.role || null,
      action,
      entityType: entityType || null,
      entityId: entityId != null ? String(entityId) : null,
      description: description || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ip: req.ip,
      userAgent: req.headers["user-agent"] || null,
    };
    await db.AuditLog.create(payload);
  } catch (err) {
    // avoid breaking the request if logging fails
    console.error("Audit log error:", err.message);
  }
}

module.exports = { logAudit };
