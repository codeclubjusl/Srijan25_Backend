const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    venue: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    participants: [
        {
            isSolo: { type: Boolean, required: true },
            group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
            solo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
    ],
});

const Event = mongoose.model("Event", EventSchema);

module.exports = Event;
