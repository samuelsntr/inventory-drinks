 'use strict';
 
 module.exports = (sequelize, DataTypes) => {
   const StockTransferBatch = sequelize.define(
     'StockTransferBatch',
     {
       items: {
         type: DataTypes.TEXT,
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
       totalItems: {
         type: DataTypes.INTEGER,
         allowNull: false,
       },
       totalQuantity: {
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
     },
     {
       tableName: 'stock_transfer_batches',
       timestamps: true,
     }
   );
 
   StockTransferBatch.associate = (models) => {
     StockTransferBatch.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
   };
 
   return StockTransferBatch;
 };
