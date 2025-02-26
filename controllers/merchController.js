const emailHelper = require("../utils/emailHelper");
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
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
    const option = {
      email: "test@gmail.com",
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
  this.getQRImage = async (req, res, next) => {
    try {
      /*
      const jwtToken = req.cookies.jwt;
      const { merchandise } = decodeJWT(jwtToken);

      if (merchandise && merchandise.status === "pending") {
        return res.status(CONST.httpStatus.CONFLICT).json({
          success: false,
          message: "You already have payment set to pending",
        });
      }
      */

      const isValidForDiscount = checkUsedCount();
      const imagePath = isValidForDiscount
        ? path.join(__dirname, "images", "discountedQR.png")
        : path.join(__dirname, "images", "normalQR.png");

      console.log(imagePath);
      // Stream the image file as response
      res.setHeader("Content-Type", "image/png");
      const imageStream = fs.createReadStream(imagePath);
      imageStream.pipe(res);
    } catch (error) {
      next(error);
    }
  }
  this.checkDiscount = async (req, res, next) => {
    try {
      const isValidForDiscount = await checkDiscountAvailable();
      if (isValidForDiscount) {
        res.status(CONST.httpStatus.OK);
        res.json();
      }
      else {
        res.status(CONST.httpStatus.CONFLICT);
        res.json();
      }
    } catch (error) {
      next(error);
    }
  }


  const bucketName = process.env.BUCKET_NAME;
  const bucketRegion = process.env.BUCKET_REGION;
  const accessKey = process.env.ACCESS_KEY;
  const secretAccessKey = process.env.SECRET_ACCESS_KEY;
  this.s3 = new S3Client({
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretAccessKey,
    },
    region: bucketRegion
  });

  this.addImage = async (req, res, next) => {
    try {
      const {
        nameOnShirt,
        college,
        department,
        year,
        email, size, color
      } = req.body;

      /*
      const jwtToken = req.cookies.jwt;
      const { email: dbEmail } = decodeJWT(jwtToken);
      const { merchandise, phone } = await this.database.getUserByEmail(email);
      if (merchandise) {
        return res.status(CONST.httpStatus.BAD_REQUEST).json({
          message: "merch already added",
        });
      }
      */

      const image = req.file;
      console.log(image, nameOnShirt, college, department, year);
      if (!image) {
        return res.status(CONST.httpStatus.BAD_REQUEST).json({
          message: "No file uploaded",
        });
      }

      // Extract file extension
      const fileExtension = image.originalname.split('.').pop();
      //email_phone_nameOnshirt_size_Color

      // add phone number
      const fileName = `${email}_${nameOnShirt}_${size}_${color}.${fileExtension}`;

      const params = {
        Bucket: bucketName,
        Key: fileName, // Fixed typo (rq -> image)
        Body: image.buffer,
        ContentType: image.mimetype,
      };

      const command = new PutObjectCommand(params);
      await this.s3.send(command);
      //this.database.addMerchToUser(email, size, color);

      sendPaymentRecievedMail(email);
      res.status(CONST.httpStatus.OK).json({
        message: "Image uploaded successfully",
        fileName: image.originalname,
      });
    } catch (error) {
      console.error("S3 Upload Error:", error);
      res.status(CONST.httpStatus.INTERNAL_ERROR).json({
        message: "Failed to upload image",
        error: error.message,
      });
    }
  };
}

const database = require("../services/database");
const { decodeJWT } = require("../utils/jwt");
const { transport } = require("winston");
const { checkDiscountAvailable } = require("../services/database/payment");
const { isVAT } = require("validator");
const { sendPaymentRecievedMail } = require("../utils/emails");
const merchController = new MerchController(database)

module.exports = merchController
