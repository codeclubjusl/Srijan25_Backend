const express = require("express");
const router = express.Router();
const isAdmin = require("../middlewares/isAdmin");
const {
    getEventBySlug,
    getParticipantsForEvent,
    getPendingParticipantGroupsForEvent,
    getParticipantGroupsForEvent,
    createNewEvent,
    deleteEventById,
    addUserToParticipantList,
    addPendingGroupToEvent,
    removeUserFromParticipantList,
    removePendingGroupFromEvent,
    removeGroupFromEvent,
    addGroupToEvent,
} = require("../services/database/events");
const { default: mongoose } = require("mongoose");
const {
    addRegisteredEventToUser,
    addPendingEventToUser,
    removeRegisteredEventFromUser,
} = require("../services/database/users");
const {
    createGroup,
    getGroupByLeaderAndEvent,
} = require("../services/database/groups");

router.get("/", async (req, res) => {
    res.json({ message: "Events route" });
});
// POST a new event
router.post("/new", async (req, res) => {
    try {
        const { name, description, isSolo, minParticipants, maxParticipants } =
            req.body;
        if (
            !name ||
            !description ||
            !minParticipants ||
            !maxParticipants ||
            isSolo == undefined ||
            isSolo == null
        ) {
            return res.status(400).send({
                success: false,
                message:
                    "All fields { name, description, isSolo, minParticipants, maxParticipants } are required for creating new event.",
            });
        }
        if (isSolo && minParticipants != 1 && maxParticipants != 1) {
            return res.status(400).send({
                success: false,
                message:
                    "For solo events, min and max participants should be 1.",
            });
        }
        const { success, data: event } = await createNewEvent(
            name,
            description,
            isSolo,
            minParticipants,
            maxParticipants
        );
        return res.status(201).send({ success, data: event });
    } catch (error) {
        console.error("Error creating new event:", error);
        return res.status(400).send({
            success: false,
            message:
                error.message || "An error occurred while creating new event.",
        });
    }
});

// DELETE an event
router.delete("/delete/:slug", async (req, res) => {
    try {
        const { data: event } = await getEventBySlug(req.params.slug);
        const { success, message } = await deleteEventById(event._id);
        return res.status(200).send({ success, message });
    } catch (error) {
        console.error("Error deleting event:", error);
        return res.status(400).send({
            success: false,
            message: error.message || "An error occurred while deleting event.",
        });
    }
});

// GET a specific event
router.get("/:slug", async (req, res) => {
    try {
        const { success, data: event } = await getEventBySlug(req.params.slug);
        return res.status(200).send({ success, data: event });
    } catch (error) {
        console.error("Error getting event by slug:", error);
        return res.status(400).send({
            success: false,
            message:
                error.message ||
                "An error occurred while getting event by slug.",
        });
    }
});

router.get("/:slug/getParticipants", async (req, res) => {
    try {
        const { data: event } = await getEventBySlug(req.params.slug);
        const { success, data: participants } = await getParticipantsForEvent(
            event._id
        );
        return res.status(200).send({ success, data: participants });
    } catch (error) {
        console.error("Error getting participants for event:", error);
        return res.status(400).send({
            success: false,
            message:
                error.message ||
                "An error occurred while getting participants.",
        });
    }
});

router.get("/:slug/getParticipantGroups", async (req, res) => {
    try {
        const { data: event } = await getEventBySlug(req.params.slug);
        const { success, data: groups } = await getParticipantGroupsForEvent(
            event._id
        );
        return res.status(200).send({ success, data: groups });
    } catch (error) {
        console.error("Error getting participant groups for event:", error);
        return res.status(400).send({
            success: false,
            message:
                error.message ||
                "An error occurred while getting participant groups.",
        });
    }
});

router.get("/:slug/getPendingParticipantGroups", async (req, res) => {
    try {
        const { data: event } = await getEventBySlug(req.params.slug);
        const { success, data: groups } =
            await getPendingParticipantGroupsForEvent(event._id);
        return res.status(200).send({ success, data: groups });
    } catch (error) {
        console.error(
            "Error getting pending participant groups for event:",
            error
        );
        return res.status(400).send({
            success: false,
            message:
                error.message ||
                "An error occurred while getting pending participant groups.",
        });
    }
});

// POST a participant to an event
router.post("/:slug/register", async (req, res) => {
    try {
        const { data: event } = await getEventBySlug(req.params.slug);
        if (!event) {
            return res.status(404).send({
                success: false,
                message: "Event not found.",
            });
        }
        const isSolo = event.isSolo;
        const { userId, membersEmails, groupName } = req.body;

        if (!userId) {
            return res.status(400).send({
                success: false,
                message: "User ID is required for registering.",
            });
        }

        if (isSolo && membersEmails) {
            return res.status(400).send({
                success: false,
                message: "Members emails are not required for solo events.",
            });
        }

        if (!isSolo && !membersEmails) {
            return res.status(400).send({
                success: false,
                message: "Members emails are required for group events.",
            });
        }

        if (
            !(membersEmails.length < event.minParticipants - 1) &&
            membersEmails.length > event.maxParticipants - 1
        ) {
            return res.status(400).send({
                success: false,
                message:
                    "Number of members should be between min and max participants.",
            });
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        if (isSolo) {
            await addUserToParticipantList(event._id, userId, session, true);
            await addRegisteredEventToUser(userId, event._id, session, true);

            await session.commitTransaction();
            session.endSession();

            return res.status(200).send({
                success: true,
                message: `Participant (${userId}) registered successfully to event: ${event.name}`,
            });
        } else {
            let { data: group } = await createGroup(
                userId,
                membersEmails,
                groupName,
                event._id,
                session,
                true
            );
            if (group.status == "complete") {
                await addGroupToEvent(event._id, group._id, session, true);

                await addRegisteredEventToUser(
                    userId,
                    event._id,
                    session,
                    true
                );
            } else {
                await addPendingGroupToEvent(
                    event._id,
                    group._id,
                    session,
                    true
                );

                await addPendingEventToUser(userId, event._id, session, true);
                for (const member of group.members) {
                    await addPendingEventToUser(
                        member.user,
                        event._id,
                        session,
                        true
                    );
                }
            }
            await session.commitTransaction();
            session.endSession();
            return res.status(200).send({
                success: true,
                message: `Group (${resp.data._id}) registered successfully to event: ${event.name}`,
            });
        }
    } catch (error) {
        console.error("Error registering participant for event:", error);
        await session.abortTransaction();
        session.endSession();
        return res.status(400).send({
            success: false,
            message:
                error.message ||
                "An error occurred while registering participant.",
        });
    }
});

router.post("/:slug/cancel-registration", async (req, res) => {
    try {
        const { data: event } = await getEventBySlug(req.params.slug);
        if (!event) {
            return res.status(404).send({
                success: false,
                message: "Event not found.",
            });
        }
        const isSolo = event.isSolo;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).send({
                success: false,
                message: "User ID is required for cancelling registration.",
            });
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        if (isSolo) {
            await removeUserFromParticipantList(
                event._id,
                userId,
                session,
                true
            );
            await removeRegisteredEventFromUser(
                userId,
                event._id,
                session,
                true
            );

            await session.commitTransaction();
            session.endSession();
            return res.status(200).send({
                success: true,
                message: `Participant (${userId}) registration cancelled successfully for event: ${event.name}`,
            });
        } else {
            let group = await getGroupByLeaderAndEvent(userId, event._id).data;
            if (!group) {
                return res.status(404).send({
                    success: false,
                    message: "Group not found.",
                });
            }

            let status = group.status;
            let resp;
            if (status == "complete") {
                await removeGroupFromEvent(event._id, group._id, session, true);
                await removeRegisteredEventFromUser(
                    group.creator,
                    event._id,
                    session,
                    true
                );
                for (const member of group.members) {
                    await removeRegisteredEventFromUser(
                        member.user,
                        event._id,
                        session,
                        true
                    );
                }
            } else {
                resp = await removePendingGroupFromEvent(
                    event._id,
                    group._id,
                    session,
                    true
                );
                await removePendingEventFromUser(
                    group.creator,
                    event._id,
                    session,
                    true
                );
                for (const member of group.members) {
                    await removePendingEventFromUser(
                        member.user,
                        event._id,
                        session,
                        true
                    );
                }
            }

            await session.commitTransaction();
            session.endSession();
            return res.status(200).send({
                success: true,
                message: `Group (${resp.data._id}) registration cancelled successfully for event: ${event.name}`,
            });
        }
    } catch (error) {
        console.error(
            "Error cancelling participant registration for event:",
            error
        );
        await session.abortTransaction();
        session.endSession();
        return res.status(400).send({
            success: false,
            message:
                error.message ||
                "An error occurred while cancelling participant registration.",
        });
    }
});

module.exports = router;
