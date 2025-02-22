const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  keyPoints: [String], // Store key points as an array
  topic: String, // Topic of the notes
  date: { type: Date, default: Date.now } // Timestamp
});

module.exports = mongoose.model("Note", noteSchema);
