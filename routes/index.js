const express = require("express")
const router = express.Router()

const authApi = require("./auth")
const usersApi = require("./users")
const eventsApi = require("./events")
const newsletterApi = require("./newsletter")
const merchApi = require("./merch")

router.use(authApi)
router.use(usersApi)
router.use("/events", eventsApi)

router.get("/", (req, res) => {
  res.send("Hello World!")
})
router.use(newsletterApi)
router.use('/merch', merchApi)

module.exports = router
