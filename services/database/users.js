const { default: mongoose } = require("mongoose");
const Users = require("../../models/user");
const Group = require("../../models/groups");

const getUserByEmail = async (email) => {
    try {
        console.log("Getting user by email:", email);
        const user = (await Users.findOne({ email })).toJSON();
        console.log("User found:", user);
        if (!user || user.length === 0) {
            throw new Error("User not found.");
        }
        return { success: true, data: user };
    } catch (error) {
        console.error("Error getting user by email:", error);
        throw new Error(
            error.message || "An error occurred while getting user."
        );
    }
};

// event related function 

const addRegisteredEventToUser = async (userId, eventId) => {
    try {
        const user = await Users.findByIdAndUpdate(
            userId,
            { $push: { registeredEvents: eventId } },
            { new: true }
        );
        if (!user || user.length === 0) {
            throw new Error("User not found.");
        }
        return { success: true, data: user };
    } catch (error) {
        console.error("Error adding registered event to user:", error);
        throw new Error(
            error.message ||
                "An error occurred while adding registered event to user."
        );
    }
};

const removeRegisteredEventFromUser = async (userId, eventId) => {
    try {
        const user = await Users.findByIdAndUpdate(
            userId,
            { $pull: { registeredEvents: eventId } },
            { new: true }
        );
        if (!user || user.length === 0) {
            throw new Error("User not found.");
        }
        return { success: true, data: user };
    } catch (error) {
        console.error("Error removing registered event from user:", error);
        throw new Error(
            error.message ||
                "An error occurred while removing registered event from user."
        );
    }
};

const addPendingEventToUser = async (userId, eventId) => {
    try {
        const user = await Users.findByIdAndUpdate(
            userId,
            { $push: { pendingEvents: eventId } },
            { new: true }
        );
        if (!user || user.length === 0) {
            throw new Error("User not found.");
        }
        return { success: true, data: user };
    } catch (error) {
        console.error("Error adding pending event to user:", error);
        throw new Error(
            error.message ||
                "An error occurred while adding pending event to user."
        );
    }
};

const removePendingEventFromUser = async (userId, eventId) => {
    try {
        const user = await Users.findByIdAndUpdate(
            userId,
            { $pull: { pendingEvents: eventId } },
            { new: true }
        );
        if (!user || user.length === 0) {
            throw new Error("User not found.");
        }
        return { success: true, data: user };
    } catch (error) {
        console.error("Error removing pending event from user:", error);
        throw new Error(
            error.message ||
                "An error occurred while removing pending event from user."
        );
    }
};

const moveEventFromPendingToRegisteredEventForUser = async (
    userId,
    eventId
) => {
    try {
        // TODO: check if event is in pending events
        const user = await Users.findByIdAndUpdate(
            userId,
            {
                $pull: { pendingEvents: eventId },
                $push: { registeredEvents: eventId },
            },
            { new: true }
        );
        if (!user || user.length === 0) {
            throw new Error("User not found.");
        }
        return { success: true, data: user };
    } catch (error) {
        console.error(
            "Error moving event from pending to registered event for user:",
            error
        );
        throw new Error(
            error.message ||
                "An error occurred while moving event from pending to registered event for user."
        );
    }
};

const putInvitation = async (userId, eventId, groupId) => {
    try {
        const user = await Users.findByIdAndUpdate(
            userId,
            {
                $push: {
                    invitations: {
                        event: eventId,
                        group: groupId,
                        status: "pending",
                    },
                },
            },
            { new: true }
        );
        if (!user || user.length === 0) {
            throw new Error("User not found.");
        }
        return { success: true, data: user };
    } catch (error) {
        console.error("Error putting invitation for user:", error);
        throw new Error(
            error.message ||
                "An error occurred while putting invitation for user."
        );
    }
};

const removeInvitation = async (userId, eventId, groupId) => {
    try {
        const user = await Users.findByIdAndUpdate(
            userId,
            {
                $pull: {
                    invitations: { event: eventId, group: groupId },
                },
            },
            { new: true }
        );
        if (!user || user.length === 0) {
            throw new Error("User not found.");
        }
        return { success: true, data: user };
    } catch (error) {
        console.error("Error removing invitation for user:", error);
        throw new Error(
            error.message ||
                "An error occurred while removing invitation for user."
        );
    }
};

const getInvitations = async (userId) => {
    try {
        const user = await Users.findById(userId)
            .populate("invitations.event", "name slug")
            .populate("invitations.group", "name status");
        if (!user || user.length === 0) {
            throw new Error("User not found.");
        }
        console.log("Invitations for user:", user.invitations);
        return {
            success: true,
            data: user.invitations.filter(
                (invitation) =>
                    invitation.status === "pending" &&
                    invitation.group.status !== "rejected"
            ),
        };
    } catch (error) {
        console.error("Error getting invitations for user:", error);
        throw new Error(
            error.message ||
                "An error occurred while getting invitations for user."
        );
    }
};

const acceptInvitation = async (groupId, userId) => {
    try {
        const user = await Users.findOneAndUpdate(
            {
                _id: userId,
                invitations: {
                    $elemMatch: {
                        group: groupId,
                        status: "pending",
                    },
                },
            },
            {
                $set: { "invitations.$.status": "accepted" },
            },
            { new: true }
        );
        if (!user || user.length === 0) {
            throw new Error("User not found.");
        }
        return { success: true, data: user };
    } catch (error) {
        console.error("Error accepting invitation for user:", error);
        throw new Error(
            error.message ||
                "An error occurred while accepting invitation for user."
        );
    }
};

const rejectInvitation = async (groupId, userId) => {
    try {
        const user = await Users.findOneAndUpdate(
            {
                _id: userId,
                invitations: {
                    $elemMatch: {
                        group: groupId,
                        status: "pending",
                    },
                },
            },
            {
                $set: { "invitations.$.status": "rejected" },
            },
            { new: true }
        );
        if (!user || user.length === 0) {
            throw new Error("User not found.");
        }
        return { success: true, data: user };
    } catch (error) {
        console.error("Error rejecting invitation for user:", error);
        throw new Error(
            error.message ||
                "An error occurred while rejecting invitation for user."
        );
    }
};

const getAllParticipatingEvents = async (userId) => {
    try {
        const user = await Users.findById(userId).populate(
            "registeredEvents",
            "name"
        );
        if (!user || user.length === 0) {
            throw new Error("User not found.");
        }
        return {
            success: true,
            data: user.registeredEvents,
        };
    } catch (error) {
        console.error(
            "Error getting all participating events for user:",
            error
        );
        throw new Error(
            error.message ||
                "An error occurred while getting all participating events for user."
        );
    }
};

const getAllPendingEvents = async (userId) => {
    try {
        const user = await Users.findById(userId).populate(
            "pendingEvents",
            "name"
        );
        if (!user || user.length === 0) {
            throw new Error("User not found.");
        }
        return {
            success: true,
            data: user.pendingEvents,
        };
    } catch (error) {
        console.error("Error getting all pending events for user:", error);
        throw new Error(
            error.message ||
                "An error occurred while getting all pending events for user."
        );
    }
};

const getAllGroupInfo = async (userId) => {
    try {
        const user = await Users.findById(userId).populate("invitations.group");
        if (!user || user.length === 0) {
            throw new Error("User not found.");
        }
        return {
            success: true,
            data: user.invitations,
        };
    } catch (error) {
        console.error("Error getting group info for user:", error);
        throw new Error(
            error.message ||
                "An error occurred while getting group info for user."
        );
    }
};

const getGroupInfoForEvent = async (userId, eventId) => {
    try {
        console.log("Getting group info for user:", userId, eventId);
        const group = await Group.findOne({
            event: eventId,
            $or: [{ "members.user": userId }, { creator: userId }],
            status: { $ne: "rejected" },
        })
            .populate("members.user")
            .populate("creator");
        if (!group || group.length === 0) {
            throw new Error("Group not found.");
        }
        return {
            success: true,
            data: group,
        };
    } catch (error) {
        console.error("Error getting group info for user:", error);
        throw new Error(
            error.message ||
                "An error occurred while getting group info for user."
        );
    }
};

const getStatusOfParticipation = async (userId, eventId) => {
    try {
        const user = await Users.findById(userId);
        if (!user || user.length === 0) {
            throw new Error("User not found.");
        }
        const registeredEvents = user.registeredEvents;
        const pendingEvents = user.pendingEvents;
        console.log({
            registeredEvents,
            pendingEvents,
        });
        if (
            registeredEvents
                .map((item) => item.toString())
                .includes(eventId.toString())
        ) {
            return "registered";
        } else if (
            pendingEvents
                .map((item) => item.toString())
                .includes(eventId.toString())
        ) {
            return "pending";
        } else {
            return "not-participating";
        }
    } catch (error) {
        console.error("Error getting status of participation for user:", error);
        throw new Error(
            error.message ||
                "An error occurred while getting status of participation for user."
        );
    }
};

const canUnregisterForGroup = async (userId, eventId) => {
    // only leader of group can unregister
    try {
        const isLeaderOfGroup = await Group.findOne({
            event: eventId,
            creator: userId,
        });
        console.log("isLeaderOfGroup:", isLeaderOfGroup, userId);
        if (!isLeaderOfGroup || isLeaderOfGroup.length === 0) {
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error checking if user can unregister:", error);
        throw new Error(
            error.message ||
                "An error occurred while checking if user can unregister."
        );
    }
};

const addToWishlist = async (userId, eventId) => {
    try {
        // no need to push if already there
        const user = await Users.findByIdAndUpdate(
            userId,
            { $addToSet: { wishlist: eventId } },
            { new: true }
        );
        if (!user || user.length === 0) {
            throw new Error("User not found.");
        }
        return { success: true, data: user.wishlist };
    } catch (error) {
        console.error("Error adding event to wishlist for user:", error);
        throw new Error(
            error.message ||
                "An error occurred while adding event to wishlist for user."
        );
    }
}

const removeFromWishlist = async (userId, eventId) => {
    try {
        const user = await Users.findByIdAndUpdate(
            userId,
            { $pull: { wishlist: eventId } },
            { new: true }
        );
        if (!user || user.length === 0) {
            throw new Error("User not found.");
        }
        return { success: true, data: user.wishlist };
    } catch (error) {
        console.error("Error removing event from wishlist for user:", error);
        throw new Error(
            error.message ||
                "An error occurred while removing event from wishlist for user."
        );
    }
}

const getWishlist = async (userId) => {
    try {
        const user = await Users.findById(userId).populate("wishlist", "name slug");
        if (!user || user.length === 0) {
            throw new Error("User not found.");
        }
        return {
            success: true,
            data: user.wishlist,
        };
    } catch (error) {
        console.error("Error getting wishlist for user:", error);
        throw new Error(
            error.message ||
                "An error occurred while getting wishlist for user."
        );
    }
}


module.exports = {
    addRegisteredEventToUser,
    removeRegisteredEventFromUser,
    addPendingEventToUser,
    removePendingEventFromUser,
    moveEventFromPendingToRegisteredEventForUser,
    putInvitation,
    removeInvitation,
    getInvitations,
    acceptInvitation,
    rejectInvitation,
    getUserByEmail,
    getAllParticipatingEvents,
    getAllPendingEvents,
    getAllGroupInfo,
    getGroupInfoForEvent,
    getStatusOfParticipation,
    canUnregisterForGroup,
    addToWishlist,
    removeFromWishlist,
    getWishlist
};
