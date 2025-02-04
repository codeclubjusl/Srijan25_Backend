const mongoose = require("mongoose");
const z = require("zod");
const GroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    events: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
        },
    ],
});

const Group = mongoose.model("Group", GroupSchema);

const GroupInput = z.object({
    name: z.string("Name of the group is required and must be a string"),
    creator: z.string("Creator of the group is required and must be a string"),
    members: z.array(z.string()).min(1, "At least one member is required"),
});

module.exports = { Group, GroupInput };
