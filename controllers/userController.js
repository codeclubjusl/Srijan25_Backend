function UserController(database) {

  this.database = database

  const CONST = require("../utils/constants")
  const BigPromise = require("../middlewares/bigPromise")

  this.getUserById = BigPromise(async (req, res, next) => {
    const id = req.params.id
    const providerId = req.query?.providerId

    const user = await this.database.getUserById(id)
    let dto = userToDTO(user, providerId)
    res.json(dto)
  });

  this.deleteUserById = BigPromise(async (req, res, next) => {
    const id = req.params.id
    const deletedUser = await this.database.deleteUserById(id)
    let dto = userToDTO(deletedUser)
    res.json(dto)
  });

  const userToDTO = (user, providerId = null) => {
    if (providerId) {
      let { providers } = user
      let providerInformation = providers.find(p => p.providerUserId === providerId)
      user.picture = providerInformation.picture
      user.login = providerInformation.loginName
    }
    delete user.providers
    delete user.password
    return user
  }
}

const database = require("../services/database")
const userController = new UserController(database)

module.exports = userController
