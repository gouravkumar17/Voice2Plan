const fs = require("fs");
const axios = require("axios");
const mongoose = require("mongoose");
const Transcript = require("../models/Note"); // Import the Mongoose model
require("dotenv").config();

const processAudio = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = req.file.path;
  const apiKey = process.env.GLADIA_API_KEY;

  try {
    // Send audio to Gladia API for transcription
    const formData = new FormData();
    formData.append("audio", fs.createReadStream(filePath));

    const response = await axios.post("https://api.gladia.io/v2/transcription", formData, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "multipart/form-data",
      },
    });

    const transcript = response.data.transcription;
    const keyPoints = transcript.split(". ").slice(0, 5);
    const topic = keyPoints[0] ? keyPoints[0].split(" ").slice(0, 3).join(" ") : "Untitled";

    // Store in MongoDB
    const newTranscript = new Transcript({ transcript, keyPoints, topic, date: new Date() });
    await newTranscript.save();

    // Process data with Gemini API
    const structuredData = await processWithGemini(transcript);

    res.json({
      transcript,
      keyPoints,
      topic,
      structuredData, // Send structured outputs (events, todo, summary)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Transcription failed" });
  } finally {
    fs.unlinkSync(filePath);
  }
};

// Function to process text with Gemini AI
const processWithGemini = async (text) => {
  try {
    const geminiResponse = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta2/models/gemini-pro:generateText",
      {
        prompt: `Extract key points, generate calendar events, create to-do items with deadlines, and summarize this meeting: ${text}`,
      },
      {
        headers: { "Content-Type": "application/json", "x-api-key": process.env.GEMINI_API_KEY },
      }
    );

    return geminiResponse.data;
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    return { error: "Failed to process with Gemini API" };
  }
};

module.exports = { processAudio };
