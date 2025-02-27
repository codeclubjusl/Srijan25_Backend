function AuthController(database, logger) {
  this.database = database;
  this.logger = logger;

  const CONST = require("../utils/constants");
  const jwtUtil = require("../utils/jwt");
  const BigPromise = require("../middlewares/bigPromise");
  const mailHelper = require("../utils/emailHelper");
  const crypto = require("crypto");
  const otpGenerator = require("otp-generator");
  const cloudinary = require("cloudinary");

  this.getUserSession = BigPromise((req, res, next) => {
    console.log("Inside getUserSession");
    const jwtToken = req.cookies.jwt;
    let authData = jwtUtil.decodeJWT(jwtToken);
    res.json({ sid: authData });
  });

  this.sendOTP = async (user) => {
    const otp = otpGenerator.generate(6, {
      upperCase: false,
      specialChars: false,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
    });

    try {
      // Update OTP and expiry
      user.Otp = otp;
      const OtpExpiry = Date.now() + 60 * 1000;
      user.OtpExpiry = OtpExpiry;
      await user.save({ validateBeforeSave: false });

      console.log(`OTP generated: ${otp}`);

      // Send OTP via email
      await mailHelper({
        email: user.email,
        subject: "Srijan 2025: OTP Verification",
        message: `Your OTP for Email Verification is ${otp}`,
      });

      console.log(`OTP sent successfully to ${user.email}`);
      return {
        success: true,
        expiry: OtpExpiry,
      };
    } catch (error) {
      console.log(`Failed to send OTP: ${error.message}`);
      return {
        success: false,
      };
    }
  };

  this.login = BigPromise(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await this.database.getUserByEmail(email, true);
    console.log(user);
    if (!user) {
      const message = "Email not found";
      this.logger.info(`Login rejected [${email}]. ${message}`);
      return res.status(CONST.httpStatus.NOT_FOUND).json({ 
        error: { 
          message, 
          field: "email" 
        } 
      });
    }
    const isValidPassword = await user.isValidatedPassword(password);

    if (!isValidPassword) {
      const message = "Wrong password";
      console.log(message);
      this.logger.info(`Login rejected [${email}]. ${message}`);
      return res.status(CONST.httpStatus.UNAUTHORIZED).json({ 
        error: { 
          message, 
          field: "loginPassword" 
        } 
      });
    }

    const token = jwtUtil.generateJWT(user.id, user.email);
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false, // Secure only in production
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // "Lax" allows cookies in local dev
      maxAge: CONST.maxAgeCookieExpired,
    });
    this.logger.info(`Session started for user [${user.email}]`);

    let authData = {
      id: user._id,
    };
    res.json({ sid: authData });
  });

  this.logout = BigPromise((req, res, next) => {
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false, // Secure only in production
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // "Lax" allows cookies in local dev
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  });

  this.register = BigPromise(async (req, res, next) => {
    const user = req.body;
    //console.log(user);
    const createdUser = await this.database.createUser(user);
    const userFromDB = await this.database.getUserByEmail(user.email);
    const token = jwtUtil.generateJWT(user.id, user.email, null, true);

    // Use sendOTP function
    const otpSent = await this.sendOTP(userFromDB);

    if (!otpSent.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again.",
      });
    }

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false, // Secure only in production
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // "Lax" allows cookies in local dev
      maxAge: CONST.maxAgeCookieExpired,
    });

    let authData = {
      id: createdUser.id,
      providerId: null,
    };

    res
      .status(CONST.httpStatus.CREATED)
      .json({ sid: authData, OtpExpiry: otpSent.expiry });
  });

  this.addReferral = BigPromise(async (req, res, next) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, message: "Referral code is required" });
        }

        const success = await this.database.incrementReferralCount(code);

        if (success) {
            return res.status(200).json({ success: true, message: "Referral count updated successfully" });
        } else {
            return res.status(404).json({ success: false, message: "Invalid referral code or referrer not found" });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
});

  this.resendOTP = BigPromise(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Fetch user by email
    const user = await this.database.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Use sendOTP function
    const otpSent = await this.sendOTP(user);

    if (!otpSent.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to resend OTP. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      expiry: otpSent.expiry,
      message: "OTP resent successfully",
    });
  });

  this.EmailVerify = BigPromise(async (req, res, next) => {
    const { email, otp } = req.body;
    console.log(email, otp);
    const user = await this.database.getUserByEmail(email);
    if (!user) {
      const message = "No user with this email";
      console.log("Checking email existence");
      this.logger.info(`Email Verification rejected [${email}]. ${message}`);
      return res.status(CONST.httpStatus.NOT_FOUND).json({ error: message });
    }

    if (user.Otp != otp) {
      const message = "OTP does not match";
      console.log("Checking OTP");
      this.logger.info(`Email Verification rejected [${email}]. ${message}`);
      return res.status(CONST.httpStatus.NOT_FOUND).json({ error: message });
    } else {
      user.email.verified = true;
    }

    user.Otp = undefined;
    user.OtpExpiry = undefined;
    user.emailVerified = true;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  });

  this.forgotPassword = BigPromise(async (req, res, next) => {
    const { email } = req.body;
    console.log(email);
    const user = await this.database.getUserByEmail(email, true);
    if (!user) {
      const message = "No user with this email";
      console.log("Checking email existence");
      this.logger.info(`Forgot password rejected [${email}]. ${message}`);
      return res.status(CONST.httpStatus.NOT_FOUND).json({ error: message });
    }

    const forgotToken = user.getForgotPasswordToken();
    await user.save({ validateBeforeSave: false });
    console.log("hello");
    const myUrl = `http://${process.env.FRONT_HOST}:${process.env.FRONT_PORT}/reset-password/${forgotToken}`;

    const message = `Copy paste this link in ur URL and hit enter \n\n ${myUrl}`;

    try {
      await mailHelper({
        email: user.email,
        subject: "Srijan 2025 : Password reset email",
        message,
      });

      res.status(200).json({
        success: true,
        message: "Email sent successfully",
      });
    } catch (error) {
      user.forgotPasswordToken = undefined;
      user.forgotPasswordExpiry = undefined;
      await user.save({ validateBeforeSave: false });

      this.logger.error(`Forgot password email not sent for user [${email}]`);
      return res.status(500).json({
        success: false,
        message: "Email could not be sent",
        error: error.message,
      });
    }
  });

  this.passwordReset = BigPromise(async (req, res, next) => {
    const token = req.params.token;
    const encryToken = crypto.createHash("sha256").update(token).digest("hex");

    //console.log(encryToken);

    const user = await this.database.getUserByForgotPasswordToken(encryToken);

    if (!user) {
      const message = "Email not found";
      this.logger.info(`Password Reset rejected`);
      return res.status(CONST.httpStatus.NOT_FOUND).json({ error: message });
    }

    if (req.body.password != req.body.confirmPassword) {
      this.logger.error("Password and Confirm Password do not match");
    }

    user.password = req.body.password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save();

    console.log(user);

    const cookieToken = jwtUtil.generateJWT(user.id, user.email);
    res.cookie("jwt", cookieToken, {
      httpOnly: true,
      maxAge: CONST.maxAgeCookieExpired,
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  });

  this.changePassword = BigPromise(async (req, res, next) => {
    try {
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res
          .status(CONST.httpStatus.BAD_REQUEST)
          .json({ error: "Both old and new passwords are required" });
      }

      // Extract user from JWT
      const jwtToken = req.cookies.jwt;
      if (!jwtToken) {
        return res
          .status(CONST.httpStatus.UNAUTHORIZED)
          .json({ error: "No token provided" });
      }
      const authData = jwtUtil.decodeJWT(jwtToken);
      if (!authData || !authData.email) {
        return res
          .status(CONST.httpStatus.UNAUTHORIZED)
          .json({ error: "Invalid or expired token" });
      }

      // Find the user
      let user = await this.database.getUserByEmail(authData.email, true);
      if (!user) {
        return res
          .status(CONST.httpStatus.NOT_FOUND)
          .json({ error: "User not found" });
      }

      // Check if old password matches
      const isValidPassword = await user.isValidatedPassword(oldPassword);
      if (!isValidPassword) {
        return res
          .status(CONST.httpStatus.UNAUTHORIZED)
          .json({ error: "Incorrect old password" });
      }

      // Update to new password
      user.password = newPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      res
        .status(CONST.httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Something went wrong" });
    }
  });

  this.oauthGoogleLogin = async (req, res) => {
    try {
      console.log("🚀 Starting OAuth Google login handler");
      //console.log("User object:", req.user);

      if (!req.user) {
        console.log("❌ No user in request");
        return res.redirect(process.env.FAILED_LOGIN_REDIRECT);
      }
      const { user, isNewUser } = req.user;

      const token = jwtUtil.generateJWT(user.id, user.email, user.providers, isNewUser);
      //console.log("🔐 Generated JWT:", token);

      res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" ? true : false, // Secure only in production
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // "Lax" allows cookies in local dev
        maxAge: CONST.maxAgeCookieExpired,
      });

      console.log("✅ Authentication successful, redirecting...");
      res.send(`
                <script>
                    window.close();
                </script>
            `);
    } catch (error) {
      console.error("💥 OAuth login error:", error);
      res.redirect(process.env.FAILED_LOGIN_REDIRECT + "?error=server_error");
    }
  };

  this.updateDetails = BigPromise(async (req, res, next) => {
    try {
      const { name, phone, merchandise, consent } = req.body;

      const jwtToken = req.cookies.jwt;
      if (!jwtToken) {
        return res
          .status(CONST.httpStatus.UNAUTHORIZED)
          .json({ error: "No token provided" });
      }
      const authData = jwtUtil.decodeJWT(jwtToken);
      if (!authData || !authData.email) {
        return res
          .status(CONST.httpStatus.UNAUTHORIZED)
          .json({ error: "Invalid or expired token" });
      }

      let user = await this.database.getUserByEmail(authData.email);
      if (!user) {
        return res
          .status(CONST.httpStatus.NOT_FOUND)
          .json({ error: "User not found" });
      }

      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (consent !== undefined) user.consent = consent; 

      if (merchandise) {
        if (!user.merchandise) user.merchandise = {}; 
        if (merchandise.size) user.merchandise.size = merchandise.size;
        if (merchandise.color) user.merchandise.color = merchandise.color;
      }

      if (req.files && req.files.photo) {
        // Delete old Cloudinary image if not Google photo
        if (user.photo.id && !user.photo.isGooglePhoto) {
            await cloudinary.v2.uploader.destroy(user.photo.id);
        }
    
        // Upload new photo to Cloudinary
        const result = await cloudinary.v2.uploader.upload(
            req.files.photo.tempFilePath,
            {
                folder: "users",
                width: 150,
                crop: "scale",
            }
        );
    
        // Update user photo details
        user.photo.url = result.secure_url;
        user.photo.id = result.public_id;
        user.photo.isGooglePhoto = false; 
    }

      await user.save();

      res.status(200).json({
        success: true,
        message: "User details updated successfully",
        user: {
          name: user.name,
          phone: user.phone,
          photourl: user.photo.url,
          consent: user.consent,
          merchandise: user.merchandise,
        },
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res
        .status(CONST.httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Something went wrong" });
    }
  });
}

const logger = require("../services/log/logger");
const database = require("../services/database");
const { http } = require("winston");
const authController = new AuthController(database, logger);

module.exports = authController;
