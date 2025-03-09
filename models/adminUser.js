const { Schema, model, ObjectId } = require("mongoose");
const AdminUserSchema = new Schema({
  id: { type: ObjectId },
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
});
const AdminUser = model("AdminUser", AdminUserSchema);
module.exports=AdminUser;