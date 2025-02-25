const express = require("express")
const { isUserAuthenticated } = require("../middlewares")
const userController = require("../controllers/userController")
const merchController = require("../controllers/merchController")
const {
  getInvitations,
  getUserByEmail,
  moveEventFromPendingToRegisteredEventForUser,
  removePendingEventFromUser,
} = require("../services/database/users");
const {
  acceptInvitation,
  rejectInvitation,
} = require("../services/database/groups");
const {
  acceptInvitation: acceptInvitationByUser,
  rejectInvitation: rejectInvitationByUser,
} = require("../services/database/users");
const {
  moveGroupFromPendingToParticipantGroups,
  removePendingGroupFromEvent,
} = require("../services/database/events");


const router = express.Router();

router.get("/users/:id", isUserAuthenticated, userController.getUserById)
router.delete("/users/:id", isUserAuthenticated, userController.deleteUserById)
router.delete("/users/:id", isUserAuthenticated, userController.deleteUserById)
router.get("/users/get/Merchandise", isUserAuthenticated, merchController.getMerchant)
router.get("/users/get/testing", merchController.testing)
router.post("/users/merchandise", isUserAuthenticated, merchController.bookMerchant)

router.get("/users/:id", isUserAuthenticated, userController.getUserById);
router.delete("/users/:id", isUserAuthenticated, userController.deleteUserById);

router.get("/testAuth", isUserAuthenticated, (req, res) => {
  return res.status(200).json({ message: "Authenticated" });
});

router.get("/invitations", isUserAuthenticated, async (req, res) => {
  try {
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

router.post("/accept-invitation", isUserAuthenticated, async (req, res) => {
  try {
    let { data: user } = await getUserByEmail(req.email);
    const { groupId } = req.body;
    const updatedUser = await acceptInvitationByUser(groupId, user.id);
    const { isGroupComplete, event } = await acceptInvitation(
      groupId,
      user.id
    );
    if (isGroupComplete) {
      await moveEventFromPendingToRegisteredEventForUser(user.id, event);
      await moveGroupFromPendingToParticipantGroups(event, groupId);
    }
    return res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error accepting invitation for user:", error);
    return res.status(500).json({ error: error.message });
  }
});

router.post("/reject-invitation", isUserAuthenticated, async (req, res) => {
  try {
    let { data: user } = await getUserByEmail(req.email);
    const { groupId } = req.body;
    const updatedUser = await rejectInvitationByUser(groupId, user.id);
    const { event } = await rejectInvitation(groupId, user.id);
    await removePendingEventFromUser(user.id, event);
    await removePendingGroupFromEvent(event, groupId);
    return res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error rejecting invitation for user:", error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
