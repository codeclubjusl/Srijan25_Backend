const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
    },
    isSolo: {
        type: Boolean,
        required: true,
    },
    minParticipants: {
        type: Number,
        required: true,
    },
    maxParticipants: {
        type: Number,
        required: true,
    },
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    participantGroups: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
        },
    ],
    pendingParticipantGroups: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
        },
    ],
});

const Event = mongoose.model("Event", EventSchema);

module.exports = Event;
