/**
 * ============================================================
 *  WHATSAPP SENDER
 *  Includes typing indicator and human-like reply delays.
 * ============================================================
 */

const axios = require("axios");

const WA_API_VERSION = "v19.0";
const WA_TOKEN = process.env.WHATSAPP_TOKEN;

// ── Human-like delay ───────────────────────────────────────
// Simulates reading + typing time based on message length

function getReplyDelay(replyText) {
  const words = replyText.split(" ").length;
  const minDelay = 1500;
  const typingDelay = words * 120; // ~120ms per word
  const jitter = Math.random() * 1000; // up to 1s random variation
  return Math.min(minDelay + typingDelay + jitter, 6000); // max 6s
}

// ── Send typing indicator ──────────────────────────────────

async function sendTyping(phoneNumberId, toPhone) {
  try {
    const url = `https://graph.facebook.com/${WA_API_VERSION}/${phoneNumberId}/messages`;
    await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to: toPhone,
        type: "reaction",
        reaction: { message_id: "", emoji: "⌨️" }
      },
      { headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" } }
    );
  } catch {
    // Typing indicator is best-effort — silently ignore if it fails
  }
}

// ── Send message ───────────────────────────────────────────

async function sendMessage(phoneNumberId, toPhone, text, addDelay = true) {
  if (addDelay) {
    const delay = getReplyDelay(text);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  const url = `https://graph.facebook.com/${WA_API_VERSION}/${phoneNumberId}/messages`;

  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to: toPhone,
      type: "text",
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${WA_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

module.exports = { sendMessage, sendTyping };
