const express = require("express");
const { isUserAuthenticated } = require("../middlewares");
const userController = require("../controllers/userController");
const merchController = require("../controllers/merchController");
const {
    getInvitations,
    getUserByEmail,
    moveEventFromPendingToRegisteredEventForUser,
    removePendingEventFromUser,
    getAllPendingEvents,
    getGroupInfoForEvent,
    getStatusOfParticipation,
    canUnregisterForGroup,
} = require("../services/database/users");
const {
    acceptInvitation,
    rejectInvitation,
    getGroupById,
} = require("../services/database/groups");
const {
    acceptInvitation: acceptInvitationByUser,
    rejectInvitation: rejectInvitationByUser,
} = require("../services/database/users");
const {
    moveGroupFromPendingToParticipantGroups,
    removePendingGroupFromEvent,
    getEventBySlug,
} = require("../services/database/events");

const router = express.Router();

router.get("/testAuth", isUserAuthenticated, (req, res) => {
    return res.status(200).json({ message: "Authenticated" });
});

router.get(
    "/users/get-participation-status/:slug",
    isUserAuthenticated,
    async (req, res) => {
        try {
            let { data: user } = await getUserByEmail(req.email);
            let { data: event } = await getEventBySlug(req.params.slug);
            if (!user) {
                throw new Error("User not found.");
            }
            const participationStatus = await getStatusOfParticipation(
                user.id,
                event._id
            );
            return res.status(200).json(participationStatus);
        } catch (error) {
            console.error(
                "Error getting participation status for user:",
                error
            );
            return res.status(500).json({ error: error.message });
        }
    }
);

router.get(
    "/users/can-unregister/:slug",
    isUserAuthenticated,
    async (req, res) => {
        try {
            let { data: user } = await getUserByEmail(req.email);
            let { data: event } = await getEventBySlug(req.params.slug);
            if (!user) {
                throw new Error("User not found.");
            }
            const participationStatus = await getStatusOfParticipation(
                user.id,
                event._id
            );
            if (participationStatus.status === "not-participating") {
                return res
                    .status(200)
                    .json({ success: true, canUnregister: false });
            }
            if (event.isSolo)
                return res
                    .status(200)
                    .json({ success: true, canUnregister: true });
            return res.status(200).json({
                success: true,
                canUnregister: await canUnregisterForGroup(user.id, event._id),
            });
        } catch (error) {
            console.error(
                "Error getting participation status for user:",
                error
            );
            return res.status(500).json({ error: error.message });
        }
    }
);

router.get("/users/registered", isUserAuthenticated, async (req, res) => {
    try {
        let { data: user } = await getUserByEmail(req.email);
        if (!user) {
            throw new Error("User not found.");
        }
        const registeredEvents = await getAllParticipatingEvents(user.id);
        return res.status(200).json(registeredEvents);
    } catch (error) {
        console.error("Error getting registered events for user:", error);
        return res.status(500).json({ error: error.message });
    }
});
router.get("/users/pending", isUserAuthenticated, async (req, res) => {
    try {
        let { data: user } = await getUserByEmail(req.email);
        if (!user) {
            throw new Error("User not found.");
        }
        const pendingEvents = await getAllPendingEvents(user.id);
        return res.status(200).json(pendingEvents);
    } catch (error) {
        console.error("Error getting pending events for user:", error);
        return res.status(500).json({ error: error.message });
    }
});
router.get(
    "/users/:id/wishlist",
    isUserAuthenticated,
    userController.getUserById
);

router.get(
    "/users/group-info-for-event/:slug",
    isUserAuthenticated,
    async (req, res) => {
        try {
            let { data: user } = await getUserByEmail(req.email);
            let { data: event } = await getEventBySlug(req.params.slug);
            if (!user) {
                throw new Error("User not found.");
            }
            const groupInfo = await getGroupInfoForEvent(user.id, event._id);
            return res.status(200).json(groupInfo);
        } catch (error) {
            console.error("Error getting group info for user:", error);
            return res.status(500).json({ error: error.message });
        }
    }
);

router.get(
    "/users/get-all-group-info",
    isUserAuthenticated,
    async (req, res) => {
        try {
            let { data: user } = await getUserByEmail(req.email);
            if (!user) {
                throw new Error("User not found.");
            }
            const groupInfo = await getAllGroupInfo(user.id);
            return res.status(200).json(groupInfo);
        } catch (error) {
            console.error("Error getting group info for user:", error);
            return res.status(500).json({ error: error.message });
        }
    }
);

router.get("/users/invitations", isUserAuthenticated, async (req, res) => {
    try {
        console.log("HERE 👋🏼");
        let { data: user } = await getUserByEmail(req.email);
        const userId = user.id;
        if (!userId) {
            throw new Error("User not found.");
        }
        const invitations = await getInvitations(userId);
        return res.status(200).json(invitations);
    } catch (error) {
        console.error("Error getting invitations for user:", error);
        return res.status(500).json({ error: error.message });
    }
});

router.post(
    "/users/accept-invitation",
    isUserAuthenticated,
    async (req, res) => {
        try {
            let { data: user } = await getUserByEmail(req.email);
            const { groupId } = req.body;
            const groupInfo = await getGroupById(groupId);
            const updatedUser = await acceptInvitationByUser(groupId, user.id);
            const { isGroupComplete, event } = await acceptInvitation(
                groupId,
                user.id
            );
            if (isGroupComplete) {
                await moveEventFromPendingToRegisteredEventForUser(
                    user.id,
                    event
                );
                await moveGroupFromPendingToParticipantGroups(event, groupId);
                for (let member of groupInfo.members) {
                    await moveEventFromPendingToRegisteredEventForUser(
                        member.user,
                        event
                    );
                }
            }
            return res.status(200).json({
                success: true,
                data: updatedUser,
            });
        } catch (error) {
            console.error("Error accepting invitation for user:", error);
            return res.status(500).json({ error: error.message });
        }
    }
);

router.post(
    "/users/reject-invitation",
    isUserAuthenticated,
    async (req, res) => {
        try {
            let { data: user } = await getUserByEmail(req.email);
            const { groupId } = req.body;
            const groupInfo = await getGroupById(groupId);
            const updatedUser = await rejectInvitationByUser(groupId, user.id);
            const { event } = await rejectInvitation(groupId, user.id);
            await removePendingEventFromUser(user.id, event);
            await removePendingGroupFromEvent(event, groupId);
            for (let member of groupInfo.members) {
                await removePendingEventFromUser(member.user, event);
            }
            return res.status(200).json({
                success: true,
                data: updatedUser,
            });
        } catch (error) {
            console.error("Error rejecting invitation for user:", error);
            return res.status(500).json({ error: error.message });
        }
    }
);

router.get("/users/:id", isUserAuthenticated, userController.getUserById);
router.delete("/users/:id", isUserAuthenticated, userController.deleteUserById);
router.delete("/users/:id", isUserAuthenticated, userController.deleteUserById);
router.get(
    "/users/get/Merchandise",
    isUserAuthenticated,
    merchController.getMerchant
);
router.post(
    "/users/merchandise",
    isUserAuthenticated,
    merchController.bookMerchant
);

router.get("/users/:id", isUserAuthenticated, userController.getUserById);
router.delete("/users/:id", isUserAuthenticated, userController.deleteUserById);

module.exports = router;
