const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const axios = require("axios");
require("dotenv").config();
const app = express(); // ✅ Define the Express app
app.use(express.json());
app.use(cors());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post("/api/process-text", async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: "No text provided" });

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [
                    { role: "user", parts: [{ text: `Extract key points from this text: "${text}"` }] }
                ]
            },
            {
                headers: { "Content-Type": "application/json" }
            }
        );

        // Extract key points from API response
        const extractedData = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!extractedData) {
            return res.status(500).json({ error: "Failed to extract key points" });
        }

        const keyPoints = extractedData.split("\n");
        res.json({ keyPoints });

    } catch (error) {
        console.error("❌ Gemini API Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to process text" });
    }
});


//const mongoose = require("mongoose");

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Import routes
const audioRoutes = require("./routes/audioRoutes");
app.use("/api", audioRoutes);


app.listen(5000, () => console.log("✅ Server running on port 5000"));
