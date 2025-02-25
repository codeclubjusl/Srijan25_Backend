require("dotenv").config();
const logger = require("./services/log/logger")
const database = require("./services/database")
const app = require("./app")
const cloudinary = require("cloudinary")

const envValidator = require("./config/config")

logger.info("Checking configuration...")
envValidator.validateServerConfiguration()
envValidator.validateDatabaseConfiguration()
envValidator.validateAuthConfiguration()

//cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

logger.info("Deploying server...")

database.connect()
    .then(() => {
        logger.info("Database succesfully connected")

        const PORT = process.env.BACK_PORT
        const backUri = `${process.env.BACK_HOST}`
        
        app.listen(PORT, () => {
            logger.info(`Server running on ${backUri}`)
        })
    
    }).catch((err) => {
        logger.error(err)
    })
