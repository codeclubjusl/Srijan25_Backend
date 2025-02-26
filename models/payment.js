const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    default: "earlyBirds"
  },
  maxUses: {
    type: Number,
    default: 75,
  },
  usedCount: {
    type: Number,
    default: 0
  },
  users: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    }
  ],
  created: {
    type: Date,
    default: Date.now,
  },
});

const Payment = mongoose.model("Payment", PaymentSchema);

module.exports = Payment;
