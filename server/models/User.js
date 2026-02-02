'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('super admin', 'admin', 'staff'),
      allowNull: false,
    },
  },
  {
    tableName: "users",
    freezeTableName: true,
  }
);
  return User;
};
