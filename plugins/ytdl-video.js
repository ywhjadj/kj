// ✅ Coded by DR KAMRAN for KAMRAN MD
// ⚙️ API: https://jawad-tech.vercel.app/download/ytdl?url=

const { cmd } = require('../command');
const yts = require('yt-search');
const axios = require('axios');

cmd({
    pattern: "video",
    alias: ["ytv", "vdl", "drama"], // Maine drama ko alias mein daal diya hai taake dono kaam karein
    desc: "Download YouTube videos directly to gallery",
    category: "download",
    react: "🎥",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎥 Please provide a YouTube video name or URL!");

        let url = q;
        let videoInfo = null;

        // 🔍 Detect URL or Search by Title
        if (q.startsWith('http://') || q.startsWith('https://')) {
            const videoIdMatch = q.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            const videoId = videoIdMatch ? videoIdMatch[1] : null;
            if (!videoId) return await reply("❌ Invalid YouTube URL!");
            const searchFromUrl = await yts({ videoId });
            videoInfo = searchFromUrl;
        } else {
            const search = await yts(q);
            videoInfo = search.videos[0];
            if (!videoInfo) return await reply("❌ No video results found!");
            url = videoInfo.url;
        }

        // 🖼️ Send thumbnail preview
        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption: `*🎬 VIDEO DOWNLOADER*\n\n🎞️ *Title:* ${videoInfo.title}\n📺 *Channel:* ${videoInfo.author.name}\n🕒 *Duration:* ${videoInfo.timestamp}\n\n*Status:* Downloading Video... ⏳\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`
        }, { quoted: mek });

        // ⚙️ Fetch from API
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        const { data } = await axios.get(apiUrl);

        if (!data?.status || !data?.result?.mp4) {
            return await reply("❌ Failed to fetch download link!");
        }

        const vid = data.result;

        // 📦 Send as VIDEO (Not Document)
        await conn.sendMessage(from, {
            video: { url: vid.mp4 },
            mimetype: 'video/mp4',
            caption: `🎬 *${vid.title}*\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`
        }, { quoted: mek });

        // ✅ React success
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("❌ Error:", e);
        await reply("⚠️ Something went wrong!");
    }
});
                
