const logger = require("../services/log/logger")

function requestLogger (request, response, next) {
    let importantData = request.method
    importantData += " " + request.path
    importantData += request.body && ""
    logger.http(`request [${importantData}]`)
    next()
}

module.exports = requestLogger