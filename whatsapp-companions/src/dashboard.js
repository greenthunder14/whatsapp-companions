/**
 * ============================================================
 *  WEB DASHBOARD
 *  Visit http://localhost:3000/dashboard to view stats.
 * ============================================================
 */

const express = require("express");
const router = express.Router();
const {
  getAllStats, getTotalMessages,
  getTotalUsers, getRecentActivity
} = require("./memory");

router.get("/dashboard", (req, res) => {
  const stats = getAllStats();
  const totalMessages = getTotalMessages();
  const totalUsers = getTotalUsers();
  const recent = getRecentActivity(15);

  // Simple password protection
  const dashPassword = process.env.DASHBOARD_PASSWORD;
  if (dashPassword) {
    const auth = req.headers["authorization"];
    const expected = "Basic " + Buffer.from("admin:" + dashPassword).toString("base64");
    if (auth !== expected) {
      res.set("WWW-Authenticate", 'Basic realm="Dashboard"');
      return res.status(401).send("Unauthorized");
    }
  }

  const companionColors = {
    PHONE_NUMBER_ID_1:  "#7C6FCD",
    PHONE_NUMBER_ID_2:  "#E8593C",
    PHONE_NUMBER_ID_3:  "#E87C3E",
    PHONE_NUMBER_ID_4:  "#2196F3",
    PHONE_NUMBER_ID_5:  "#4CAF50",
    PHONE_NUMBER_ID_6:  "#9C27B0",
    PHONE_NUMBER_ID_7:  "#F44336",
    PHONE_NUMBER_ID_8:  "#009688",
    PHONE_NUMBER_ID_9:  "#FF9800",
    PHONE_NUMBER_ID_10: "#607D8B",
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp AI Companions — Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f5f5; color: #333; }
    header { background: #075E54; color: white; padding: 20px 32px; display: flex; align-items: center; gap: 12px; }
    header h1 { font-size: 20px; font-weight: 600; }
    header span { font-size: 13px; opacity: 0.75; margin-left: auto; }
    .container { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .card .label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .card .value { font-size: 36px; font-weight: 700; color: #075E54; }
    .card .sub { font-size: 12px; color: #aaa; margin-top: 4px; }
    .section { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); margin-bottom: 24px; }
    .section h2 { font-size: 15px; font-weight: 600; margin-bottom: 16px; color: #444; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px 12px; color: #888; font-weight: 500; border-bottom: 1px solid #eee; font-size: 11px; text-transform: uppercase; }
    td { padding: 10px 12px; border-bottom: 1px solid #f5f5f5; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; color: white; }
    .msg-user { color: #075E54; font-weight: 500; }
    .msg-assistant { color: #555; }
    .role-tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
    .role-user { background: #e8f5e9; color: #2e7d32; }
    .role-assistant { background: #e3f2fd; color: #1565c0; }
    .empty { color: #bbb; font-size: 13px; text-align: center; padding: 24px; }
    .refresh { font-size: 12px; color: #888; }
    .online-dot { width: 8px; height: 8px; background: #4CAF50; border-radius: 50%; display: inline-block; margin-right: 6px; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  </style>
</head>
<body>
  <header>
    <span>🤖</span>
    <h1>WhatsApp AI Companions</h1>
    <span><span class="online-dot"></span>Live Dashboard · ${new Date().toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })} MYT</span>
  </header>

  <div class="container">

    <!-- Summary Cards -->
    <div class="cards">
      <div class="card">
        <div class="label">Total Messages</div>
        <div class="value">${totalMessages.toLocaleString()}</div>
        <div class="sub">Across all companions</div>
      </div>
      <div class="card">
        <div class="label">Total Users</div>
        <div class="value">${totalUsers.toLocaleString()}</div>
        <div class="sub">Unique chatters</div>
      </div>
      <div class="card">
        <div class="label">Active Companions</div>
        <div class="value">${Object.keys(companionColors).length}</div>
        <div class="sub">Online now</div>
      </div>
      <div class="card">
        <div class="label">Conversations</div>
        <div class="value">${stats.length}</div>
        <div class="sub">Active threads</div>
      </div>
    </div>

    <!-- Conversation Stats -->
    <div class="section">
      <h2>💬 Conversations</h2>
      ${stats.length === 0
        ? `<div class="empty">No conversations yet. Start chatting!</div>`
        : `<table>
          <thead>
            <tr>
              <th>Companion</th>
              <th>User</th>
              <th>Messages</th>
              <th>Last Active</th>
            </tr>
          </thead>
          <tbody>
            ${stats.map(s => `
              <tr>
                <td><span class="badge" style="background:${companionColors[s.phone_id] || '#888'}">${s.phone_id.replace("PHONE_NUMBER_ID_", "#")}</span></td>
                <td>${s.user_phone.replace(/(\d{4})(\d+)(\d{4})/, "$1****$3")}</td>
                <td>${s.message_count}</td>
                <td>${new Date(s.last_message).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>`
      }
    </div>

    <!-- Recent Activity -->
    <div class="section">
      <h2>🕐 Recent Activity</h2>
      ${recent.length === 0
        ? `<div class="empty">No activity yet.</div>`
        : `<table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Message</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            ${recent.map(m => `
              <tr>
                <td><span class="role-tag role-${m.role}">${m.role}</span></td>
                <td class="msg-${m.role}">${m.content.length > 80 ? m.content.slice(0, 80) + "…" : m.content}</td>
                <td style="color:#aaa;font-size:12px">${new Date(m.created_at).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>`
      }
    </div>

  </div>

  <script>
    // Auto-refresh every 30 seconds
    setTimeout(() => location.reload(), 30000);
  </script>
</body>
</html>`;

  res.send(html);
});

module.exports = router;
