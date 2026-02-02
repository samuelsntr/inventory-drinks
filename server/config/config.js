require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_DEV_USERNAME || "root",
    password: process.env.DB_DEV_PASSWORD || "",
    database: process.env.DB_DEV_NAME || "jaan_rest",
    host: process.env.DB_DEV_HOST || "127.0.0.1",
    dialect: "mysql",
    port: process.env.DB_DEV_PORT || 3306
  },
  test: {
    username: process.env.DB_TEST_USERNAME || "root",
    password: process.env.DB_TEST_PASSWORD || null,
    database: process.env.DB_TEST_NAME || "jaan_rest",
    host: process.env.DB_TEST_HOST || "127.0.0.1",
    dialect: "mysql"
  },
  production: {
    username: process.env.DB_DEV_USERNAME || "root",
    password: process.env.DB_DEV_PASSWORD || null,
    database: process.env.DB_DEV_NAME || "jaan_rest",
    host: process.env.DB_DEV_HOST || "127.0.0.1",
    dialect: "mysql"
  }
};
