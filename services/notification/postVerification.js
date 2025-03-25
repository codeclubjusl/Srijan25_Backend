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
  ];
  for(let user of details){
    console.log(`\n\n--- sending notification to ${user.email} ---`)
    try {
      const { data } = await getUserByEmail(user.email);
      await updateUserMerchandise(data.id, user.size, user.color, user.isVerified);
      console.log(`added notification and updated status for ${user.email}`)
    }
    catch (err) {
      //console.error(err);
      console.log(`error while adding notification for ${user.email}`)
    }
    sendPaymentVerifiedMail(user.email, user.isVerified);

  }
  // details.forEach(async (user) => {
  //   console.log(`--- sending notification to ${user.email} ---`)
  //   try {
  //     const { data } = await getUserByEmail(user.email);
  //     await updateUserMerchandise(data.id, user.size, user.color, user.isVerified);
  //     console.log(`added notification and updated status for ${user.email}`)
  //   }
  //   catch (err) {
  //     //console.error(err);
  //     console.log(`error while adding notification for ${user.email}`)
  //   }
  //   sendPaymentVerifiedMail(user.email, user.isVerified);
  //   console.log(`---- END ---`)

  // })
}

const updateUserMerchandise = async (userId,size, color, isVerified )=>{
  try{
    // getting user
    const user = await User.findById(userId);
    if(!user){
      console.log("user not found !!!");
      return ;
    }

    const status = isVerified? "accepted" : "rejected";
    const merch2 = user.merchandise2;
    let sendNotification = false;

    // checking for merchandise 1
    if(user.merchandise && user.merchandise.size == size && user.merchandise.color == color && user.merchandise.status == "pending"){
      user.merchandise.status = status;
      await user.save();
      console.log("merch1 updated in db")
      sendNotification = true
    }

    // checking for merchandise 2
    if(!sendNotification && merch2){
      for (i of merch2) {
        if(i.size == size && i.color == color && i.status == "pending"){
          i.status = status;
          await user.save();
          console.log("merch2 updated in db")
          sendNotification = true;
          break;
        }
      }
    }

    if(sendNotification){
      await addNotification(userId, isVerified);
    }
    else 
    {
      console.log("did not find matching merchandise in db");
    }
  }
  catch(err){
    console.log(err);
    console.log("error updating merchandise to db");
  }
}

module.exports = {sendBulkMessage};
