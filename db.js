const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://SharpodsDB:tiagoo1223@database.6ath1.mongodb.net/?retryWrites=true&w=majority&appName=sharpodsDb");
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('Error connecting to MongoDB', err);
    process.exit(1); 
  }
};

module.exports = connectDB;
