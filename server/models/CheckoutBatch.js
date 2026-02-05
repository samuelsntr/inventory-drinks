'use strict';

module.exports = (sequelize, DataTypes) => {
  const CheckoutBatch = sequelize.define(
    'CheckoutBatch',
    {
      items: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      warehouse: {
        type: DataTypes.ENUM('JAAN', 'DW'),
        allowNull: false,
        defaultValue: 'JAAN',
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      totalItems: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      totalQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    },
    {
      tableName: 'checkout_batches',
      timestamps: true,
    },
  );

  CheckoutBatch.associate = function (models) {
    CheckoutBatch.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return CheckoutBatch;
};
