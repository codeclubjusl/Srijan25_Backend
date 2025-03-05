const { default: mongoose } = require("mongoose");
const CONST = require("../utils/constants");

const MerchandiseSchema = new mongoose.Schema({
  size: {
    type: String,
    enum: CONST.merchandiseTypes.size,
  },
  color: {
    type: String,
    enum: CONST.merchandiseTypes.color,
  },
  status: {
    type: String,
    enum: CONST.paymentStatus,
  }
});



module.exports = MerchandiseSchema;