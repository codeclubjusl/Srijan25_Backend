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

// POST a new group
router.post("/", (req, res) => {
    let paresedResp;
    try {
        paresedResp = GroupInput.parse(req.body);
    } catch (err) {
        res.status(400).send(
            `Invalid input. ${err.errors.map((err) => err.message).join(", ")}`
        );
    }
    const group = new Group(paresedResp);
    group
        .save()
        .then((group) => {
            res.json(group);
        })
        .catch((err) => {
            res.status(400).send(err);
        });
});

// PUT update a group
router.put("/:id", (req, res) => {
    // TODO: Check if the user is the creator of the group
    Group.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    })
        .then((group) => {
            res.json(group);
        })
        .catch((err) => {
            res.status(400).send(err);
        });
});

// DELETE a group
router.delete("/:id", (req, res) => {
    // TODO: Check if the user is the creator of the group
    Group.findByIdAndDelete(req.params.id)
        .then((group) => {
            res.json(group);
        })
        .catch((err) => {
            res.status(400).send(err);
        });
});
