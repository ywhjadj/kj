const config = require('../config');
const { cmd, commands } = require('../command');

const whatsappChannelLink = 'https://whatsapp.com/channel/0029VbAhxYY90x2vgwhXJV3O';

// Contact used for quoting the reply
const quotedContact = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "⚙️ Latency-Check | Verified ✅",
      vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:SCIFI\nORG:ᴋᴀᴍʀᴀɴ ᴍᴅ BOT;\nTEL;type=CELL;type=VOICE;waid=923195068309:+9239 506 309\nEND:VCARD"
    }
  }
};

cmd({
  pattern: "ping",
  alias: ["speede", "pong"],
  use: '.ping',
  desc: "Check bot's response time, load, and stability.",
  category: "main",
  react: "⚡",
  filename: __filename
}, async (conn, mek, m, { from, quoted, sender, reply }) => {
  try {
    const start = Date.now();

    const loadingMessages = [
      "*⎾⟪ ⚡ Initializing diagnostic scan... ⟫⏌*",
      "*⎾⟪ 🚀 Engaging latency protocol... ⟫⏌*",
      "*⎾⟪ 📊 Probing system integrity... ⟫⏌*",
      "*⎾⟪ ⚙️ Optimizing digital threads... ⟫⏌*",
      "*⎾⟪ 🧠 Booting quantum core... ⟫⏌*",
      "*⎾⟪ 💡 Gathering neural response... ⟫⏌*",
      "*⎾⟪ 📡 Syncing data flux... ⟫⏌*",
      "*⎾⟪ ✨ Running chrono-lag check... ⟫⏌*"
    ];

    const speedLatencyQuotes = [
      "“🔋 *Speed defines intelligence.*”",
      "“🛰️ *Latency is the language of performance.*”",
      "“👾 *Bots that blink are bots that win.*”",
      "“💡 *Digital flow never waits.*”",
      "“⏱️ *Milliseconds matter in the matrix.*”",
      "“⚡ *Optimized to outrun time.*”",
      "“🔧 *You ping, I race.*”",
      "“🛠️ *Diagnostics complete — all systems nominal.*”",
      "“🎯 *Real-time. Right now.*”"
    ];

    const statusEmojis = ['✅', '🟢', '✨', '📶', '🔋'];
    const stableEmojis = ['🟢', '✅', '🧠', '📶', '🛰️'];
    const moderateEmojis = ['🟡', '🌀', '⚠️', '🔁', '📡'];
    const slowEmojis = ['🔴', '🐌', '❗', '🚨', '💤'];

    const randomLoadingMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    const randomQuote = speedLatencyQuotes[Math.floor(Math.random() * speedLatencyQuotes.length)];

    await conn.sendMessage(from, { text: randomLoadingMessage });

    const end = Date.now();
    const latencyMs = end - start;

    let stabilityEmoji = '';
    let stabilityText = '';

    if (latencyMs > 1000) {
      stabilityText = "Slow 🔴";
      stabilityEmoji = slowEmojis[Math.floor(Math.random() * slowEmojis.length)];
    } else if (latencyMs > 500) {
      stabilityText = "Moderate 🟡";
      stabilityEmoji = moderateEmojis[Math.floor(Math.random() * moderateEmojis.length)];
    } else {
      stabilityText = "Stable 🟢";
      stabilityEmoji = stableEmojis[Math.floor(Math.random() * stableEmojis.length)];
    }

    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;

    let profilePicUrl;
    try {
      profilePicUrl = await conn.profilePictureUrl(sender, 'image');
    } catch {
      profilePicUrl = 'https://i.ibb.co/gdpjw5w/pp-wa-3.jpg';
    }

    const stylishText = `
*⎾===========================================⏌*
 *📡 SYSTEM DIAGNOSTICS — PULSE REPORT*
 ⌬━━━━━━━━━━━━━━━━━━━⌬
  ◉ Bot ID       » *${config.botname || "亗𝙆𝘼𝙈𝙍𝘼𝙉 𝙈𝘿ϟ"}*
  ◉ Response     » ${statusEmojis[Math.floor(Math.random() * statusEmojis.length)]} ${latencyMs} ms ⚡
  ◉ Load Memory  » ${statusEmojis[Math.floor(Math.random() * statusEmojis.length)]} *${memoryUsageMB.toFixed(2)} MB* 📦
  ◉ Stability    » ${stabilityEmoji} *${stabilityText}*
  ◉ Time Sync    » *${new Date().toLocaleTimeString()}*
 ⌬━━━━━━━━━━━━━━━━━━━⌬
 ➤ *${randomQuote}*
*⎿===========================================⏋*
    `.trim();

    await conn.sendMessage(from, {
      image: { url: profilePicUrl },
      caption: stylishText,
      contextInfo: {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363418144382782@newsletter',
          newsletterName: "ᴋᴀᴍʀᴀɴ ᴍᴅ",
          serverMessageId: 1580
        },
        externalAdReply: {
          title: "⚙️ ᴋᴀᴍʀᴀɴ ᴍᴅ | System Pulse",
          body: "Speed • Stability • Sync",
          thumbnailUrl: 'https://files.catbox.moe/ly6553.jpg',
          sourceUrl: whatsappChannelLink,
          mediaType: 1,
          renderLargerThumbnail: false,
        }
      }
    }, { quoted: quotedContact });

  } catch (e) {
    console.error("Error in ping command:", e);
    reply(`An error occurred: ${e.message}`);
  }
});
