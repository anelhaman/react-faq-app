import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import pako from "pako";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [isProgressing, setIsProgressing] = useState(false);
  const inputRef = useRef(null); 
  const [abortController, setAbortController] = useState(null);
  const messagesEndRef = useRef(null); // Reference for the end of the messages
  const [dots, setDots] = useState(""); // State for the loading dots

  const handleSend = async () => {
    if (!input.trim()) return;

    setDots(""); // Reset the dots when starting a new message

    const question = { q: input };
    const compressedData = pako.gzip(JSON.stringify(question));

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add the user's question to the chat
    const newMessages = [
      ...messages,
      { sender: "user", text: input, timestamp },
    ];
    setMessages(newMessages);
    setInput("");

    const startTime = Date.now(); // Capture the time before sending the request

    try {
      setWaitingForResponse(true);
      setIsProgressing(true);  // Start typing effect

      const response = await axios.post("http://localhost/answer", compressedData, {
        headers: {
          "Content-Type": "application/json",
          "Content-Encoding": "gzip",
        },
      });

      const endTime = Date.now(); // Capture the time after receiving the response
      const responseTime = endTime - startTime; // Calculate response time in ms
      const answer = response.data[0]?.answer || "No answer available";

      setWaitingForResponse(false);

      // Start simulating typing effect
      await simulateTypingEffect(answer, newMessages, responseTime);


    } catch (error) {
      setWaitingForResponse(false);
      setMessages([
        ...newMessages,
        {
          sender: "bot",
          text: "Failed to fetch the answer or no matching answers found. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          error: true, 
        },
      ]);
    } finally {
      setWaitingForResponse(false); // Show waiting for response animation
    }
    inputRef.current?.focus();
    setIsProgressing(false); // Stop typing effect
  };

  const simulateTypingEffect = async (text, previousMessages, responseTime) => {
  let currentText = "";
  const controller = new AbortController(); // Create an AbortController to handle the stop action
  setAbortController(controller); // Store it for future reference

  const typingSpeed = responseTime <= 20 ? 5 : text.length <= 250 ? 25 : 10;

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  for (let i = 0; i < text.length; i++) {
    if (controller.signal.aborted) return; // If the typing is aborted, stop

    currentText += text[i];

    // Update the bot's message progressively
    setMessages([
      ...previousMessages,
      { sender: "bot", text: currentText, timestamp, responseTime }, // Include response time
    ]);

    await new Promise((resolve) => setTimeout(resolve, typingSpeed));
  }

  setIsProgressing(false); // Finished typing

  // After typing is finished, update the last message with response time and timestamp
  setMessages((prevMessages) => {
    const updatedMessages = [...prevMessages];
    const lastMessage = updatedMessages[updatedMessages.length - 1];

    if (lastMessage && lastMessage.sender === "bot") {
      lastMessage.responseTime = responseTime;  // Store response time
      lastMessage.timestamp = timestamp;         // Store the new timestamp
    }
    return updatedMessages;
  });
};

  const stopTyping = () => {
    if (abortController) {
      abortController.abort(); // Abort the typing process
      setDots(""); // Clear the dots when stopped
    }
    setIsProgressing(false); // Stop typing effect
  };

  const formatText = (text) => {
    return text.split("\n").map((line, index) => (
      <p key={index} className="mb-1">
        {line}
      </p>
    ));
  };

  const formatResponseTime = (responseTime) => {
    if (responseTime >= 1000) {
      // Convert to seconds and show one decimal place
      return `${(responseTime / 1000).toFixed(1)}s`;
    }
    return `${responseTime}ms`;
  };

  useEffect(() => {
    if (isProgressing) {
      let dotCount = 0;
      const interval = setInterval(() => {
        setDots((prevDots) => prevDots + "."); // Add one dot at a time
        dotCount += 1;
        if (dotCount === 4) {
          clearInterval(interval); // Stop after 4 dots
        }
      }, 1000); // Wait 1 second before adding another dot

      // Clean up the interval when the component unmounts or isProgressing changes
      return () => clearInterval(interval);
    }
  }, [isProgressing]);

  const generateDotAnimation = () => {
    return (
      <div className="chat-bubble bg-gray-600 text-gray-500">
        <p className="text-s text-white block mt-1 animate-pulse">
          Loading
          {dots.split("").map((dot, index) => (
            <span key={index} className="animate-pulse">
              {dot}
            </span>
          ))}
        </p>
      </div>
    );
  };

    useEffect(() => {
    // Scroll to the bottom whenever messages are updated
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);  // Dependency on messages, so it runs whenever messages change


  return (
    <div className="min-h-screen flex flex-col p-4">
      <div className="fixed top-0 left-0 right-0 bg-gray-800 shadow-md py-3 flex justify-center items-center z-10">
        <h1 className="text-xl font-semibold">Frequency Asked Question</h1>
      </div>
      <div className="flex-grow overflow-auto mb-4 space-y-2 pb-40"> {/* Added padding-bottom */}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat ${
              message.sender === "user" ? "chat-end" : "chat-start"
            }`}
            style={index === 0 ? { marginTop: "60px" } : {}}
          >
            <div
              className={`chat-bubble ${
                message.sender === "user"
                  ? "bg-blue-600 text-white"
                  : message.error
                  ? "bg-gray-600 text-white" // Gray background for error
                  : "bg-grey-900 text-white" // Green background for bot response
              } } max-w-[70%]`}
            >

              {/* Show message text */}
              {formatText(message.text)} 

              {/* Show timestamp for user messages immediately */}
              {message.sender === "user" && (
                <div className="mt-1">
                  <small className="text-xs text-gray-300 block">{message.timestamp}</small>
                </div>
              )}

              {/* Always show the timestamp and response time for all messages except the last one */}
              {!isProgressing && message.sender === "bot" && index === messages.length - 1 && (
                <div className="mt-1">
                  <small className="text-xs text-gray-300 block">{message.timestamp}</small>
                  {message.responseTime && (
                    <small className="text-xs text-gray-300 block">
                      Response time: {formatResponseTime(message.responseTime)}
                    </small>
                  )}
                </div>
              )}

              {/* Show timestamp and response time immediately for all other messages */}
              {message.sender === "bot" && index !== messages.length - 1 && (
                <div className="mt-1">
                  <small className="text-xs text-gray-300 block">{message.timestamp}</small>
                  {message.responseTime && (
                    <small className="text-xs text-gray-300 block">
                      Response time: {formatResponseTime(message.responseTime)}
                    </small>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} /> {/* Scroll target */}
        {waitingForResponse && (
          <div className="chat chat-start">
            {generateDotAnimation()} {/* Show the loading dots */}
          </div>
        )}
      </div>
      <div className="flex space-x-2 flex-shrink-0 fixed bottom-0 left-0 right-0 z-10 p-4">
        <input
          ref={inputRef} 
          type="text"
          className="input input-bordered flex-grow"
          placeholder="Type your question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          className={`btn ${isProgressing ? 'btn-gray' : 'btn-primary'}`}
          onClick={isProgressing ? stopTyping : handleSend}  
          disabled={false}  // Always enable the button (even while typing)
        >
          {isProgressing ? (
            <>
              <span className="mr-1">ⓧ</span> Stop
            </>
          ) : (
            <>
              <span className="mr-1">↑</span> Send
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default App;
