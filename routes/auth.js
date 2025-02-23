const express = require("express")
const router = express.Router()
const authController = require("../controllers/authController")
const middlewares = require("../middlewares")

router.post("/login", authController.login)
router.post("/register", authController.register)
router.post("/forgotPassword", authController.forgotPassword)
router.post("/password/reset/:token", authController.passwordReset)
router.post("/EmailVerify", authController.EmailVerify)
router.post("/resendOtp", authController.resendOTP)
router.put("/updateDetails", authController.updateDetails);
router.post("/logout", authController.logout);
router.put("/changePassword", authController.changePassword);

const passport = require("passport")
passport.debug = true;

const envValidator = require("../config/config")
const isGoogleConfigured = envValidator.isGoogleOAuth2ServiceConfigured()

router.get("/login/google/status", (request, response) => {
  let body = {
    serviceName: "Google OAuth 2.0",
    isActive: isGoogleConfigured !== undefined
  }
  response.json(body)
})

// Google
if (isGoogleConfigured) {
  const googleProvider = require("../services/auth/oauth2Google")
  passport.use(googleProvider)
  router.get("/login/google", passport.authenticate("google", { scope: ["profile", "email"] }))
  router.get("/oauth/google/callback",
    (req, res, next) => {
      if (!req.query.code) {
        return res.redirect(process.env.FAILED_LOGIN_REDIRECT + '?error=missing_code');
      }
      console.log('➡️ Initiating Google OAuth callback');
      next();
    },
    passport.authenticate("google", {
      failureRedirect: '/api/v1/login',
      session: false
    }),
    (req, res, next) => {
      console.log('🔑 Passport authentication successful');
      next();
    },
    authController.oauthGoogleLogin
  );
}

if (isGoogleConfigured) {
  passport.serializeUser((user, done) => {
    done(null, user.id); // Only store ID in session
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await database.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  router.get("/oauth/user", middlewares.isUserAuthenticated, authController.getUserSession)
}

module.exports = router
