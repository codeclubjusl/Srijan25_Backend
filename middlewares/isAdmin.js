const logger = require("../services/log/logger")
const CONST = require("../utils/constants")
const jwt = require("jsonwebtoken")


const isAdmin = (request, response, next) => {

    logger.debug("Verifying Admin...");
    // check for api key
    const api_key = request.headers["api-key"];
    if (api_key === process.env.ADMIN_KEY) {
        logger.debug("Admin verified");
        next();
    } else {
        logger.error("Admin not verified");
        let error = {
            status: CONST.httpStatus.UNAUTHORIZED,
            message: "err: You must login first!"
        }
        next(error);
    }
}

module.exports = isAdmin