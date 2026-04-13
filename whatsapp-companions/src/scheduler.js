/**
 * ============================================================
 *  DAILY CHECK-IN SCHEDULER
 *  Companions proactively message users once a day.
 *  Default time: 10:00 AM daily (configurable in .env)
 * ============================================================
 */

const cron = require("node-cron");
const { getAllStats } = require("./memory");
const { generateCheckin } = require("./ai");
const { sendMessage } = require("./whatsapp");

function startScheduler(companionMap) {
  const checkinTime = process.env.CHECKIN_TIME || "0 10 * * *"; // 10:00 AM daily

  console.log(`⏰ Daily check-ins scheduled at: ${process.env.CHECKIN_TIME || "10:00 AM"}`);

  cron.schedule(checkinTime, async () => {
    console.log("⏰ Running daily check-ins...");

    const stats = getAllStats();

    for (const stat of stats) {
      const companion = companionMap[stat.phone_id];
      if (!companion) continue;

      try {
        const message = await generateCheckin(companion, stat.user_phone);
        await sendMessage(companion.phoneNumberId, stat.user_phone, message, false);
        console.log(`✅ Check-in sent: [${companion.name}] → ${stat.user_phone}`);

        // Small gap between messages to avoid rate limits
        await new Promise(r => setTimeout(r, 1500));
      } catch (err) {
        console.error(`❌ Check-in failed for ${stat.user_phone}:`, err.message);
      }
    }
  });
}

module.exports = { startScheduler };
