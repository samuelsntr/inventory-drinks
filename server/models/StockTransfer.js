'use strict';

module.exports = (sequelize, DataTypes) => {
  const StockTransfer = sequelize.define('StockTransfer', {
    itemCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    itemName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fromWarehouse: {
      type: DataTypes.ENUM('JAAN', 'DW'),
      allowNull: false,
    },
    toWarehouse: {
      type: DataTypes.ENUM('JAAN', 'DW'),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  }, {
    tableName: 'stock_transfers',
    timestamps: true,
  });

  StockTransfer.associate = function(models) {
    StockTransfer.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return StockTransfer;
};
