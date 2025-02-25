const emailHelper = require("../utils/emailHelper");
function MerchController(database) {

  this.database = database

  const CONST = require("../utils/constants")
  const BigPromise = require("../middlewares/bigPromise")


  this.getMerchant = BigPromise(async (req, res, next) => {
    const jwtToken = req.cookies.jwt;
    const { email } = decodeJWT(jwtToken);
    const { merchandise } = await this.database.getUserByEmail(email);
    if (merchandise) {
      res.status(CONST.httpStatus.OK);
      res.json({
        success: true,
        merchandise: merchandise
      });
    }
    else {
      res.status(CONST.httpStatus.OK);
      res.json({
        success: false,
        merchandise: null
      })
    }
  });

  this.bookMerchant = BigPromise(async (req, res, next) => {
    const { size, color } = req.body;
    if (!size || !color) {
      res.status(CONST.httpStatus.BAD_REQUEST);
      res.json({
        success: false,
        message: "missing fields",
      });
    }
    else if (!CONST.merchandiseTypes.size.includes(size) || !CONST.merchandiseTypes.color.includes(color)) {
      res.status(CONST.httpStatus.BAD_REQUEST);
      res.json({
        success: false,
        message: "invalid fields",
        data: {
          info: "supported types",
          color: CONST.merchandiseTypes.color,
          size: CONST.merchandiseTypes.size
        }
      });
    }
    else {
      const jwtToken = req.cookies.jwt;
      const { email } = decodeJWT(jwtToken);

      const { merchandise } = await this.database.getUserByEmail(email);
      if (merchandise) {
        res.status(CONST.httpStatus.OK);
        res.json({
          success: true,
          message: "merchandise already added",
          merchandise: merchandise
        });
      }
      else {
        await this.database.addMerchToUser(email, size, color);
        // send html mail
        res.status(CONST.httpStatus.CREATED);
        res.json({
          success: true,
          message: "merchandise added"
        })
      }
    }
  });
  this.testing = async (req, res, next) => {
    console.log("here")
    const option = {
      email: "only444testing@gmail.com",
      subject: "hello",
      message: "hello world"
    }
    await emailHelper(option);
    res.status(CONST.httpStatus.CREATED);
    res.json({
      success: true,
      message: "done"
    })
  }
}

const database = require("../services/database");
const { decodeJWT } = require("../utils/jwt");
const { transport } = require("winston");
const merchController = new MerchController(database)

module.exports = merchController
