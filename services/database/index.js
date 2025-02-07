const UserDatabaseMongoDB = require("./mongo")
const connectionInfo = process.env.DB_CONNECTION_STRING

const database = new UserDatabaseMongoDB(connectionInfo)

module.exports = database