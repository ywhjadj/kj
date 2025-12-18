// ✅ Coded by DR KAMRAN for KAMRAN MD
// ⚙️ API: https://jawad-tech.vercel.app/download/ytdl?url=

const { cmd } = require('../command');
const yts = require('yt-search');
const axios = require('axios');

cmd({
    pattern: "video",
    alias: ["ytv", "vdl", "mp4"],
    desc: "Download YouTube videos directly to gallery",
    category: "download",
    react: "🎥",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎥 Please provide a YouTube video name or URL!");

        let url = q;
        let videoInfo = null;

        // 🔍 Search Logic
        if (q.startsWith('http')) {
            const videoIdMatch = q.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            const videoId = videoIdMatch ? videoIdMatch[1] : null;
            if (!videoId) return await reply("❌ Invalid YouTube URL!");
            videoInfo = await yts({ videoId });
        } else {
            const search = await yts(q);
            videoInfo = search.videos[0];
            if (!videoInfo) return await reply("❌ No results found!");
            url = videoInfo.url;
        }

        // 🖼️ Thumbnail & Loading Status
        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption: `*🎬 KAMRAN-MD VIDEO DOWNLOADER*\n\n🎞️ *Title:* ${videoInfo.title}\n🕒 *Duration:* ${videoInfo.timestamp}\n\n*Status:* Sending Video to Gallery... ⏳`
        }, { quoted: mek });

        // ⚙️ Fetch from API
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        const { data } = await axios.get(apiUrl);

        if (!data?.status || !data?.result?.mp4) {
            return await reply("❌ Download link nahi mil saka!");
        }

        // 📦 Send as Direct Video (NOT DOCUMENT)
        await conn.sendMessage(from, {
            video: { url: data.result.mp4 },
            mimetype: 'video/mp4',
            caption: `🎬 *${data.result.title}*\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error(e);
        reply("⚠️ Error: " + e.message);
    }
});
                
