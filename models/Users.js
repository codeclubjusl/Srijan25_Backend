const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    authId: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    year: {
        type: String,
        required: true,
    },
    instituition: {
        type: String,
        required: true,
    },
    events: [
        {
            event: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Event",
                required: true,
            },
            isSolo: { type: Boolean, required: true },
            group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
        },
    ],
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
