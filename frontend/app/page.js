"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE = "http://localhost:8000";

export default function Home() {
  const [activeTab, setActiveTab] = useState("search");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  // --- SEARCH ---
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchError("");
    setSearchResults([]);

    try {
      const res = await fetch(`${API_BASE}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: searchQuery.trim(), top_k: 5 }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      setSearchError(err.message || "Failed to connect to the backend.");
    } finally {
      setSearchLoading(false);
    }
  };

  // --- CHAT ---
  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatError("");

    const newMessages = [...chatMessages, { role: "user", content: userMessage }];
    setChatMessages(newMessages);
    setChatLoading(true);

    // Build history for the API (only previous messages, not the current one)
    const history = chatMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setChatMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources || [],
        },
      ]);
    } catch (err) {
      setChatError(err.message || "Failed to connect to the backend.");
    } finally {
      setChatLoading(false);
    }
  };

  // --- RELEVANCE HELPERS ---
  const getRelevanceLevel = (score) => {
    if (score <= 0.8) return "high";
    if (score <= 1.3) return "medium";
    return "low";
  };

  const getRelevanceLabel = (score) => {
    const level = getRelevanceLevel(score);
    if (level === "high") return "High Match";
    if (level === "medium") return "Good Match";
    return "Partial Match";
  };

  // --- FORMAT TEXT ---


  return (
    <div className="app-container">
      {/* HERO */}
      <header className="hero">
        <div className="hero-badge">💊 AI-Powered</div>
        <h1>PharmaGPT</h1>
        <p>
          Search medicines by symptoms & get AI-powered pharmaceutical guidance.
        </p>
      </header>

      {/* TABS */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "search" ? "active" : ""}`}
          onClick={() => setActiveTab("search")}
        >
          🔍 Symptom Search
        </button>
        <button
          className={`tab-btn ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          💬 Chat with PharmaGPT
        </button>
      </div>

      {/* ============= SEARCH TAB ============= */}
      {activeTab === "search" && (
        <div className="search-panel">
          <form className="search-box" onSubmit={handleSearch}>
            <input
              className="search-input"
              type="text"
              placeholder="Describe your symptoms or condition, e.g. 'headache and fever'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              className="btn-primary"
              type="submit"
              disabled={searchLoading || !searchQuery.trim()}
            >
              {searchLoading ? "Searching..." : "Search"}
            </button>
          </form>

          {searchError && <div className="error-msg">⚠ {searchError}</div>}

          {searchResults.length > 0 && (
            <div className="results-grid">
              {searchResults.map((med, idx) => (
                <div className="medicine-card" key={idx}>
                  <div className="card-header">
                    <h3>{med.name}</h3>
                    <span
                      className={`relevance-badge relevance-${getRelevanceLevel(
                        med.relevance_score
                      )}`}
                    >
                      {getRelevanceLabel(med.relevance_score)}
                    </span>
                  </div>

                  <div className="card-section">
                    <div className="card-label">Benefits</div>
                    <div className="card-text">{med.benefits}</div>
                  </div>

                  <div className="card-section">
                    <div className="card-label">Side Effects</div>
                    <div className="card-text">{med.side_effects}</div>
                  </div>

                  <div className="card-section">
                    <div className="card-label">Safety Advice</div>
                    <div className="card-text">{med.safety_advice}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!searchLoading && searchResults.length === 0 && !searchError && (
            <div className="empty-state">
              <div className="empty-icon">🔎</div>
              <h3>Search for Medicines</h3>
              <p>Enter symptoms or conditions to find matching medicines.</p>
            </div>
          )}
        </div>
      )}

      {/* ============= CHAT TAB ============= */}
      {activeTab === "chat" && (
        <div className="chat-panel">
          <div className="chat-window">
            {chatMessages.length === 0 && !chatLoading && (
              <div className="empty-state">
                <div className="empty-icon">🩺</div>
                <h3>Start a Conversation</h3>
                <p>Ask PharmaGPT about medicines, dosages, or interactions.</p>
              </div>
            )}

            {chatMessages.map((msg, idx) => (
              <div className={`message ${msg.role}`} key={idx}>
                <div className="message-label">
                  {msg.role === "user" ? "You" : "PharmaGPT"}
                </div>
                <div className="message-bubble">
                  {msg.role === "user" ? (
                    <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                  ) : (
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="sources-section">
                      <div className="sources-title">Sources</div>
                      {msg.sources.map((src, sIdx) => (
                        <span className="source-tag" key={sIdx}>
                          {src.name || `Source ${sIdx + 1}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="loading-indicator">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                PharmaGPT is thinking...
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {chatError && <div className="error-msg">⚠ {chatError}</div>}

          <form className="chat-input-area" onSubmit={handleChat}>
            <input
              className="chat-input"
              type="text"
              placeholder="Ask about a medicine, side effect, or interaction..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button
              className="btn-primary"
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
            >
              {chatLoading ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      )}

      {/* DISCLAIMER */}
      <div className="disclaimer">
        <strong>⚠ Disclaimer:</strong> This application is for educational and
        informational purposes only. It is not a substitute for professional
        medical advice. Always consult a qualified healthcare provider.
      </div>
    </div>
  );
}
