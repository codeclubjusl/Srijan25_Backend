const { default: mongoose } = require("mongoose");
const Events = require("../../models/events");
const User = require("../../models/user");
const { getGroupById } = require("./groups");

const addUserToParticipantList = async (
    eventId,
    userId,
    session = null, // pass previous session if exists
    contd = false // pass true if transaction is already started and should be continued
) => {
    if (!session) session = await mongoose.startSession();
    if (!contd) session.startTransaction();
    try {
        const event = await Events.findByIdAndUpdate(
            eventId,
            { $push: { participants: userId } },
            { new: true }
        ).session(session);
        if (!event) {
            throw new Error("Event not found.");
        }
        if (!contd) {
            await session.commitTransaction();
            session.endSession();
        }
        return { success: true, data: event };
    } catch (error) {
        console.error("Error adding user to participant list:", error);
        await session.abortTransaction();
        session.endSession();
        throw new Error(
            error.message ||
                "An error occurred while adding user to participant list."
        );
    }
};

const removeUserFromParticipantList = async (
    eventId,
    userId,
    session = null,
    contd = false
) => {
    if (!session) session = await mongoose.startSession();
    if (!contd) session.startTransaction();
    try {
        const event = await Events.findByIdAndUpdate(
            eventId,
            { $pull: { participants: userId } },
            { new: true }
        ).session(session);
        if (!event) {
            throw new Error("Event not found.");
        }
        if (!contd) {
            await session.commitTransaction();
            session.endSession();
        }
        return { success: true, data: event };
    } catch (error) {
        console.error("Error removing user from participant list:", error);
        await session.abortTransaction();
        session.endSession();
        throw new Error(
            error.message ||
                "An error occurred while removing user from participant list."
        );
    }
};

const addGroupToEvent = async (
    eventId,
    groupId,
    session = null,
    contd = false
) => {
    if (!session) session = await mongoose.startSession();
    if (!contd) session.startTransaction();
    try {
        const event = await Events.findByIdAndUpdate(
            eventId,
            { $push: { participantGroups: groupId } },
            { new: true }
        ).session(session);
        if (!event) {
            throw new Error("Event not found.");
        }
        if (!contd) {
            await session.commitTransaction();
            session.endSession();
        }
        return { success: true, data: event };
    } catch (error) {
        console.error("Error adding group to event:", error);
        await session.abortTransaction();
        session.endSession();
        throw new Error(
            error.message || "An error occurred while adding group to event."
        );
    }
};

const removeGroupFromEvent = async (
    eventId,
    groupId,
    session = null,
    contd = false
) => {
    if (!session) session = await mongoose.startSession();
    if (!contd) session.startTransaction();
    try {
        const event = await Events.findByIdAndUpdate(
            eventId,
            { $pull: { participantGroups: groupId } },
            { new: true }
        ).session(session);
        if (!event) {
            throw new Error("Event not found.");
        }
        if (!contd) {
            await session.commitTransaction();
            session.endSession();
        }
        return { success: true, data: event };
    } catch (error) {
        console.error("Error removing group from event:", error);
        await session.abortTransaction();
        session.endSession();
        throw new Error(
            error.message ||
                "An error occurred while removing group from event."
        );
    }
};

const addPendingGroupToEvent = async (
    eventId,
    groupId,
    session = null,
    contd = false
) => {
    if (!session) session = await mongoose.startSession();
    if (!contd) session.startTransaction();
    try {
        const event = await Events.findByIdAndUpdate(
            eventId,
            { $push: { pendingParticipantGroups: groupId } },
            { new: true }
        ).session(session);
        if (!event) {
            throw new Error("Event not found.");
        }
        if (!contd) {
            await session.commitTransaction();
            session.endSession();
        }
        return { success: true, data: event };
    } catch (error) {
        console.error("Error adding pending group to event:", error);
        await session.abortTransaction();
        session.endSession();
        throw new Error(
            error.message ||
                "An error occurred while adding pending group to event."
        );
    }
};

const removePendingGroupFromEvent = async (
    eventId,
    groupId,
    session = null,
    contd = false
) => {
    if (!session) session = await mongoose.startSession();
    if (!contd) session.startTransaction();
    try {
        const event = await Events.findByIdAndUpdate(
            eventId,
            { $pull: { pendingParticipantGroups: groupId } },
            { new: true }
        ).session(session);
        if (!event) {
            throw new Error("Event not found.");
        }
        if (!contd) {
            await session.commitTransaction();
            session.endSession();
        }
        return { success: true, data: event };
    } catch (error) {
        console.error("Error removing pending group from event:", error);
        await session.abortTransaction();
        session.endSession();
        throw new Error(
            error.message ||
                "An error occurred while removing pending group from event."
        );
    }
};

const getParticipantGroupsForEvent = async (eventId) => {
    try {
        const event = await Events.findById(eventId);
        if (!event) {
            throw new Error("Event not found.");
        }
        let groupDetails = [];
        for (let i = 0; i < event.participantGroups.length; i++) {
            const group = await getGroupById(event.participantGroups[i]);
            if (group.success) {
                groupDetails.push(group.data);
            } else {
                console.error("Error getting group details:", group.message);
                throw new Error(
                    error.message ||
                        "An error occurred while getting group details."
                );
            }
        }
        return { success: true, data: groupDetails };
    } catch (error) {
        console.error("Error getting participant groups for event:", error);
        throw new Error(
            error.message ||
                "An error occurred while getting participant groups."
        );
    }
};

const getPendingParticipantGroupsForEvent = async (eventId) => {
    try {
        const event = await Events.findById(eventId);
        if (!event) {
            throw new Error("Event not found.");
        }
        let groupDetails = [];
        for (let i = 0; i < event.pendingParticipantGroups.length; i++) {
            const group = await getGroupById(event.pendingParticipantGroups[i]);
            if (group.success) {
                groupDetails.push(group.data);
            } else {
                console.error("Error getting group details:", group.message);
                throw new Error(
                    error.message ||
                        "An error occurred while getting group details."
                );
            }
        }
        return { success: true, data: groupDetails };
    } catch (error) {
        console.error(
            "Error getting pending participant groups for event:",
            error
        );
        throw new Error(
            error.message ||
                "An error occurred while getting pending participant groups."
        );
    }
};

const getParticipantsForEvent = async (eventId) => {
    try {
        const event = await Events.findById(eventId);
        if (!event) {
            throw new Error("Event not found.");
        }
        let participants = [];
        for (let i = 0; i < event.participants.length; i++) {
            const user = await User.findById(event.participants[i])?.toJSON();
            if (user.success) {
                participants.push(user.data);
            } else {
                console.error("Error getting user details:", user.message);
                throw new Error(
                    error.message ||
                        "An error occurred while getting user details."
                );
            }
        }
        return { success: true, data: participants };
    } catch (error) {
        console.error("Error getting participants for event:", error);
        throw new Error(
            error.message || "An error occurred while getting participants."
        );
    }
};

const getEventBySlug = async (slug) => {
    try {
        const event = await Events.findOne({ slug });
        return { success: true, data: event };
    } catch (error) {
        console.error("Error getting event by slug:", error);
        throw new Error(
            error.message || "An error occurred while getting event by slug."
        );
    }
};

const createNewEvent = async (
    name,
    description,
    isSolo,
    minParticipants,
    maxParticipants
) => {
    try {
        let existingEvent = await Events.findOne({ name });
        if (existingEvent) {
            throw new Error("Event already exists.");
        }
        const event = new Events({
            name,
            description,
            isSolo,
            slug: name.toLowerCase().replaceAll(" ", "-"),
            minParticipants,
            maxParticipants,
        });
        await event.save();
        return { success: true, data: event };
    } catch (error) {
        console.error("Error creating new event:", error);
        throw new Error(
            error.message || "An error occurred while creating new event."
        );
    }
};

const deleteEventById = async (eventId) => {
    try {
        await Events.findByIdAndDelete(eventId);
        return { success: true, message: "Event deleted successfully." };
    } catch (error) {
        console.error("Error deleting event:", error);
        throw new Error(
            error.message || "An error occurred while deleting event."
        );
    }
};

module.exports = {
    addUserToParticipantList,
    removeUserFromParticipantList,
    addGroupToEvent,
    removeGroupFromEvent,
    addPendingGroupToEvent,
    removePendingGroupFromEvent,
    getParticipantGroupsForEvent,
    getPendingParticipantGroupsForEvent,
    getParticipantsForEvent,
    getEventBySlug,
    createNewEvent,
    deleteEventById,
};
