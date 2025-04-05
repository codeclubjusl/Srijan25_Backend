function AdminController() {
  const bcrypt = require("bcrypt");
  const AdminUser = require("../models/adminUser");
  const Event = require("../models/events");
  const jwt = require("jsonwebtoken");

  this.superUserLogin = async (req, res, next) => {
    // console.log("Super User Login");
    const { username, password } = req.body;
    const user = await AdminUser.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.TOKEN_SECRET
    );
    res.json({ token });
  };

  this.superUserRegister = async (req, res, next) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await AdminUser.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new AdminUser({ username, password: hashedPassword, role });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  };

  this.fetchEventDetails = async (req, res) => {
    const { authToken, startIndex, endIndex, slug } = req.body;

    if (!authToken || slug === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request or Auth token" });
    }

    try {
      const decoded = jwt.verify(authToken, process.env.TOKEN_SECRET);
      const { id, role } = decoded;

      if (role !== "admin" && slug !== role) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Token" });
      }

      const event = await Event.findOne({ slug })
        .populate({
          path: "participants",
          select: "name email phone",
        })
        .populate({
          path: "participantGroups",
          populate: [
            {
              path: "members.user",
              select: "name email phone",
            },
            {
              path: "creator",
              select: "name email phone",
            },
          ],
        })
        .populate({
          path: "pendingParticipantGroups",
          populate: [
            {
              path: "members.user",
              select: "name email phone",
            },
            {
              path: "creator",
              select: "name email phone",
            },
          ],
        });

      if (!event) {
        return res
          .status(404)
          .json({ success: false, message: "Event not found" });
      }
      const allParticipants = [
        ...event.participantGroups,
        ...event.pendingParticipantGroups,
        ...event.participants,
      ];

      const {
        participants,
        participantGroups,
        pendingParticipantGroups,
        ...filteredEvent
      } = event.toObject();

      var count;
      if (event.isSolo) {
        count = {
          total: event.participants.length,
        };
      } else {
        var cnt = allParticipants.filter(
          (item) => item.status === "complete"
        ).length;
        count = {
          completedRegistration: cnt,
          pendingRegistration: allParticipants.length - cnt,
          total: allParticipants.length,
        };
      }

      if (startIndex === undefined || endIndex === undefined) {
        const updatedEvent = {
          ...filteredEvent,
          participants: allParticipants,
        };
        res.json({ success: true, updatedEvent, hasMore: false, count });
      } else {
        const updatedEvent = {
          ...filteredEvent,
          participants: allParticipants.slice(startIndex, endIndex),
        };
        const hasMore = allParticipants.length > endIndex ? true : false;
        res.json({ success: true, updatedEvent, hasMore, count });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Invalid token or server error",
        error,
      });
    }
  };

  this.fetchEventNames = async (req, res) => {
    const { authToken } = req.body;

    if (!authToken) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request or Auth token" });
    }

    try {
      const decoded = jwt.verify(authToken, process.env.TOKEN_SECRET);
      const { id, role } = decoded;
      const event =
        role !== "admin"
          ? await Event.findOne({ slug: role }).select("name slug _id")
          : await Event.find().select("name slug _id");

      if (!event) {
        return res
          .status(404)
          .json({ success: false, message: "Event not found" });
      }

      res.json({ success: true, event });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Invalid token or server error",
        error,
      });
    }
  };
}

const adminController = new AdminController();

module.exports = adminController;
