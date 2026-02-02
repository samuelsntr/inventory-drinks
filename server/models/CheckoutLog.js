'use strict';

module.exports = (sequelize, DataTypes) => {
  const CheckoutLog = sequelize.define('CheckoutLog', {
    itemCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    itemName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    warehouse: {
      type: DataTypes.ENUM('JAAN', 'DW'),
      allowNull: false,
      defaultValue: 'JAAN',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false, // 'Bar', 'Open Bottle', or manual input
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
    tableName: 'checkout_logs',
    timestamps: true,
  });

  CheckoutLog.associate = function(models) {
    CheckoutLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return CheckoutLog;
};
