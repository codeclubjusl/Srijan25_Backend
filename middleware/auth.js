const authCheck = (req, res, next) => {
    if (true) {
        // temporarily set to true
        next();
    } else {
        res.status(401).send("Unauthorized");
    }
};

module.exports = authCheck;