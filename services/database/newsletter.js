const Newsletter = require("../../models/newsletter");

function NewsletterDatabase() {

  this.findEmail = async (email) => {
    try {
      const emailExists = await Newsletter.findOne({ email });
      return emailExists ? true : false;
    } catch (err) {
      console.error(err);
    }
  }

  this.addEmailToNewsletter = async (email) => {
    try {
      const newsletterEmail = new Newsletter({ email });
      const emailAdded = await newsletterEmail.save();

      if (emailAdded) return ({ success: true, message: "Email added successfully!" })
      else return ({ success: false, message: "An unexpected error occurred. Please try again later." })
    } catch (err) {
      console.error(err);
      return ({ success: false, message: "An unexpected error occurred. Please try again later." })
    }
  }

}

const database = new NewsletterDatabase();

module.exports = database;
