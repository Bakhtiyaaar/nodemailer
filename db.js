const mongoose = require('mongoose');

const connectDB = async () => {
	try {
		await mongoose.connect("mongodb://127.0.0.1:27017/my_auth_db");
		console.log("MongoDB подключена!");
	} catch (error) {
		console.error("DB Error:", error.message);
		process.exit(1);
	}
};

module.exports = connectDB;