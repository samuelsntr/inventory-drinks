const db = require("../models");
const InventoryItem = db.InventoryItem;
const CheckoutBatch = db.CheckoutBatch;
const StockTransferBatch = db.StockTransferBatch;
const { Op } = require("sequelize");

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Inventory Stats
    const totalItems = await InventoryItem.count();
    const totalQuantity = await InventoryItem.sum("quantity") || 0;
    
    // Calculate total value (price * quantity)
    // Sequelize doesn't have a direct "sum product" without raw query easily, 
    // so we can fetch all and calculate, or use a raw query. 
    // Given the scale, fetching specific fields might be fine, but raw query is better for performance.
    const [results] = await db.sequelize.query(
      "SELECT SUM(quantity * price) as totalValue FROM inventory_items"
    );
    const totalValue = results[0].totalValue || 0;

    const lowStockCount = await InventoryItem.count({
      where: {
        quantity: {
          [Op.lte]: 5 // Threshold for low stock
        }
      }
    });

    // 2. Recent Activity (Last 5 combined)
    const recentCheckouts = await CheckoutBatch.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      include: [{ model: db.User, as: "user", attributes: ["username"] }]
    });

    const recentTransfers = await StockTransferBatch.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      include: [{ model: db.User, as: "user", attributes: ["username"] }]
    });

    // Combine and sort
    const recentActivity = [
      ...recentCheckouts.map(c => ({
        type: "checkout",
        id: c.id,
        user: c.user?.username,
        description: `Checkout: ${c.reason || 'No reason'}`,
        count: c.totalItems,
        quantity: c.totalQuantity,
        date: c.createdAt
      })),
      ...recentTransfers.map(t => ({
        type: "transfer",
        id: t.id,
        user: t.user?.username,
        description: `Transfer: ${t.fromWarehouse} -> ${t.toWarehouse}`,
        count: t.totalItems,
        quantity: t.totalQuantity,
        date: t.createdAt
      }))
    ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

    // 3. Chart Data: Checkouts last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyCheckouts = await CheckoutBatch.findAll({
      where: {
        createdAt: {
          [Op.gte]: sevenDaysAgo
        }
      },
      attributes: [
        [db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'date'],
        [db.sequelize.fn('SUM', db.sequelize.col('totalQuantity')), 'totalQty']
      ],
      group: [db.sequelize.fn('DATE', db.sequelize.col('createdAt'))],
      order: [[db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'ASC']]
    });

    // Format chart data to ensure all days are represented
    const chartData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      
      const found = dailyCheckouts.find(item => item.get('date') === dateString);
      chartData.push({
        date: new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: dateString,
        quantity: found ? parseInt(found.get('totalQty')) : 0
      });
    }
    chartData.reverse();

    // 4. Warehouse Distribution
    const warehouseStats = await InventoryItem.findAll({
        attributes: [
            'warehouse',
            [db.sequelize.fn('SUM', db.sequelize.col('quantity')), 'totalQty']
        ],
        group: ['warehouse']
    });

    res.json({
      stats: {
        totalItems,
        totalQuantity,
        totalValue,
        lowStockCount
      },
      recentActivity,
      chartData,
      warehouseStats
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: "Error fetching dashboard data", error: error.message });
  }
};
