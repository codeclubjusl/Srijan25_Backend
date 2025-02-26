const { default: mongoose } = require("mongoose");
const Events = require("../../models/events");
const User = require("../../models/user");
const { getGroupById } = require("./groups");

const addUserToParticipantList = async (eventId, userId) => {
    try {
        const event = await Events.findByIdAndUpdate(
            eventId,
            { $push: { participants: userId } },
            { new: true }
        );
        if (!event || event.length === 0) {
            throw new Error("Event not found.");
        }
        return { success: true, data: event };
    } catch (error) {
        console.error("Error adding user to participant list:", error);
        throw new Error(
            error.message ||
                "An error occurred while adding user to participant list."
        );
    }
};

const removeUserFromParticipantList = async (eventId, userId) => {
    try {
        const event = await Events.findByIdAndUpdate(
            eventId,
            { $pull: { participants: userId } },
            { new: true }
        );
        if (!event || event.length === 0) {
            throw new Error("Event not found.");
        }
        return { success: true, data: event };
    } catch (error) {
        console.error("Error removing user from participant list:", error);
        throw new Error(
            error.message ||
                "An error occurred while removing user from participant list."
        );
    }
};

const addGroupToEvent = async (eventId, groupId) => {
    try {
        const event = await Events.findByIdAndUpdate(
            eventId,
            { $push: { participantGroups: groupId } },
            { new: true }
        );
        if (!event || event.length === 0) {
            throw new Error("Event not found.");
        }
        return { success: true, data: event };
    } catch (error) {
        console.error("Error adding group to event:", error);
        throw new Error(
            error.message || "An error occurred while adding group to event."
        );
    }
};

const removeGroupFromEvent = async (eventId, groupId) => {
    try {
        const event = await Events.findByIdAndUpdate(
            eventId,
            { $pull: { participantGroups: groupId } },
            { new: true }
        );
        if (!event || event.length === 0) {
            throw new Error("Event not found.");
        }
        return { success: true, data: event };
    } catch (error) {
        console.error("Error removing group from event:", error);
        throw new Error(
            error.message ||
                "An error occurred while removing group from event."
        );
    }
};

const addPendingGroupToEvent = async (eventId, groupId) => {
    try {
        const event = await Events.findByIdAndUpdate(
            eventId,
            { $push: { pendingParticipantGroups: groupId } },
            { new: true }
        );
        if (!event || event.length === 0) {
            throw new Error("Event not found.");
        }
        return { success: true, data: event };
    } catch (error) {
        console.error("Error adding pending group to event:", error);
        throw new Error(
            error.message ||
                "An error occurred while adding pending group to event."
        );
    }
};

const removePendingGroupFromEvent = async (eventId, groupId) => {
    try {
        const event = await Events.findByIdAndUpdate(
            eventId,
            { $pull: { pendingParticipantGroups: groupId } },
            { new: true }
        );
        if (!event || event.length === 0) {
            throw new Error("Event not found.");
        }
        return { success: true, data: event };
    } catch (error) {
        console.error("Error removing pending group from event:", error);
        throw new Error(
            error.message ||
                "An error occurred while removing pending group from event."
        );
    }
};

const moveGroupFromPendingToParticipantGroups = async (eventId, groupId) => {
    try {
        // TODO: check if group is in pendingParticipantGroups
        const event = await Events.findByIdAndUpdate(
            eventId,
            {
                $pull: { pendingParticipantGroups: groupId },
                $push: { participantGroups: groupId },
            },
            { new: true }
        );
        if (!event || event.length === 0) {
            throw new Error("Event not found.");
        }
        return { success: true, data: event };
    } catch (error) {
        console.error(
            "Error moving group from pending to participant groups:",
            error
        );
        throw new Error(
            error.message ||
                "An error occurred while moving group from pending to participant groups."
        );
    }
};

const getParticipantGroupsForEvent = async (eventId) => {
    try {
        const event = await Events.findById(eventId);
        if (!event || event.length === 0) {
            throw new Error("Event not found.");
        }
        let groupDetails = [];
        for (let i = 0; i < event.length; i++) {
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
        if (!event || event.length === 0) {
            throw new Error("Event not found.");
        }
        let groupDetails = [];
        for (let i = 0; i < event.length; i++) {
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
        if (!event || event.length === 0) {
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
        if (!event || event.length === 0) {
            throw new Error("Event not found.");
        }
        return { success: true, data: event };
    } catch (error) {
        console.error("Error getting event by slug:", error);
        throw new Error(
            error.message || "An error occurred while getting event by slug."
        );
    }
};

const checkForParticipation = async (eventId, userId) => {
    try {
        const event = await Events.findById(eventId);
        if (!event || event.length === 0) {
            throw new Error("Event not found.");
        }
        if (event.participants.includes(userId)) {
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error checking for participation:", error);
        throw new Error(
            error.message ||
                "An error occurred while checking for participation."
        );
    }
};

const createNewEvent = async (
    name,
    description,
    isSolo,
    minParticipants,
    maxParticipants,
    category,
    slug
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
            slug: slug ? slug : name.toLowerCase().replaceAll(" ", "_"),
            minParticipants,
            maxParticipants,
            category,
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
    moveGroupFromPendingToParticipantGroups,
    getParticipantGroupsForEvent,
    getPendingParticipantGroupsForEvent,
    getParticipantsForEvent,
    getEventBySlug,
    createNewEvent,
    deleteEventById,
    checkForParticipation,
};
