const sequelize = require("../config/database");
const fs = require("fs");
const path = require("path");

const modelsPath = path.join(__dirname, "../models");

fs.readdirSync(modelsPath).forEach(file => {
  if (file.endsWith(".model.js")) {
    require(path.join(modelsPath, file));
  }
});

(async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("Base de datos sincronizada");
    process.exit();
  } catch (error) {
    console.error("Error sincronizando DB:", error);
    process.exit(1);
  }
})();