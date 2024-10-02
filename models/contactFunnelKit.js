const mongoose = require ('mongoose');

const UsedEmailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  telegramId:{
    type: String,
    unique: false,
    required:false
  }
});

const UsedEmailContactFunnelKit = mongoose.model('ContactsFunnelKit', UsedEmailSchema);

module.exports = UsedEmailContactFunnelKit;
