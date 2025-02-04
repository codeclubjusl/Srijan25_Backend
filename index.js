const express = require("express");
const authCheck = require("./middleware/auth");

const app = express();

app.use(authCheck);

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
