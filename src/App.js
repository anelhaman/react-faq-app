// src/App.js
import React, { useState, useRef } from "react";
import axios from "axios";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false); // Track bot typing state
  const [waitingForResponse, setWaitingForResponse] = useState(false); // Track waiting state
  const inputRef = useRef(null); // Reference to the input field


  const handleSend = async () => {
    if (!input.trim()) return;

    const question = { q: input };
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add the user's question to the chat
    const newMessages = [
      ...messages,
      { sender: "user", text: input, timestamp },
    ];
    setMessages(newMessages);
    setInput("");

    try {

      setWaitingForResponse(true); // Show waiting for response animation

      // Send the question to the server
      const response = await axios.post("http://localhost/answer", question);
      const answer = response.data[0]?.answer || "No answer available";

      setWaitingForResponse(false);

      // Simulate typing effect for bot response
      await simulateTypingEffect(answer, newMessages);

    } catch (error) {
      setWaitingForResponse(false);
      // Handle server error
      setMessages([
        ...newMessages,
        {
          sender: "bot",
          text: "Failed to fetch the answer or no matching answers found. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          error: true,  // Flag for error messages
        },
      ]);
    } finally {
      setIsTyping(false); // Bot stops "typing"
      setWaitingForResponse(false); // Show waiting for response animation
    }
    inputRef.current?.focus(); // Automatically focus back on the input field
  };

  const simulateTypingEffect = async (text, previousMessages) => {
    let currentText = "";
    const typingSpeed = 25; // Speed in ms per character

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    for (let i = 0; i < text.length; i++) {
      currentText += text[i];

      // Update the bot's message progressively
      setMessages([
        ...previousMessages,
        { sender: "bot", text: currentText, timestamp },
      ]);
      
      await new Promise((resolve) => setTimeout(resolve, typingSpeed));
    }
  };

  const formatText = (text) => {
    return text.split("\n").map((line, index) => (
      <p key={index} className="mb-1">
        {line}
      </p>
    ));
  };

  const generateDotAnimation = () => {
    return (
      <div className="chat-bubble bg-gray-200 text-gray-500">
        <p className="text-2xl">
          Loading
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} className="animate-pulse">.</span>
          ))}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 p-4">
      <div className="flex-grow overflow-auto mb-4 space-y-2">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat ${
              message.sender === "user" ? "chat-end" : "chat-start"
            }`}
          >
            <div
              className={`chat-bubble ${
                message.sender === "user"
                  ? "bg-blue-500 text-white"
                  : message.error
                  ? "bg-gray-400 text-white" // Gray background for error
                  : "bg-green-500 text-white"
              }`}
            >
              {formatText(message.text)}
              <small className="text-xs text-gray-500 block mt-1">
                {message.timestamp}
              </small>
            </div>
          </div>
        ))}
        {waitingForResponse && (
          <div className="chat chat-start">
            {generateDotAnimation()} {/* Show the loading dots */}
          </div>
        )}
        {isTyping && (
          <div className="chat chat-start">
            <div className="chat-bubble bg-green-500 text-white">
              <p>Typing...</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex space-x-2 flex-shrink-0">
        <input
          ref={inputRef} // Attach the reference to the input field
          type="text"
          className="input input-bordered flex-grow"
          placeholder="Type your question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button className="btn btn-primary" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
