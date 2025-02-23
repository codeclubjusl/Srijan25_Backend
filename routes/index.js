const express = require("express")
const router = express.Router()

const authApi = require("./auth")
const usersApi = require("./users")
const newsletterApi = require("./newsletter")

router.use(authApi)
router.use(usersApi)
router.use(newsletterApi)

module.exports = router
