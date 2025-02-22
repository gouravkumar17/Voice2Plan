const express = require("express");
const Note = require("../models/Note"); // Import Note model

const router = express.Router();

// ✅ Save Notes API
router.post("/save-note", async (req, res) => {
    try {
        const { keyPoints, topic } = req.body;
        if (!keyPoints || !topic) {
            return res.status(400).json({ error: "Missing keyPoints or topic" });
        }

        const newNote = new Note({ keyPoints, topic });
        await newNote.save();

        res.json({ message: "Note saved successfully!", note: newNote });
    } catch (error) {
        console.error("❌ Error saving note:", error);
        res.status(500).json({ error: "Failed to save note" });
    }
});

module.exports = router;
