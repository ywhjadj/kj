const axios = require("axios");
const { cmd, commands } = require("../command");
// Note: Is code ke liye, hum maan rahe hain ki aapke bot environment mein 
// Node.js ke liye 'FormData' aur 'Blob' constructors available hain (jaise ki Node 18+ mein).

// --- API Configuration ---
const API_UPLOAD_URL = "https://aivocalremover.com/api/v2/FileUpload";
const API_PROCESS_URL = "https://aivocalremover.com/api/v2/ProcessFile";
// User ke code se liya gaya API key:
const API_KEY = "X9QXlU9PaCqGWpnP1Q4IzgXoKinMsKvMuMn3RYXnKHFqju8VfScRmLnIGQsJBnbZFdcKyzeCDOcnJ3StBmtT9nDEXJn"; 

cmd({
    pattern: "vocalremover",
    alias: ["aivocal"],
    react: "🎶",
    desc: "Separates vocals and instrumental tracks from an audio file.",
    category: "tools",
    filename: __filename,
},
async (conn, m, store, { from, quoted, reply, usedPrefix, command }) => {
    try {
        // 1. Check for quoted audio message
        const audioBufferPromise = m.quoted.download ? m.quoted.download() : conn.downloadMediaMessage(m.quoted);

        if (!m.quoted || !/audio/.test(m.quoted.mimetype || "")) {
            return reply(`*Example: reply to an audio with the command ${usedPrefix + command}*`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
        
        // Download the audio buffer
        const buffer = await audioBufferPromise;

        if (!buffer || buffer.length === 0) {
            throw new Error("Gagal mengunduh audio buffer.");
        }

        // 2. Prepare FormData for file upload
        const form = new FormData();
        // Append the buffer as a Blob/File
        form.append("fileName", new Blob([buffer], { type: 'audio/mpeg' }), "audio.mp3");

        // 3. Upload the file to the API
        const uploadResponse = await axios.post(API_UPLOAD_URL, form, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
                ...form.getHeaders() // Axios/form-data handles multipart boundary
            }
        });

        const upload = uploadResponse.data;

        if (!upload?.file_name) {
            console.error("Upload API Response:", upload);
            throw new Error("Upload audio failed or API response was invalid.");
        }

        // 4. Process the file
        const body = new URLSearchParams({
            file_name: upload.file_name,
            action: "watermark_video",
            key: API_KEY,
            web: "web"
        });

        const processResponse = await axios.post(API_PROCESS_URL, body.toString(), {
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
                "Content-Type": "application/x-www-form-urlencoded",
                "Origin": "https://aivocalremover.com",
                "Referer": "https://aivocalremover.com/"
            }
        });

        const process = processResponse.data;

        if (!process?.instrumental_path || !process?.vocal_path) {
            console.error("Process API Response:", process);
            throw new Error("Proses pemisahan audio gagal ya API response galat hai.");
        }

        // 5. Send Instrumental Track
        await conn.sendMessage(
            from,
            {
                audio: { url: process.instrumental_path },
                mimetype: "audio/mpeg",
                ptt: false, 
                fileName: "instrumental.mp3",
                caption: "*🎶 Instrumental Track*"
            },
            { quoted: m }
        );

        // 6. Send Vocal Track
        await conn.sendMessage(
            from,
            {
                audio: { url: process.vocal_path },
                mimetype: "audio/mpeg",
                ptt: false, 
                fileName: "vocal.mp3",
                caption: "*🎤 Vocal Track*"
            },
            { quoted: m }
        );

        await reply(`*✅ Berhasil memisahkan audio!* 🎶✨\n\n*• Instrumental*\n*• Vocal*`);

    } catch (e) {
        // Remove the loading reaction and reply with error
        await conn.sendMessage(from, { react: { text: "", key: m.key } });
        console.error("❌ Error in vocalremover command:", e.message, e.stack);
        reply(`*Gagal memproses audio* 🍂\n\nError: ${e.message}`);
    }
});
