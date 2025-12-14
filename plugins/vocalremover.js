const axios = require("axios");
const { cmd, commands } = require("../command");
// Node.js environments mein files aur multipart data ke liye 'form-data' library zaroori hai.
// Hum maan rahe hain ki yeh globally available hai ya aapke environment mein sahi tarah se handle ho raha hai.

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
        // 1. Check for quoted audio message and download the buffer
        if (!m.quoted || !/audio/.test(m.quoted.mimetype || "")) {
            return reply(`*Example: reply to an audio with the command ${usedPrefix + command}*`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
        
        // Download the audio buffer
        const buffer = await conn.downloadMediaMessage(m.quoted);

        if (!buffer || buffer.length === 0) {
            throw new Error("Gagal mengunduh audio buffer.");
        }

        // 2. Prepare FormData for file upload
        // We rely on a global FormData constructor (or a Node polyfill)
        const form = new FormData();
        
        // --- CRITICAL FIX: Appending Buffer directly with filename ---
        // This is the most reliable way to send file data with axios in Node.js.
        form.append("fileName", buffer, {
            filename: "audio.mp3",
            contentType: "audio/mpeg"
        });

        // 3. Upload the file to the API
        const uploadResponse = await axios.post(API_UPLOAD_URL, form, {
            // Note: We are letting axios automatically handle the 'Content-Type: multipart/form-data' header and boundary.
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
                // form.getHeaders() ko hata diya gaya taaki conflict na ho.
            }
        });

        const upload = uploadResponse.data;

        if (!upload?.file_name) {
            console.error("Upload API Response (Failed):", JSON.stringify(upload, null, 2));
            throw new Error("Upload audio failed. Check console for API response details.");
        }

        // 4. Process the file (using URLSearchParams which is reliable)
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
            console.error("Process API Response (Failed):", JSON.stringify(process, null, 2));
            throw new Error("Proses pemisahan audio gagal. Check console for API response details.");
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
        
        let errorMessage = "Gagal memproses audio 🍂. ";
        if (e.response && e.response.status) {
            errorMessage += `API Error Status: ${e.response.status}.`;
            console.error("API Error Response Data:", e.response.data);
        } else {
             errorMessage += `General Error: ${e.message}.`;
        }
        
        console.error("❌ Error in vocalremover command:", e);
        reply(errorMessage);
    }
});
