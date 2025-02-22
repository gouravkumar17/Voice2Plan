import React, { useState, useRef } from "react";
import { FaMicrophone, FaStop, FaSave} from "react-icons/fa";
import axios from "axios";
import "./App.css";

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [keyPoints, setKeyPoints] = useState([]);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState(JSON.parse(localStorage.getItem("notes")) || []);
  const [structuredData] = useState(null); // Store structured output

  const recognitionRef = useRef(null);

  // Start / Stop Speech Recognition
  const handleRecording = () => {
    if (!isRecording) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        const transcriptText = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join(" ");
        setTranscript(transcriptText);
      };

      recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
      };

      recognition.start();
      setIsRecording(true);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);

      // ✅ Send transcript to backend for key point extraction
      processTranscript(transcript);
    }
  };

  // Process Transcript with Backend API
  const processTranscript = async (text) => {
    if (!text) {
      alert("No speech detected! Try speaking again.");
      return;
    }
    console.log(text);
    try {
      const response = await axios.post("https://voice-convertor-backend-1.onrender.com/api/process-text", { text });

      console.log("🔹 Processed Data:", response.data); // Debugging

      setKeyPoints(response.data.keyPoints);
      setTopic(response.data.topic);
    } catch (error) {
      console.error("❌ Error processing transcript:", error);
      alert("Failed to extract key points!");
    }
  };

  
  // Save Notes to Local Storage
  const saveNotes = async () => {
    if (!keyPoints || keyPoints.length === 0) {
      alert("No key points to save!");
      return;
    }

    try {
      const newNote = {
        keyPoints,
        topic: topic || "Meeting Notes",
        date: new Date().toLocaleString(),
      };

      // Update state
      const updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);

      // Save to local storage
      localStorage.setItem("notes", JSON.stringify(updatedNotes));

      // Send to backend (optional)
      const response = await fetch("http://localhost:5000/api/save-note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newNote),
      });

      const data = await response.json();
      if (response.ok) {
        alert("✅ Notes saved successfully!");
      } else {
        alert("❌ Failed to save notes: " + data.error);
      }
    } catch (error) {
      console.error("❌ Error saving notes:", error);
      alert("❌ Error saving notes");
    }
  };

  return (
    <div className="container">
      <h1 className="title">Smart Voice Assistant</h1>
      <p className="status">{isRecording ? "Listening..." : "Ready"}</p>

      {/* Recording Button */}
      <div className="card">
        <button className="record-btn" onClick={handleRecording}>
          {isRecording ? <FaStop className="icon" /> : <FaMicrophone className="icon" />}
          {isRecording ? " Stop Recording" : " Start Recording"}
        </button>
      </div>

      {/* Transcript */}
      <div className="card">
        <h2 className="subtitle">Transcript</h2>
        <div className="transcript-box">{transcript || "Start speaking or upload an audio file..."}</div>
      </div>

      {/* Key Points */}
      <div className="card">
        <h2 className="subtitle">Key Points</h2>
        <ul>{keyPoints.map((point, index) => <li key={index}>{point}</li>)}</ul>
        <button className="save-btn" onClick={saveNotes}>
          <FaSave className="icon" /> Save Notes
        </button>
      </div>

      {/* Structured Data from Gemini */}
      {structuredData && (
        <div className="card">
          <h2 className="subtitle">Structured Meeting Data</h2>
          <h3>📅 Calendar Events:</h3>
          <p>{structuredData.events || "No events found."}</p>
          <h3>✅ To-Do Items:</h3>
          <p>{structuredData.todo || "No tasks found."}</p>
          <h3>📝 Meeting Summary:</h3>
          <p>{structuredData.summary || "No summary available."}</p>
        </div>
      )}

      {/* Saved Notes */}
      <div className="card">
  <h2 className="subtitle">Saved Notes</h2>
  {notes.length === 0 ? (
    <p>No notes saved.</p>
  ) : (
    notes.map((note, index) => (
      <div key={index} className="note">
        <strong> {note.topic}</strong>
        <ul>{note.keyPoints.map((point, i) => <li key={i}>{point}</li>)}</ul>
      </div>
    ))
  )}
</div>
    </div>
  );
};

export default App;
