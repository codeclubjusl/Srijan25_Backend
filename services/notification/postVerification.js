const notificationService = require("./index");
const { sendPaymentVerifiedMail } = require("../../utils/emails");
const database = require("../database");
const { getUserByEmail } = require("../database/users");
const mongoose = require("mongoose");
const CONST = require("../../utils/constants");
const User = require("../../models/user");

const addNotification = async (userId,isVerified)=>{
  const verifiedBody = {
  title : "Payment Verified Successfully 🎉",
  desc : "We have confirmed your merchandise order. It is now being processed and will be shipped shortly.",
  }
  const notVerifiedBody = {
  title : "Payment Not Verified",
  desc : "Contact merchandise POC for further queries",
  }
  try{
    if (isVerified)
      await notificationService.addNotificationToUser(userId,verifiedBody.title, verifiedBody.desc);
    else 
      await notificationService.addNotificationToUser(userId, notVerifiedBody.title, notVerifiedBody.desc);
  }
  catch (err){
    console.log("could not add notification ")
    console.error(err);
  }
}


const sendBulkMessage = async ()=>{
  const details = [
    {
      email: "test@gmail.com",
      isVerified: false,
    },
  
  ];

  details.forEach(async (user) => {
    console.log(`--- sending notification to ${user.email} ---`)
    try {
      const {data} = await getUserByEmail(user.email);

      if(!data.merchandise || !data.merchandise.status === CONST.paymentStatus[0]) throw new Error(`${user.email} has not purchased any merch`);
      if(!data.merchandise.status === CONST.paymentStatus[0]) throw Error(`${user.email} is not pending`);

      const newStatus = CONST.paymentStatus[user.isVerified ? 1 : 2];
      await User.updateOne({_id : data.id}, { $set: { "merchandise.status": newStatus }});
      await addNotification(data.id,user.isVerified);
      console.log(`added notification and updated status for ${user.email}`)
    }
    catch (err) {
      //console.error(err);
      console.log(`error while adding notification for ${user.email}`)
    }
    sendPaymentVerifiedMail(user.email, user.isVerified);
    console.log(`---- END ---`)

  })
}


module.exports = {sendBulkMessage};
