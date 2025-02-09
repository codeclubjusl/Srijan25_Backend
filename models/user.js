const { Schema, model, ObjectId } = require("mongoose");
const { isEmail, isMobilePhone } = require("validator");
const logger = require("../services/log/logger");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const CONST = require("../utils/constants")

const UserSchema = new Schema({
  id: {
    type: ObjectId,
  },
  name: {
    type: String,
    required: [true, "Please enter a full name"],
    maxlength: [64, "Maximum full name length is 64"],
  },
  password: {
    type: String,
    // required: [true, "Please enter a password"],
    maxlength: [64, "Maximum password length is 64"],
    select: false,
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Please enter an email"],
    lowercase: true,
    maxlength: [128, "Maximum password length is 128"],
    validate: [isEmail, "Please enter a valid email"],
    verified: {
      type: Boolean,
      default: false
    }
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    // required: [true, "Please provide mobile number"],
    validate: {
      validator: function(v) {
        return isMobilePhone(v, "en-IN");
      },
      message: (props) =>
        `${props.value} is not a valid mobile number for India!`,
    },

  },
  consent: {
    type: String,
    enum: ["y", "n"],
    // required: [true, "Consent is required"]
  },
  photo: {
    url: {
      type: String,
    },
  },
  providers: {
    type: Array,
    default: [],
  },
  updated: {
    type: Date,
    default: Date.now,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  forgotPasswordToken: String,
  forgotPasswordExpiry: Date,
  Otp: String,
  OtpExpiry: Date,
  merchandise: {
    type: new Schema(
      {
        size: {
          type: String,
          enum: CONST.merchandiseTypes.size
        },
        color: {
          type: String,
          enum: CONST.merchandiseTypes.color
        }
      }
    ), default: null
  },
});



UserSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id;
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

UserSchema.pre("save", async function(next) {
  if (this.password) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

//validate the password
UserSchema.methods.isValidatedPassword = async function(usersentPassword) {
  return await bcrypt.compare(usersentPassword, this.password);
};

UserSchema.post("save", function(doc, next) {
  let savedUser = doc;
  logger.info(`User with email [${savedUser.email}] succesfully created`);
  next();
});

UserSchema.pre("findOneAndUpdate", function(next) {
  this.options.runValidators = true;
  next();
});

UserSchema.methods.getForgotPasswordToken = function() {
  const forgotToken = crypto.randomBytes(20).toString("hex");

  this.forgotPasswordToken = crypto
    .createHash("sha256")
    .update(forgotToken)
    .digest("hex");

  //time of token
  this.forgotPasswordExpiry = Date.now() + 20 * 60 * 1000;

  return forgotToken;
};

const User = model("User", UserSchema);

module.exports = User;
