const Payment = require("./../../models/payment");
const mongoose = require("mongoose");

/**
 * Increments the usedCount and adds a user ID to the users array in the payment document.
 * @param {String} paymentId - The ID of the payment document.
 * @param {String} userId - The user ID to add.
 * @returns {Promise<Object>} - The updated payment document.
 */
// async function incrementCountAndAddUser(paymentId, userId) {
//   return await Payment.findByIdAndUpdate(
//     paymentId,
//     {
//       $inc: { usedCount: 1 },
//       $addToSet: { users: { user: new mongoose.Types.ObjectId(userId) } }
//     },
//     { new: true }
//   );
// }
async function incrementCountAndAddUser() {
  return await Payment.findOneAndUpdate(
    { name: "earlyBirds" },
    {
      $inc: { usedCount: 1 },
    },
    { new: true }
  );
}

/**
 * Checks if the usedCount has reached maxUses.
 * @param {String} paymentId - The ID of the payment document.
 * @returns {Promise<Boolean>} - Returns true if maxUses is reached, otherwise false.
 */
async function checkDiscountAvailable() {
  const payment = await Payment.findOne({ name: "earlyBirds" });
  console.log(payment);
  if (!payment) throw new Error("Payment not found");
  return payment.usedCount < payment.maxUses;
}

module.exports = { incrementCountAndAddUser, checkDiscountAvailable };

