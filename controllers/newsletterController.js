const BigPromise = require("../middlewares/bigPromise")

const CONST = require("../utils/constants")

function NewsletterController(database) {

  this.database = database;

  this.subscribe = BigPromise(async (req, res) => {
    try {
      const email = req.body.email;
      const emailAlreadyExists = await this.database.findEmail(email);

      if (emailAlreadyExists) {
        res.status(CONST.httpStatus.BAD_REQUEST);
        return res.json({ success: false, message: "Email already added to Newsletter." })
      }

      const emailAdded = await this.database.addEmailToNewsletter(email);

      res.status(emailAdded.success ? CONST.httpStatus.CREATED : CONST.httpStatus.INTERNAL_ERROR);
      return res.json({ success: emailAdded.success, message: emailAdded.message });
    } catch (err) {
      console.error(err);
      return res.status(CONST.httpStatus.INTERNAL_ERROR).json({ success: false, message: "An unexpected error occurred. Please try again later." })
    }

  });
}

const database = require("../services/database/newsletter");
const newsletterController = new NewsletterController(database);

module.exports = newsletterController;
