const express = require("express")
const router = express.Router()
const {isUserAuthenticated} = require("../middlewares")
const userController = require("../controllers/userController")

router.get("/users/:id", isUserAuthenticated, userController.getUserById)
router.delete("/users/:id", isUserAuthenticated, userController.deleteUserById)

module.exports = router