//dQYgb5GUo0T7Cbhn

const mongoose = require("mongoose");

require("dotenv").config;

const dbUrl = process.env.DB_URI || "";

const connectDB = async () => {
  try {
    await mongoose.connect(dbUrl).then((data) => {
      console.log(`Database connected with ${data.connection.host}`);
    });
  } catch (error) {
    console.log(error.message);
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
