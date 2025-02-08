const { default: mongoose } = require("mongoose");
const Groups = require("../../models/groups");
const Users = require("../../models/user");

const createGroup = async (
    leader,
    memberEmails,
    name,
    event,
    session = null,
    contd = false
) => {
    if (!session) session = await mongoose.startSession();
    if (!contd) session.startTransaction();

    try {
        let memberIds = [];
        for (const member of memberEmails) {
            let user = await Users.find({
                email: member,
            });
            if (!user) {
                throw new Error("Member not found.");
            }
            memberIds.push(user[0]._id);
        }
        // check if any members are already in a group
        const existingGroups = await Groups.find({
            event,
            "members.user": { $in: [...memberIds, leader] },
            creator: { $in: [...memberIds, leader] },
        }).session(session);
        if (existingGroups.length > 0) {
            throw new Error("One or more member is already in a group.");
        }
        const group = new Groups({
            creator: leader,
            members: memberIds.map((member) => ({ user: member })),
            name,
            event,
            status: memberEmails.length ? "pending" : "complete", // by default, if no extra members are added, group is complete
        });

        await group.save({ session });

        if (!contd) {
            await session.commitTransaction();
            session.endSession();
        }

        return { success: true, data: group };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error creating group:", error);
        throw new Error(
            error.message || "An error occurred while creating group."
        );
    }
};

const getGroupById = async (id) => {
    try {
        const group = await Groups.findById(id)
            .populate("creator")
            .populate("members.user");
        if (!group) {
            throw new Error("Group not found.");
        }
        return { success: true, data: group };
    } catch (error) {
        console.error("Error getting group by id:", error);
        throw new Error(
            error.message || "An error occurred while getting group."
        );
    }
};

const getGroupByLeaderAndEvent = async (leader, event) => {
    try {
        const group = await Groups.findOne({ creator: leader, event });
        return { success: true, data: group };
    } catch (error) {
        console.error("Error getting group by leader and event:", error);
        throw new Error(
            error.message || "An error occurred while getting group."
        );
    }
};

const deleteGroupById = async (id, session = null, contd = false) => {
    if (!session) session = await mongoose.startSession();
    if (!contd) session.startTransaction();
    try {
        await Groups.findByIdAndDelete(id).session(session);
        if (!contd) {
            await session.commitTransaction();
            session.endSession();
        }
        return { success: true, message: "Group deleted successfully." };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error deleting group by id:", error);
        throw new Error(
            error.message || "An error occurred while deleting group."
        );
    }
};

const acceptInvitation = async (
    groupId,
    userId,
    session = null,
    contd = false
) => {
    if (!session) session = await mongoose.startSession();
    if (!contd) session.startTransaction();
    try {
        const group = await Groups.findOne({
            _id: groupId,
            "members.user": userId,
            "members.status": "pending",
        }).session(session);

        if (!group) {
            await session.abortTransaction();
            session.endSession();
            throw new Error("User not found or already accepted.");
        }

        await Groups.updateOne(
            { _id: groupId, "members.user": userId },
            { $set: { "members.$.status": "accepted" } },
            { session }
        );

        if (!contd) {
            await session.commitTransaction();
            session.endSession();
        }

        return { success: true, message: "User accepted successfully." };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error updating member status:", error);
        throw new Error(
            error.message || "An error occurred while updating status."
        );
    }
};

const getRegistrationStatus = async (groupId) => {
    try {
        const group = await Groups.findById(groupId);
        if (!group) {
            throw new Error("Group not found.");
        }
        return { success: true, data: group.status };
    } catch (error) {
        console.error("Error getting registration status:", error);
        throw new Error(
            error.message ||
                "An error occurred while getting registration status."
        );
    }
};

module.exports = {
    createGroup,
    getGroupById,
    deleteGroupById,
    acceptInvitation,
    getRegistrationStatus,
    getGroupByLeaderAndEvent,
};
