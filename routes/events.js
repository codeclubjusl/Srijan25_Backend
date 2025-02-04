const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const User = require("../models/User");
const { Group } = require("../models/Groups");

// GET all events
router.get("/", (req, res) => {
    Event.find()
        .then((events) => {
            res.json(events);
        })
        .catch((err) => {
            res.status(400).send(err);
        });
});

// GET a specific event
router.get("/:id", (req, res) => {
    Event.findById(req.params.id)
        .then((event) => {
            res.json(event);
        })
        .catch((err) => {
            res.status(400).send(err);
        });
});

// POST a new event
router.post("/", (req, res) => {
    const event = new Event(req.body);
    event
        .save()
        .then((event) => {
            res.json(event);
        })
        .catch((err) => {
            res.status(400).send(err);
        });
});

// PUT update an event
router.put("/:id", (req, res) => {
    Event.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    })
        .then((event) => {
            res.json(event);
        })
        .catch((err) => {
            res.status(400).send(err);
        });
});

// DELETE an event
router.delete("/:id", (req, res) => {
    Event.findByIdAndDelete(req.params.id)
        .then((event) => {
            res.json(event);
        })
        .catch((err) => {
            res.status(400).send(err);
        });
});

// POST a participant to an event
router.post("/:id/participants", (req, res) => {
    Event.findById(req.params.id)
        .then((event) => {
            if (req.body.isGroup) {
                Group.findById(req.body.group)
                    .then((group) => {
                        event.participants.push({
                            isSolo: req.body.isGroup,
                            group: group._id,
                        });
                        event
                            .save()
                            .then((event) => {
                                res.json(event);
                            })
                            .catch((err) => {
                                res.status(400).send(err);
                            });
                        group.events.push(event._id);
                        group
                            .save()
                            .then((group) => {
                                res.json(group);
                            })
                            .catch((err) => {
                                res.status(400).send(err);
                            });
                    })
                    .catch((err) => {
                        res.status(400).send(err);
                    });
            }
            if (!req.body.isGroup && req.body.solo) {
                User.findById(req.body.solo)
                    .then((user) => {
                        event.participants.push({
                            isSolo: req.body.isSolo,
                            solo: user._id,
                        });
                        event
                            .save()
                            .then((event) => {
                                res.json(event);
                            })
                            .catch((err) => {
                                res.status(400).send(err);
                            });
                        user.events.push({
                            event: event._id,
                            isSolo: true,
                        });
                        user.save()
                            .then((user) => {
                                res.json(user);
                            })
                            .catch((err) => {
                                res.status(400).send(err);
                            });
                    })
                    .catch((err) => {
                        res.status(400).send(err);
                    });
            }
        })
        .catch((err) => {
            res.status(400).send(err);
        });
});

// DELETE a participant from an event
router.delete("/:id/participants/:participantId", (req, res) => {
    Event.findById(req.params.id)
        .then((event) => {
            const participant = event.participants.id(req.params.participantId);
            if (participant.isSolo) {
                User.findById(participant.solo)
                    .then((user) => {
                        user.events.pull(event._id);
                        user.save()
                            .then((user) => {
                                res.json(user);
                            })
                            .catch((err) => {
                                res.status(400).send(err);
                            });
                    })
                    .catch((err) => {
                        res.status(400).send(err);
                    });
            }
            if (!participant.isSolo) {
                Group.findById(participant.group)
                    .then((group) => {
                        group.events.pull(event._id);
                        group
                            .save()
                            .then((group) => {
                                res.json(group);
                            })
                            .catch((err) => {
                                res.status(400).send(err);
                            });
                    })
                    .catch((err) => {
                        res.status(400).send(err);
                    });
            }
            event.participants.pull(participant._id);
            event
                .save()
                .then((event) => {
                    res.json(event);
                })
                .catch((err) => {
                    res.status(400).send;
                });
        })
        .catch((err) => {
            res.status(400).send(err);
        });
});

module.exports = router;
