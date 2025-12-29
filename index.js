const express = require("express");
const cors = require("cors");
require("dotenv").config();



const app = express()
const PORT = process.env.PORT || 3000;

///// MIDDLEWARE
app.use(cors())
app.use(express.json())

///// MEMORY
const SessionStore = {};


///// TEST END-POINT
app.get('/', (req, res) => {
    res.json({message: "Server is running!"});
});


///// CREATE SESSION -- I guess
app.post("/api/session/create", (req, res) => {
    const { code } = req.body;

    const sessionKey = `OFFLINE-${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    SessionStore[sessionKey] = code;

    console.log(`Session made: ${sessionKey}`)

    res.json({
        success: true,
        sessionKey: sessionKey
    });
});



///// USE SESSION
app.get("/api/session/use/:sessionKey", (req, res) => {
    const { sessionKey } = req.params;

    if(!SessionStore[sessionKey]) {
        return res.status(404).json({
            success: false,
            error: "No Session found, sadly. Was it already used?"
        })
    }

    const code = SessionStore[sessionKey];

    delete SessionStore[sessionKey];

    console.log(`Session used: ${sessionKey}`);

    res.json({
        success: true,
        code: code
    });
});




////////////// START \\\\\\\\\\\\\\\\\
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});