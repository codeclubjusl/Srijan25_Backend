function AuthController(database, logger) {

    this.database = database
    this.logger = logger

    const CONST = require("../utils/constants")
    const bcrypt = require("bcrypt")
    // const DuplicatedEmailError = require("../utils/customErrors")
    const jwtUtil = require("../utils/jwt")
    const BigPromise = require("../middlewares/bigPromise")
    const mailHelper = require('../utils/emailHelper');
    const crypto = require("crypto");
    const otpGenerator = require('otp-generator')

    this.getUserSession = BigPromise((req,res,next) => {
        const jwtToken = req.cookies.jwt
        let authData = jwtUtil.decodeJWT(jwtToken)
        res.json({ sid : authData })
    })

    this.login = BigPromise(async (req,res,next) => {
        const { email, password } = req.body
        const user = await this.database.getUserByEmail(email, true)
        console.log(user)
        if (!user) {
            const message = "Email not found"
            this.logger.info(`Login rejected [${email}]. ${message}`)
            return res.status(CONST.httpStatus.NOT_FOUND).json({ error: message })
        }
        const isValidPassword = await user.isValidatedPassword(password);
        
        if (!isValidPassword) {
            const message = "Wrong password"
            console.log(message)
            this.logger.info(`Login rejected [${email}]. ${message}`)
            return res.status(CONST.httpStatus.UNAUTHORIZED).json({ error: message })
        }

        const token = jwtUtil.generateJWT(user.id, user.email)
        res.cookie("jwt", token, { httpOnly: true, maxAge: CONST.maxAgeCookieExpired })
        this.logger.info(`Session started for user [${user.email}]`)
        
        let authData = {
            id: user.id
        }
        res.json({ sid: authData })
    })

    this.register = BigPromise(async (req,res,next) => {
        const user = req.body
        console.log(user)
        const createdUser = await this.database.createUser(user)
        const userFromDB = await this.database.getUserByEmail(user.email, true);
        const token = jwtUtil.generateJWT(user.id, user.email)

        // Generate OTP for Email Verification
        const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false, lowerCaseAlphabets: false, upperCaseAlphabets: false });
        try{
            userFromDB.Otp = otp;
            userFromDB.OtpExpiry = Date.now() + 10 * 60 * 1000;
            await userFromDB.save({ validateBeforeSave: false });
            console.log("OTP saved successfully:", otp);
        }catch(err){
            console.log(err)
        }
        
        

        // Send OTP Email
        try {
            await mailHelper({
                email: createdUser.email,
                subject: "Srijan 2025: Email Verification OTP",
                message: `Your OTP for Email Verification is ${otp}`,
            });

            console.log(`OTP sent successfully to ${createdUser.email}`);
        } catch (error) {
            createdUser.Otp = undefined;
            createdUser.OtpExpiry = undefined;
            await createdUser.save({ validateBeforeSave: false });
            this.logger.error(`Failed to send OTP to email: ${createdUser.email}, Error: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: "Email could not be sent",
                error: error
            });
        }

        res.cookie("jwt", token, { httpOnly: true, maxAge: CONST.maxAgeCookieExpired })
        
        let authData = {
            id: createdUser.id, 
            providerId: null
        }
        res.status(CONST.httpStatus.CREATED).json({ sid : authData })
    })

    this.EmailVerify = BigPromise(async (req, res, next) => {

        const {email, otp} = req.body;
        const user = await this.database.getUserByEmail(email, true)
        if (!user) {
            const message = "No user with this email"
            console.log("Checking email existence");
            this.logger.info(`Email Verification rejected [${email}]. ${message}`)
            return res.status(CONST.httpStatus.NOT_FOUND).json({ error: message })
        }

        if(user.Otp != otp){
            const message = "OTP does not match"
            console.log("Checking OTP");
            this.logger.info(`Email Verification rejected [${email}]. ${message}`)
            return res.status(CONST.httpStatus.NOT_FOUND).json({ error: message })
        }else{
            user.email.verified = true;
        }

        user.Otp = undefined;
        user.OtpExpiry = undefined;
        await user.save({validateBeforeSave: false})

        res.status(200).json({
            success: true,
            message: "Email verified successfully"
        })
    })

    this.forgotPassword = BigPromise(async (req,res,next) => {
        const { email } = req.body
        console.log(email)
        const user = await this.database.getUserByEmail(email, true)
        if (!user) {
            const message = "No user with this email"
            console.log("Checking email existence");
            this.logger.info(`Forgot password rejected [${email}]. ${message}`)
            return res.status(CONST.httpStatus.NOT_FOUND).json({ error: message })
        }
        
        const forgotToken = user.getForgotPasswordToken()
        await user.save({validateBeforeSave: false})
        console.log("hello")
        const myUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${forgotToken}`

        const message = `Copy paste this link in ur URL and hit enter \n\n ${myUrl}`

        try {
            await mailHelper({
                email: user.email,
                subject: "Srijan 2025 : Password reset email",
                message,
            });

            res.status(200).json({
                success: true,
                message: "Email sent successfully"
            })
        } catch (error) {
            user.forgotPasswordToken = undefined
            user.forgotPasswordExpiry = undefined
            await user.save({validateBeforeSave: false})

            this.logger.error(`Forgot password email not sent for user [${email}]`)
            return res.status(500).json({
                success: false,
                message: "Email could not be sent",
                error: error.message
            });
        }
    })

    this.passwordReset = BigPromise(async (req,res,next)=>{
        const token = req.params.token;
        const encryToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
      
        //console.log(encryToken);
      
        const user = await this.database.getUserByForgotPasswordToken(encryToken);
      
        if (!user) {
            const message = "Email not found"
            this.logger.info(`Password Reset rejected`)
            return res.status(CONST.httpStatus.NOT_FOUND).json({ error: message })
        }
      
        if(req.body.password != req.body.confirmPassword){
            this.logger.error('Password and Confirm Password do not match');
        }
      
        user.password = req.body.password
        user.forgotPasswordToken = undefined
        user.forgotPasswordExpiry = undefined
        await user.save();

        console.log(user);
      
        const cookieToken = jwtUtil.generateJWT(user.id, user.email)
        res.cookie("jwt", cookieToken, { httpOnly: true, maxAge: CONST.maxAgeCookieExpired })

        return res.status(200).json({
            success: true,
            message: "Password reset successful",
        });
        
      
    });

    this.oauthGoogleLogin = async (req, res) => {
        try {
            console.log('🚀 Starting OAuth Google login handler');
            console.log('User object:', req.user);
    
            if (!req.user) {
                console.log('❌ No user in request');
                return res.redirect(process.env.FAILED_LOGIN_REDIRECT);
            }
    
            const token = jwtUtil.generateJWT(req.user.id, req.user.email);
            console.log('🔐 Generated JWT:', token);
    
            res.cookie("jwt", token, { 
                httpOnly: true,
                maxAge: CONST.maxAgeCookieExpired
            });
    
            console.log('✅ Authentication successful, redirecting...');
            res.redirect(process.env.SUCCESSFUL_LOGIN_REDIRECT);
        } catch (error) {
            console.error('💥 OAuth login error:', error);
            res.redirect(process.env.FAILED_LOGIN_REDIRECT + '?error=server_error');
        }
    };

    const MONGOOSE_DUPLICATED_EMAIL_ERROR_CODE = 11000

    // const handleRegisterValidationErrors = (err) => {
    //     let errors = {
    //         email: "",
    //         password: "",
    //         fullname: ""
    //     }
    
    //     if (err instanceof DuplicatedEmailError || err.code === MONGOOSE_DUPLICATED_EMAIL_ERROR_CODE) {
    //         errors.email = "That email is already registered"
    //         return errors
    //     }
    
    //     // Validations error
    //     if (err.message.includes("User validation failed")) {
    //         Object.values(err.errors).forEach(({properties}) => {
    //             errors[properties.path] = properties.message
    //         })
    //     }
    
    //     return errors
    // }

}

const logger = require("../services/log/logger")
const database = require("../services/database")
const authController = new AuthController(database, logger)

module.exports = authController