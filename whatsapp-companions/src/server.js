/**
 * ============================================================
 *  WHATSAPP AI COMPANIONS v2 — MAIN SERVER
 *  Improvements: persistent memory, typing delays,
 *                daily check-ins, web dashboard
 * ============================================================
 */

require("dotenv").config();
const express = require("express");
const companions = require("../companions.config");
const { generateReply } = require("./ai");
const { sendMessage } = require("./whatsapp");
const { startScheduler } = require("./scheduler");
const dashboard = require("./dashboard");

const app = express();
app.use(express.json());
app.use(dashboard);

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

// Build companion lookup map
const companionMap = {};
for (const c of companions) {
  companionMap[c.phoneNumberId] = c;
  console.log(`✅  Companion "${c.name}" ready on number ID: ${c.phoneNumberId}`);
}

// ── Webhook verification ───────────────────────────────────
app.get("/webhook", (req, res) => {
  const mode      = req.query["hub.mode"];
  const token     = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified ✔");
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ── Incoming messages ──────────────────────────────────────
app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // Always acknowledge immediately

  try {
    const entry   = req.body?.entry?.[0];
    const change  = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];

    if (!message || message.type !== "text") return;

    const phoneNumberId = change.metadata.phone_number_id;
    const userPhone     = message.from;
    const userText      = message.text.body;

    const companion = companionMap[phoneNumberId];
    if (!companion) {
      console.warn(`No companion found for phone_number_id: ${phoneNumberId}`);
      return;
    }

    console.log(`💬 [${companion.name}] ← ${userPhone}: ${userText}`);

    // Generate reply (typing delay happens inside sendMessage)
    const reply = await generateReply(companion, userPhone, userText);
    await sendMessage(phoneNumberId, userPhone, reply);

    console.log(`💬 [${companion.name}] → ${userPhone}: ${reply}`);
  } catch (err) {
    console.error("Error handling message:", err.message);
  }
});

// ── Health check ───────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("WhatsApp AI Companions v2 are running 🤖 — visit /dashboard");
});

// ── Start server ───────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`   Webhook:   http://localhost:${PORT}/webhook`);
  console.log(`   Dashboard: http://localhost:${PORT}/dashboard\n`);

  // Start daily check-in scheduler
  if (process.env.ENABLE_CHECKINS === "true") {
    startScheduler(companionMap);
  } else {
    console.log("ℹ️  Daily check-ins disabled. Set ENABLE_CHECKINS=true in .env to enable.");
  }
});
