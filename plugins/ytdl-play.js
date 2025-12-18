const { cmd } = require("../command");
const yts = require("yt-search");
const axios = require("axios");

const cache = new Map();

// --- Helper Functions ---
function normalizeYouTubeUrl(url) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/);
    return match ? `https://youtube.com/watch?v=${match[1]}` : null;
}

function getVideoId(url) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

async function fetchBaseData(url) {
    try {
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl, { timeout: 20000 });
        if (response.data && response.data.status) return response.data.result;
        return null;
    } catch (e) {
        return null;
    }
}

// --- MAIN COMMAND ---
cmd({
    pattern: "play",
    alias: ["yta", "dlsong", "ytmp4"],
    react: "🎬",
    desc: "Download video/audio from YouTube.",
    category: "ice Pakistan",
    filename: __filename,
},
async (robin, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("Kripya song ka naam ya link dein.");

        await robin.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const search = await yts(q);
        const data = search.videos[0];
        if (!data) return reply("❌ Result nahi mila.");

        let desc = `🎬 *KAMRAN-MD DOWNLOADER* 🎬\n\n` +
            `📌 *Title:* ${data.title}\n` +
            `⏱️ *Duration:* ${data.timestamp}\n` +
            `🔗 *Link:* ${data.url}\n\n` +
            `🔢 *Reply karein:* \n1 - Video (MP4) 🎥\n2 - Audio (MP3) 🎶\n\n` +
            `> © Powered by Kamran-MD`;

        const sentMsg = await robin.sendMessage(from, { image: { url: data.thumbnail }, caption: desc }, { quoted: mek });

        // --- SMART LISTENER ---
        const handler = async (update) => {
            const msg = update.messages[0];
            if (!msg.message || !msg.message.extendedTextMessage) return;
            
            const text = msg.message.extendedTextMessage.text.trim();
            const isReplyToBot = msg.message.extendedTextMessage.contextInfo.stanzaId === sentMsg.key.id;

            if (isReplyToBot && (text === "1" || text === "2")) {
                // Listener ko foran band karein taake memory leak na ho
                robin.ev.off("messages.upsert", handler);

                await robin.sendMessage(from, { react: { text: "⏳", key: msg.key } });
                const isAudio = text === "2";
                
                // API Fetching
                const apiData = await fetchBaseData(data.url);
                let downloadUrl = isAudio ? apiData?.mp3 : apiData?.mp4;

                if (!downloadUrl) {
                    // Fallback for Audio
                    if (isAudio) {
                        const audioRes = await axios.get(`https://jawad-tech.vercel.app/download/audio?url=${encodeURIComponent(data.url)}`).catch(() => null);
                        downloadUrl = audioRes?.data?.result;
                    }
                }

                if (!downloadUrl) return reply("❌ Link generate nahi ho saka. Dobara koshish karein.");

                await robin.sendMessage(from, {
                    [isAudio ? "audio" : "video"]: { url: downloadUrl },
                    mimetype: isAudio ? "audio/mpeg" : "video/mp4",
                    fileName: `${data.title}.${isAudio ? "mp3" : "mp4"}`,
                    ptt: false
                }, { quoted: msg });

                await robin.sendMessage(from, { react: { text: "✅", key: msg.key } });
            }
        };

        // Listener ko start karein
        robin.ev.on("messages.upsert", handler);

        // 2 minute baad listener khud band ho jaye agar user reply na kare
        setTimeout(() => {
            robin.ev.off("messages.upsert", handler);
        }, 120000);

    } catch (e) {
        reply(`⚠️ Error: ${e.message}`);
    }
});
  
