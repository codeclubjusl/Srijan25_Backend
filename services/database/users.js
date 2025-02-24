const { default: mongoose } = require("mongoose");
const Users = require("../../models/user");

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
                    invitations: { eventId, groupId },
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
            .populate("invitations.event", "name")
            .populate("invitations.group", "name");
        if (!user || user.length === 0) {
            throw new Error("User not found.");
        }
        return {
            success: true,
            data: user.invitations.filter(
                (invitation) => invitation.status === "pending"
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
};
