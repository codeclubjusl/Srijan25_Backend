const express = require("express");
const { isUserAuthenticated } = require("../middlewares");
const notificationService = require("../services/notification");
const { getUserByEmail } = require("../services/database/users");
const { decodeJWT } = require("../utils/jwt");
const router = express.Router();

router.get("/getAll", isUserAuthenticated, async (req, res) => {
  const jwtToken = req.cookies.jwt;
  const { email } = decodeJWT(jwtToken);
  if(!email){
    res.status(400).json({message:"user not found"});
  }
  const  {data:{id}}= await getUserByEmail(email);
  if(!id){
    res.status(400).json({message:"user not found"});
  }
  const data = await notificationService.listAllNotificationByUserId(id);
  res.status(200).json({ data: data });
});

router.get("/paginated", isUserAuthenticated,async (req, res) => {
  const { page, limit} = await req.query;

  const jwtToken = req.cookies.jwt;
  const { email } = decodeJWT(jwtToken);
  if(!email || page == undefined || limit ==undefined){
    res.status(400).json({message:"invalid params"});
  }

  const data = await notificationService.paginatedListing(email,page,limit);

  res.status(200).json({ data });
});

module.exports = router

