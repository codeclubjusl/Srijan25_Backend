const { default: mongoose } = require("mongoose");
const Users = require("../../models/user");

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

const moveEventFromPendingToRegisteredEventForUser = async (userId, eventId) => {
    try {
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

module.exports = {
    addRegisteredEventToUser,
    removeRegisteredEventFromUser,
    addPendingEventToUser,
    removePendingEventFromUser,
    moveEventFromPendingToRegisteredEventForUser,
};
