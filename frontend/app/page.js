"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

const API_BASE = "http://localhost:8000";

export default function Home() {
  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

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

  // --- FORMAT TEXT ---

  // Replace bare image URLs (jpg/png/gif/svg/webp) with markdown image syntax so
  // ReactMarkdown will render them as images instead of showing the raw URL.
  const imageUrlRegex = /(https?:\/\/[\w\-./?=&%+#~:,@!]+?\.(?:png|jpe?g|gif|svg|webp))(?=\s|$)/gi;

  const convertImageUrlsToMarkdown = (text) => {
    if (!text) return "";
    try {
      return text.replace(imageUrlRegex, (m, p1) => `![](${p1})`);
    } catch (e) {
      return text;
    }
  };

  // Remove metadata-like tokens that sometimes appear in the raw text and shouldn't
  // be shown to the user. Examples: "found/established", "imageAltText...",
  // "imageUrl...", "imageCaption ..." and stray class attributes.
  const sanitizeText = (text) => {
    if (!text) return "";
    let t = text;

    // Remove exact token
    t = t.replace(/\bfound\/established\b/gi, "");

    // Remove key/value style fragments like: imageAltTextAlcohol, imageUrlhttps//..., imageCaption H3 class=xSmallRegular
    // Match imageAltText followed by non-space/non-comma characters
    t = t.replace(/imageAltText[^,\n\s]*/gi, "");
    // Match imageUrl followed by anything until a comma/newline/space
    t = t.replace(/imageUrl[^,\n\s]*/gi, "");
    // Match imageCaption and then text until a comma or newline
    t = t.replace(/imageCaption[^,\n]*/gi, "");
    // Remove class=... fragments
    t = t.replace(/class=["']?[^\s,\n"']+["']?/gi, "");

    // Remove leftover separators like multiple commas or stray slashes
    t = t.replace(/[\/,]{2,}/g, ",");
    t = t.replace(/(^[\s,]+|[\s,]+$)/g, "");

    // Collapse repeated whitespace
    // Collapse repeated horizontal whitespace (keeping newlines for markdown)
    t = t.replace(/[ \t]{2,}/g, " ").trim();

    // After cleaning, convert image URLs to markdown (this will only affect well-formed URLs)
    return convertImageUrlsToMarkdown(t);
  };


  return (
    <div className="app-container">
      {/* HERO */}
      <header className="hero">
        <div className="hero-badge">💊 AI-Powered</div>
        <h1>PharmaGPT</h1>
        <p>
          Ask questions about medicines, dosages, and interactions.
        </p>
      </header>

      {/* ============= CHAT INTERFACE ============= */}
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
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                      {sanitizeText(msg.content || "")}
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

      {/* DISCLAIMER */}
      <div className="disclaimer">
        <strong>⚠ Disclaimer:</strong> This application is for educational and
        informational purposes only. It is not a substitute for professional
        medical advice. Always consult a qualified healthcare provider.
      </div>
    </div>
  );
}
