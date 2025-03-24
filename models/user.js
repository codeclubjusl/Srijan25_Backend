const { Schema, model, ObjectId } = require("mongoose");
const { isEmail, isMobilePhone } = require("validator");
const logger = require("../services/log/logger");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const CONST = require("../utils/constants");
const NotificationSchema = require("./notification");
const MerchandiseSchema = require("./merchandise");

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
  },
  emailVerified: {
    type: Boolean,
    default: false, 
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
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
    default: "y",
  },
  referralCount: {
    type: Number,
    default: 0,
  },
  photo: {
    url: String,
    id: { type: String, default: "" },
    isGooglePhoto: Boolean,
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
  institution: {
    type: String,
    default: "Jadavpur University",
  },
  userInstitution: String,
  wishlist: {
    type: [
      {
        type: ObjectId,
        ref: "Event",
      },
    ],
    default: [],
  },
  registeredEvents: {
    type: [
      {
        type: ObjectId,
        ref: "Event",
      },
    ],
    default: [],
  },
  pendingEvents: {
    type: [
      {
        type: ObjectId,
        ref: "Event",
      },
    ],
    default: [],
  },
  invitations: {
    type: [
      {
        event: {
          type: ObjectId,
          ref: "Event",
        },
        group: {
          type: ObjectId,
          ref: "Group",
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
      },
    ],
    default: [],
  },
  notifications: [NotificationSchema],
  merchandise: {
    type: MerchandiseSchema,
    default: null,
  },
  merchandise2:[MerchandiseSchema],
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

UserSchema.index({ email: 1 }, { unique: true });


const User = model("User", UserSchema);

module.exports = User;
