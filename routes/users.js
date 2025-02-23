const express = require("express")
const router = express.Router()
const { isUserAuthenticated } = require("../middlewares")
const userController = require("../controllers/userController")
const merchController = require("../controllers/merchController")

router.get("/users/:id", isUserAuthenticated, userController.getUserById)
router.delete("/users/:id", isUserAuthenticated, userController.deleteUserById)
router.delete("/users/:id", isUserAuthenticated, userController.deleteUserById)
router.get("/users/get/Merchandise", isUserAuthenticated, merchController.getMerchant)
router.post("/users/merchandise", isUserAuthenticated, merchController.bookMerchant)

module.exports = router
