const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const User = require("../models/User");
const { Group } = require("../models/Group");
const { GroupInput } = require("../models/Groups");

// GET all groups
router.get("/", (req, res) => {
    Group.find()
        .then((groups) => {
            res.json(groups);
        })
        .catch((err) => {
            res.status(400).send(err);
        });
});

// GET a specific group
router.get("/:id", (req, res) => {
    Group.findById(req.params.id)
        .then((group) => {
            res.json(group);
        })
        .catch((err) => {
            res.status(400).send(err);
        });
});