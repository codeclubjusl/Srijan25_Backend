function UserDatabaseMongoDB(dbConnectionString) {
  const logger = require("../log/logger");
  const mongoose = require("mongoose");
  const connectionString = dbConnectionString;
  const User = require("../../models/user");
  const fs = require("fs");
  const path = require("path");

  function loadReferralCodes() {
    try {
      const filePath = path.join(__dirname, "campusReferrals.json"); 
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error loading referral codes:", error);
      return {}; // Return an empty object if file read fails
    }
  }

  this.connect = () => {
    mongoose.connection.on("error", function(err) {
      logger.error("Database connection error: " + err);
    });

    mongoose.connection.on("disconnected", function() {
      logger.info("Database disconnected");
    });

    process.on("SIGINT", function() {
      mongoose.connection.close(function() {
        logger.info("Database process terminated");
        process.exit(0);
      });
    });

    if (!connectionString) {
      throw new Error(
        "Impossible to connect to MongoDB database: connection string not stabilished"
      );
    }

    return mongoose.connect(connectionString);
  };

  this.close = () => {
    return mongoose.connection.close();
  };

  this.createUser = async (user) => {
    if (!user) {
      throw "user cannot be null or undefined";
    }

    let campusReferrals = {};

    if(user.campusReferralCode){
      // Load referral codes from JSON file
      console.log("checking list");
      
      campusReferrals = loadReferralCodes();
      console.log("Loaded campusReferrals:", campusReferrals);
      if (!campusReferrals.hasOwnProperty(user.campusReferralCode)) {
        const error = new Error("Invalid referral code");
        error.status = 400;
        error.keyPattern = { campusReferralCode: 1 }; 
        throw error;
      }
    }

    const {
      name,
      email,
      emailVerified = false,
      password,
      consent = "y",
      phone,
      providers,
      photo = ""
    } = user;

    const newUser = new User({
      name: name,
      email: email,
      emailVerified: emailVerified,
      password: password,
      phone: phone,
      consent: consent,
      providers: providers,
      photo: photo,
    });

    try {
      const savedUser = await newUser.save();
  
    // Increment referral count only after user is successfully created
    if (user.campusReferralCode && user.email !== campusReferrals[user.campusReferralCode]) {
      console.log("updating referral");
      console.log("updating referral for code:", user.campusReferralCode);
      console.log("Current referral data:", campusReferrals[user.campusReferralCode]);
      await this.incrementReferralCount(user.campusReferralCode, campusReferrals);
      console.log("Referral count updated successfully!");
    }
      return savedUser.toJSON();
    } catch (error) {
      console.error("Error updating referral count:", error);
      throw error; 
    }    
  };

  this.incrementReferralCount = async (referralCode, campusReferrals=loadReferralCodes()) => {
    if (!referralCode) {
      return false;
    }
  
    const email = campusReferrals[referralCode];
    if (!email) {
      return false;
    }
  
    const user = await User.findOneAndUpdate(
      { email },
      { $inc: { referralCount: 1 } },
      { new: true }
    );
  
    return !!user;
  };

  this.deleteUserById = (id) => {
    if (!id) {
      throw "id cannot be null or undefined";
    }

    return User.findByIdAndDelete(id).then((deletedUser) => {
      if (!deletedUser) {
        throw "User not found";
      }
      return deletedUser?.toJSON();
    });
  };

  this.getUserById = (id) => {
    if (!id) {
      throw "id cannot be null or undefined";
    }

    return User.findById(id).then((user) => {
      return user?.toJSON();
    });
  };

  this.getUserByEmail = (email, requirePassword = false) => {
    if (requirePassword) {
      return User.findOne({ email: email })
        .select("+password")
        .then((user) => {
          return user;
        });
    } else {
      return User.findOne({ email: email }).then((user) => {
        return user;
      });
    }
  };

  this.getUserByForgotPasswordToken = (token) => {
    return User.findOne({
      forgotPasswordToken: token,
      forgotPasswordExpiry: { $gt: Date.now() },
    })
      .select("+password")
      .then((user) => {
        return user;
      });
  };

  this.getUserByProviderId = (providerUserId) => {
    if (!providerUserId) {
      throw "providerUserId cannot be null or undefined";
    }
    return User.findOne({ "providers.providerUserId": providerUserId }).then(
      (user) => {
        return user?.toJSON(providerUserId);
      }
    );
  };

  this.addProviderUser = async (user) => {
    if (!user) {
      throw "user cannot be null or undefined";
    }
    if (!user.userId) {
      throw "userId field cannot be null or undefined";
    }
    if (!user.providerUserId) {
      throw "providerUserId field cannot be null or undefined";
    }
    if (!user.providerName) {
      throw "providerName field cannot be null or undefined";
    }

    let {
      userId,
      providerUserId,
      providerName,
      loginName = "",
      picture = "",
    } = user;

    return await User.findByIdAndUpdate(
      new mongoose.Types.ObjectId(userId),
      {
        $push: {
          providers: {
            providerUserId,
            providerName,
            loginName,
            picture,
          },
        },
      },
      {
        new: true,
      }
    ).then((savedUser) => {
      return savedUser?.toJSON();
    });
  };

  this.getUsers = () => {
    return User.find({}).then((users) => {
      return users;
    });
  };
  this.addMerchToUser = (email, size, color) => {
    return User.findOneAndUpdate(
      {
        email: email,
      },
      { merchandise: { size, color, status: "pending", } },
      { new: true, runValidator: true }
    );
  };
}

module.exports = UserDatabaseMongoDB;
