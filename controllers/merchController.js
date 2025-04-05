const emailHelper = require("../utils/emailHelper");
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
function MerchController(database) {

  this.database = database

  const CONST = require("../utils/constants")
  const BigPromise = require("../middlewares/bigPromise")


  this.getMerchant = BigPromise(async (req, res, next) => {
    const jwtToken = req.cookies.jwt;
    const { email } = decodeJWT(jwtToken);
    const { merchandise,merchandise2 } = await this.database.getUserByEmail(email);
    if (merchandise) {
      res.status(CONST.httpStatus.OK);
      res.json({
        success: true,
        merchandise:  merchandise
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
        size, color,contact, campus
      } = req.body;

      const jwtToken = req.cookies.jwt;
      const { email } = decodeJWT(jwtToken);
      if (!email) {
        return res.status(CONST.httpStatus.BAD_REQUEST).json({
          message: "email not found",
        });
      }
      const {data} = await getUserByEmail(email);
      if(!data){
        return res.status(CONST.httpStatus.BAD_REQUEST).json({
          message: "user not found",
        });
      }
      const {id,phone, merchandise, merchandise2, emailVerified} = data;
      if (!emailVerified) {
        return res.status(CONST.httpStatus.BAD_REQUEST).json({
          message: "email not verified",
        });
      }
      let count = 0;

      if(merchandise) count++;
      if(merchandise2) count+=merchandise2.length;

      if(count >=4 ){
        return res.status(CONST.httpStatus.BAD_REQUEST).json({
          message: "purchase limit exceeded",
        });
      }

      const image = req.file;
      // console.log(image, nameOnShirt, college, department, year);
      if (!image) {
        return res.status(CONST.httpStatus.BAD_REQUEST).json({
          message: "No file uploaded",
        });
      }


      // adding merch to backend
      const merchID = await this.database.pushMerchToUser(email, size, color);
      if(!merchID){
        console.error("error adding merchandise to database!!!!");
        return res.status(CONST.httpStatus.INTERNAL_ERROR).json({
          message: "unable to add merch to database",
        });
      }
      console.log(`added merchandise in db for ${email}`);

      // Extract file extension
      const fileExtension = image.originalname.split('.').pop();
      //email_phone_nameOnshirt_size_Color

      // add phone number
      const fileName = `${email}_${nameOnShirt}_${size}_${color}_${id.toString()}_${merchID.toString()}_${contact}_${campus}.${fileExtension}`;

      const params = {
        Bucket: bucketName,
        Key: fileName, // Fixed typo (rq -> image)
        Body: image.buffer,
        ContentType: image.mimetype,
      };

      const command = new PutObjectCommand(params);
      await this.s3.send(command);
      //this.database.addMerchToUser(email, size, color);

      sendPaymentRecievedMail(email,nameOnShirt,size, color,CONST.paymentStatus);
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
const { getUserByEmail } = require("../services/database/users");
const merchController = new MerchController(database)

module.exports = merchController
