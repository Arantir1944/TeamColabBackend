const db = require("../models");

(async () => {
    try {
        await db.sequelize.sync({ force: false }); // Set to true if you want to drop & recreate
        console.log("✅ Tables created successfully.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to create tables:", err);
        process.exit(1);
    }
})();
