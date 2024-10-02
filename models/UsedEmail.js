const mongoose = require("mongoose");

const UsedEmailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  isActive: Boolean,
});

const UsedEmail = mongoose.model("activosEnigmario", UsedEmailSchema);

module.exports = UsedEmail;
