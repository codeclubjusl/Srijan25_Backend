const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        ref: "User",
    },
    members: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            status: {
                type: String,
                enum: ["accepted", "pending"],
                default: "pending",
            },
        }
    ],
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
    },
    status: {
        type: String,
        enum: ["complete", "pending"],
        default: "pending",
        required: true,
    },
    created: {
        type: Date,
        default: Date.now,
    },
});

const Group = mongoose.model("Group", GroupSchema);

module.exports = { Group };
