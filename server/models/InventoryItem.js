'use strict';

module.exports = (sequelize, DataTypes) => {
  const InventoryItem = sequelize.define('InventoryItem', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    condition: {
      type: DataTypes.ENUM('good', 'bad'),
      allowNull: false,
      defaultValue: 'good',
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    warehouse: {
      type: DataTypes.ENUM('JAAN', 'DW'),
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  }, {
    tableName: 'inventory_items',
    timestamps: true,
  });

  InventoryItem.associate = function(models) {
    InventoryItem.belongsTo(models.User, { foreignKey: 'userId', as: 'lastUpdatedBy' });
  };

  return InventoryItem;
};
