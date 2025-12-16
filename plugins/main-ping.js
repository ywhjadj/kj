const config = require('../config');
const { cmd, commands } = require('../command');

// Note: Assuming 'runtime' is a utility function available in your project 
// (e.g., in './lib/functions') that formats seconds into a readable time string.)

cmd({
    pattern: "ping",
    alias: ["speed2", "pong", "latency"],
    desc: "Check bot's API latency and system status.",
    category: "main",
    react: "🚀", 
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    // --- Newsletter JID to inject (as requested by the user) ---
    const NEWSLETTER_JID = '120363418144382782@newsletter';
    const NEWSLETTER_NAME = 'KAMRAN-MD'; 

    try {
        // --- 1. API Latency Measurement ---
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const startTime = Date.now();
        // Send a temporary message to measure API response time
        const tempMessage = await conn.sendMessage(from, { text: '⚡' }); 
        
        const endTime = Date.now();
        const apiLatency = endTime - startTime;
        
        // --- 2. Get Bot Uptime ---
        // 'runtime' function converts process.uptime() (seconds) into readable format
        const runTime = runtime(process.uptime()); 

        // --- 3. Delete the temporary message for a clean chat
        await conn.sendMessage(from, { delete: tempMessage.key });

        // --- 4. Stylish Status Template ---
        const statusMessage = `
*╭─────────────────────*
*┃ 🚀 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃 𝐒𝐓𝐀𝐓𝐔𝐒*
*╰─────────────────────*
*┃ ⚡ API Response Time:* _${apiLatency} ms_
*┃ ⏱️ Bot Uptime:* _${runTime}_
*┃ 🌐 Platform:* _Node.js/Baileys_
*╰─────────────────────*
*✨ Status: Fully Operational*
`;
        
        // --- 5. Send the final status message with Newsletter forwarding context ---
        await conn.sendMessage(from, { 
            text: statusMessage,
            contextInfo: {
                // Mention the sender
                mentionedJid: [m.sender],
                // Set forwarding metadata for Newsletter effect
                forwardingScore: 999, // High score to ensure forwarded label is shown
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: 120363418144382782@newsletter,
                    newsletterName: KAMRAN-MD,
                    serverMessageId: 143 // Dummy ID
                }
            }
        }, { quoted: mek }); // Quote the original command message

        // Add a final reaction to the original command message
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error("Ping command failed:", e);
        reply(`⚠️ An error occurred while checking speed: ${e.message}`);
    }
});
