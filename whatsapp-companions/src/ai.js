/**
 * ============================================================
 *  AI REPLY GENERATOR
 *  Generates replies using Claude with persistent memory.
 * ============================================================
 */

const Anthropic = require("@anthropic-ai/sdk");
const { getHistory, addMessage } = require("./memory");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateReply(companion, userPhone, userMessage) {
  addMessage(companion.phoneNumberId, userPhone, "user", userMessage);

  const history = getHistory(companion.phoneNumberId, userPhone);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    system: companion.personality.trim(),
    messages: history,
  });

  const reply = response.content[0].text.trim();
  addMessage(companion.phoneNumberId, userPhone, "assistant", reply);

  return reply;
}

async function generateCheckin(companion, userPhone) {
  const history = getHistory(companion.phoneNumberId, userPhone);

  const checkinPrompt = history.length === 0
    ? `Send a warm, casual first message to introduce yourself as ${companion.name} and invite a chat. Keep it short and friendly.`
    : `Based on your recent conversation history, send a short friendly check-in message. 
       Reference something from the conversation if relevant. Keep it natural and brief — 
       like a friend just popping in to say hi.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 150,
    system: companion.personality.trim(),
    messages: [
      ...history,
      { role: "user", content: checkinPrompt }
    ],
  });

  return response.content[0].text.trim();
}

module.exports = { generateReply, generateCheckin };
