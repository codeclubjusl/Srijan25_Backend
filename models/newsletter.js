const { Schema, model, ObjectId } = require("mongoose")
const { isEmail } = require("validator");

const NewsletterSchema = new Schema({
  id: {
    type: ObjectId,
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Please enter an email"],
    lowercase: true,
    maxlength: [128, "Maximum password length is 128"],
    validate: [isEmail, "Please enter a valid email"],
  },
});

const Newsletter = model("Newsletter", NewsletterSchema);

module.exports = Newsletter;
