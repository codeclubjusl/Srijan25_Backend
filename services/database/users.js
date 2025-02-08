const { default: mongoose } = require("mongoose");
const Users = require("../../models/user");

const addRegisteredEventToUser = async (
    userId,
    eventId,
    session = null, // pass previous session if exists
    contd = false // pass true if transaction is already started and should be continued
) => {
    if (!session) session = await mongoose.startSession();
    if (!contd) session.startTransaction();
    try {
        const user = await Users.findByIdAndUpdate(
            userId,
            { $push: { registeredEvents: eventId } },
            { new: true }
        ).session(session);
        if(!user) {
            throw new Error("User not found.");
        }
        if (!contd) {
            await session.commitTransaction();
            session.endSession();
        }
        return { success: true, data: user };
    } catch (error) {
        console.error("Error adding registered event to user:", error);
        await session.abortTransaction();
        session.endSession();
        throw new Error(error.message || "An error occurred while adding registered event to user.");
    }
};

const removeRegisteredEventFromUser = async (
    userId,
    eventId,
    session = null, // pass previous session if exists
    contd = false // pass true if transaction is already started and should be continued
) => {
    if (!session) session = await mongoose.startSession();
    if (!contd) session.startTransaction();
    try {
        const user = await Users.findByIdAndUpdate(
            userId,
            { $pull: { registeredEvents: eventId } },
            { new: true }
        ).session(session);
        if(!user) {
            throw new Error("User not found.");
        }
        if (!contd) {
            await session.commitTransaction();
            session.endSession();
        }
        return { success: true, data: user };
    } catch (error) {
        console.error("Error removing registered event from user:", error);
        await session.abortTransaction();
        session.endSession();
        throw new Error(error.message || "An error occurred while removing registered event from user.");
    }
};

const addPendingEventToUser = async (
    userId,
    eventId,
    session = null, // pass previous session if exists
    contd = false // pass true if transaction is already started and should be continued
) => {
    if (!session) session = await mongoose.startSession();
    if (!contd) session.startTransaction();
    try {
        const user = await Users.findByIdAndUpdate(
            userId,
            { $push: { pendingEvents: eventId } },
            { new: true }
        ).session(session);
        if (!user) {
            throw new Error("User not found.");
        }
        if (!contd) {
            await session.commitTransaction();
            session.endSession();
        }
        return { success: true, data: user };
    } catch (error) {
        console.error("Error adding pending event to user:", error);
        await session.abortTransaction();
        session.endSession();
        throw new Error(error.message || "An error occurred while adding pending event to user.");
    }
};

const removePendingEventFromUser = async (
    userId,
    eventId,
    session = null, // pass previous session if exists
    contd = false // pass true if transaction is already started and should be continued
) => {
    if (!session) session = await mongoose.startSession();
    if (!contd) session.startTransaction();
    try {
        const user = await Users.findByIdAndUpdate(
            userId,
            { $pull: { pendingEvents: eventId } },
            { new: true }
        ).session(session);
        if (!user) {
            throw new Error("User not found.");
        }
        if (!contd) {
            await session.commitTransaction();
            session.endSession();
        }
        return { success: true, data: user };
    } catch (error) {
        console.error("Error removing pending event from user:", error);
        await session.abortTransaction();
        session.endSession();
        throw new Error(error.message || "An error occurred while removing pending event from user.");
    }
};

const moveEventFromPendingToRegisteredEventForUser = async (
    userId,
    eventId,
    session = null, // pass previous session if exists
    contd = false // pass true if transaction is already started and should be continued
) => {
    if (!session) session = await mongoose.startSession();
    if (!contd) session.startTransaction();
    try {
        const user = await Users.findByIdAndUpdate(
            userId,
            {
                $pull: { pendingEvents: eventId },
                $push: { registeredEvents: eventId },
            },
            { new: true }
        ).session(session);
        if (!user) {
            throw new Error("User not found.");
        }
        if (!contd) {
            await session.commitTransaction();
            session.endSession();
        }
        return { success: true, data: user };
    } catch (error) {
        console.error(
            "Error moving event from pending to registered event for user:",
            error
        );
        await session.abortTransaction();
        session.endSession();
        throw new Error(error.message || "An error occurred while moving event from pending to registered event for user.");
    }
};

module.exports = {
    addRegisteredEventToUser,
    removeRegisteredEventFromUser,
    addPendingEventToUser,
    removePendingEventFromUser,
    moveEventFromPendingToRegisteredEventForUser,
};
