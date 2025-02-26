const express = require("express")
const { isUserAuthenticated } = require("../middlewares")
const userController = require("../controllers/userController")
const merchController = require("../controllers/merchController")


const router = express.Router();

const multer = require('multer')
const storage = multer.memoryStorage();
const upload = multer({
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type. Only images are allowed."), false);
    }
    cb(null, true);
  },
  storage: storage
});

router.post("/submitImage",isUserAuthenticated, upload.single("image"), merchController.addImage)
router.get("/checkDiscount", merchController.checkDiscount)

//router.get("/getValidation", isUserAuthenticated, merchController.getQR)


router.get("/testing", (req, res) => {
  return res.status(200).json({ message: "health" });
});


module.exports = router;
