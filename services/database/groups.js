const { default: mongoose } = require("mongoose");
const Groups = require("../../models/groups");
const Users = require("../../models/user");

const createGroup = async (leader, memberEmails, name, event) => {
    try {
        let leaderUser = await Users.findById(leader);
        if (!leaderUser) {
            throw new Error("Leader not found.");
        }
        //console.log("leader", leaderUser);
        let memberIds = [];
        for (const member of memberEmails) {
            let user = await Users.find({ email: member });
            if (!user.length) {
                throw new Error("Member not found.");
            }
            memberIds.push(user[0]._id);
        }
        if (memberIds.length) {
            for (const member of memberIds) {
                if (member.toString() === leader.toString()) {
                    throw new Error("Leader cannot be a member.");
                }
            }
        }
        const existingGroups = await Groups.find({
            event,
            status: { $ne: "rejected" },
            $or: [
                { "members.user": { $in: [...memberIds, leader] } },
                { creator: { $in: [...memberIds, leader] } },
            ],
        });
        if (existingGroups.length > 0) {
            throw new Error("One or more member is already in a group.");
        }
        const group = new Groups({
            creator: leader,
            members: memberIds.map((member) => ({ user: member })),
            name,
            event,
            status: memberEmails.length ? "pending" : "complete",
        });

        await group.save();
        return { success: true, data: group };
    } catch (error) {
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
        if (!group || group.length === 0) {
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
        if (!group || group.length === 0) {
            throw new Error("Group not found.");
        }
        return { success: true, data: group };
    } catch (error) {
        console.error("Error getting group by leader and event:", error);
        throw new Error(
            error.message || "An error occurred while getting group."
        );
    }
};

const deleteGroupById = async (id) => {
    try {
        await Groups.findByIdAndDelete(id);
        return { success: true, message: "Group deleted successfully." };
    } catch (error) {
        console.error("Error deleting group by id:", error);
        throw new Error(
            error.message || "An error occurred while deleting group."
        );
    }
};

const acceptInvitation = async (groupId, userId) => {
    try {
        const group = await Groups.findOneAndUpdate(
            {
                _id: groupId,
                "members.user": userId,
                "members.status": "pending",
            },
            {
                $set: { "members.$.status": "accepted" },
            },
            { new: true }
        );

        if (!group || group.length === 0) {
            throw new Error("User not found or already accepted.");
        }

        let isGroupComplete = true;

        for (const member of group.members) {
            if (member.status === "pending") {
                isGroupComplete = false;
                break;
            }
        }

        if (isGroupComplete)
            await Groups.findByIdAndUpdate(groupId, {
                status: "complete",
            });

        return {
            success: true,
            message: "User accepted successfully.",
            isGroupComplete,
            event: group.event,
        };
    } catch (error) {
        console.error("Error updating member status:", error);
        throw new Error(
            error.message || "An error occurred while updating status."
        );
    }
};

const rejectInvitation = async (groupId, userId) => {
    try {
        const group = await Groups.findOneAndUpdate(
            {
                _id: groupId,
                "members.user": userId,
                "members.status": "pending",
            },
            {
                $set: { "members.$.status": "rejected", status: "rejected" },
            },
            { new: true }
        );

        if (!group || group.length === 0) {
            throw new Error("User not found or already accepted.");
        }

        return {
            success: true,
            message: "User rejected successfully.",
            event: group.event,
        };
    } catch (error) {
        console.error("Error updating member status:", error);
        throw new Error(
            error.message || "An error occurred while updating status."
        );
    }
};

const getRegistrationStatus = async (groupId) => {
    try {
        const group = await Groups.findById(groupId);
        if (!group || group.length === 0) {
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
    rejectInvitation,
    getRegistrationStatus,
    getGroupByLeaderAndEvent,
};
