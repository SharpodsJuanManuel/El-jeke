const mongoose = require("mongoose");

const UsedEmailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  telegramId: {
    type: String,
    unique: false,
    required: false,
  },
});

const correosUsados = mongoose.model(
  "JekeUsersEmailUsed",
  UsedEmailSchema
);

module.exports = correosUsados;
