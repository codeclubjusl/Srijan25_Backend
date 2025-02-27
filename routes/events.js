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
    checkForParticipation,
} = require("../services/database/events");
const { default: mongoose } = require("mongoose");
const {
    addRegisteredEventToUser,
    addPendingEventToUser,
    removeRegisteredEventFromUser,
    putInvitation,
    removeInvitation,
    removePendingEventFromUser,
} = require("../services/database/users");
const {
    createGroup,
    getGroupByLeaderAndEvent,
    deleteGroupById,
} = require("../services/database/groups");
const User = require("../models/user");
const { isUserAuthenticated } = require("../middlewares");

router.get("/", async (req, res) => {
    res.json({ message: "Events route" });
});
// POST a new event
router.post("/new", isAdmin, async (req, res) => {
    try {
        let {
            name,
            description,
            isSolo,
            minParticipants,
            maxParticipants,
            category,
            slug,
        } = req.body;
        isSolo = isSolo == "true" ? true : false;
        if (
            !name ||
            !description ||
            !minParticipants ||
            !maxParticipants ||
            !slug ||
            isSolo == undefined ||
            isSolo == null
        ) {
            return res.status(400).send({
                success: false,
                message:
                    "All fields { name, description, isSolo, minParticipants, maxParticipants, slug } are required for creating new event.",
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
            maxParticipants,
            category,
            slug
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
router.delete("/delete/:slug", isAdmin, async (req, res) => {
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
router.get("/:slug", isAdmin, async (req, res) => {
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

router.get("/:slug/getParticipants", isAdmin, async (req, res) => {
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

router.get("/:slug/getParticipantGroups", isAdmin, async (req, res) => {
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

router.get("/:slug/getPendingParticipantGroups", isAdmin, async (req, res) => {
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
router.post("/:slug/register", isUserAuthenticated, async (req, res) => {
    try {
        const { data: event } = await getEventBySlug(req.params.slug);
        if (!event) {
            return res.status(404).send({
                success: false,
                message: "Event not found.",
            });
        }
        const isSolo = event.isSolo;
        let { userId, membersEmails, groupName } = req.body;
        console.log({ userId, membersEmails, groupName });
        membersEmails = isSolo ? [] : membersEmails ? membersEmails : [];

        if (!userId) {
            return res.status(400).send({
                success: false,
                message: "User ID is required for registering.",
            });
        }
        let leader = await User.findById(userId);
        if (!leader) {
            return res.status(404).send({
                success: false,
                message: "User not found.",
            });
        }

        if (isSolo && membersEmails.length) {
            return res.status(400).send({
                success: false,
                message: "Members emails are not required for solo events.",
            });
        }

        if (!isSolo && event.minParticipants > 1 && !membersEmails.length) {
            return res.status(400).send({
                success: false,
                message: "Members emails are required for group events.",
            });
        }

        if (
            membersEmails.length < event.minParticipants - 1 ||
            membersEmails.length > event.maxParticipants - 1
        ) {
            return res.status(400).send({
                success: false,
                message: `Number of members should be between ${event.minParticipants} and ${event.maxParticipants} participants.`,
            });
        }

        if (!isSolo && !groupName) {
            return res.status(400).send({
                success: false,
                message: "Group name is required for group events.",
            });
        }

        if (isSolo && groupName) {
            return res.status(400).send({
                success: false,
                message: "Group name is not required for solo events.",
            });
        }

        if (isSolo) {
            if (await checkForParticipation(event._id, userId)) {
                return res.status(400).send({
                    success: false,
                    message: `Participant (${userId}) already registered for event: ${event.name}`,
                });
            }
            await addUserToParticipantList(event._id, userId);
            await addRegisteredEventToUser(userId, event._id);

            return res.status(200).send({
                success: true,
                message: `Participant (${userId}) registered successfully to event: ${event.name}`,
            });
        } else {
            let { data: group } = await createGroup(
                userId,
                membersEmails,
                groupName,
                event._id
            );
            if (group.status == "complete") {
                await addGroupToEvent(event._id, group._id);
                await addRegisteredEventToUser(userId, event._id);
            } else {
                await addPendingGroupToEvent(event._id, group._id);
                await addPendingEventToUser(userId, event._id);
                for (const member of group.members) {
                    await addPendingEventToUser(member.user, event._id);
                    await putInvitation(member.user, event._id, group._id);
                }
            }
            return res.status(200).send({
                success: true,
                message: `Group (${groupName}) registered successfully to event: ${event.name}`,
            });
        }
    } catch (error) {
        console.error("Error registering participant for event:", error);
        return res.status(400).send({
            success: false,
            message:
                error.message ||
                "An error occurred while registering participant.",
        });
    }
});

router.post(
    "/:slug/cancel-registration",
    isUserAuthenticated,
    async (req, res) => {
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

            if (isSolo) {
                await removeUserFromParticipantList(event._id, userId);
                await removeRegisteredEventFromUser(userId, event._id);

                return res.status(200).send({
                    success: true,
                    message: `Participant (${userId}) registration cancelled successfully for event: ${event.name}`,
                });
            } else {
                let resp = await getGroupByLeaderAndEvent(userId, event._id);
                let group = resp.data;

                let status = group.status;
                if (status == "complete") {
                    await removeGroupFromEvent(event._id, group._id);
                    await removeRegisteredEventFromUser(
                        group.creator,
                        event._id
                    );
                    for (const member of group.members) {
                        await removeRegisteredEventFromUser(
                            member.user,
                            event._id
                        );
                    }
                } else {
                    await removePendingGroupFromEvent(event._id, group._id);
                    await removePendingEventFromUser(group.creator, event._id);
                    for (const member of group.members) {
                        await removePendingEventFromUser(
                            member.user,
                            event._id
                        );
                        await removeInvitation(
                            member.user,
                            event._id,
                            group._id
                        );
                    }
                }
                await deleteGroupById(group._id);

                return res.status(200).send({
                    success: true,
                    message: `Group (${group._id}) registration cancelled successfully for event: ${event.name}`,
                });
            }
        } catch (error) {
            console.error(
                "Error cancelling participant registration for event:",
                error
            );
            return res.status(400).send({
                success: false,
                message:
                    error.message ||
                    "An error occurred while cancelling participant registration.",
            });
        }
    }
);

module.exports = router;
