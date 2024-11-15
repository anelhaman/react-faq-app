// src/App.js
import React, { useState, useRef } from "react";
import axios from "axios";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false); // Track bot typing state
  const inputRef = useRef(null); // Reference to the input field


  const handleSend = async () => {
    if (!input.trim()) return;

    const question = { q: input };

    // Add the user's question to the chat
    const newMessages = [...messages, { sender: "user", text: input }];
    setMessages(newMessages);
    setInput("");

    try {
      // Send the question to the server
      const response = await axios.post("http://192.168.20.175/answer", question);
      const answer = response.data[0]?.answer || "No answer available";

      // Simulate typing effect for bot response
      await simulateTypingEffect(answer, newMessages);

    } catch (error) {
      // Handle server error
      setMessages([
        ...newMessages,
        { sender: "bot", text: "Failed to fetch the answer. Please try again." },
      ]);
    } finally {
      setIsTyping(false); // Bot stops "typing"
    }
    inputRef.current?.focus(); // Automatically focus back on the input field
  };

  const simulateTypingEffect = async (text, previousMessages) => {
    let currentText = "";
    const typingSpeed = 50; // Speed in ms per character

    for (let i = 0; i < text.length; i++) {
      currentText += text[i];

      // Update the bot's message progressively
      setMessages([...previousMessages, { sender: "bot", text: currentText }]);
      
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
                  : "bg-green-500 text-white"
              }`}
            >
              {formatText(message.text)}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="chat chat-start">
            <div className="chat-bubble bg-green-500 text-white">
              <p>Typing...</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex space-x-2">
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
