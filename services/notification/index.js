const User = require("../../models/user");

class NotificationService {
  constructor() {

  }

  async addNotificationToUser(userId, title, description) {
    try {
      //console.log("adding notification called");
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      

      user.notifications.push({ title, description });
      const res = await user.save();
      //console.log("res of the notification", res);
      return user.notifications[user.notifications.length - 1];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async markNotificationAsReadById(userId, notificationId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      
      const notification = user.notifications.id(notificationId);
      if (!notification) throw new Error('Notification not found');
      
      notification.read = true;
      await user.save();
      return notification;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async listAllNotificationByUserId(userId) {
    try {
      const user = await User.findById( userId);
      if (!user) throw new Error('User not found');
      
      //console.log("got users -> ", user)
      return user.notifications?? [];
    } catch (error) {
      throw new Error(error.message);
      return [];
    }
  }
}


const notificationService = new NotificationService();
module.exports = notificationService;