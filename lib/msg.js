const config = require('../config');
const { proto, downloadContentFromMessage, getContentType } = require(config.BAILEYS)
const fs = require('fs')

// Media download logic ko simplify aur fix kiya gaya hai
const downloadMediaMessage = async(m, filename) => {
    try {
        let msg = m.msg || m
        // Type nikalne ka sahi tareeqa
        let type = getContentType(msg) || (msg.mtype ? msg.mtype : null)
        
        if (!type && m.message) {
            type = getContentType(m.message)
            msg = m.message[type]
        }

        // ViewOnce Support
        if (type === 'viewOnceMessageV2' || type === 'viewOnceMessageV3' || type === 'viewOnceMessage') {
            msg = msg.message[getContentType(msg.message)]
            type = getContentType(msg)
        }

        const stream = await downloadContentFromMessage(msg, type.replace('Message', ''))
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        
        if (filename) {
            let ext = type === 'imageMessage' ? '.jpg' : type === 'videoMessage' ? '.mp4' : type === 'audioMessage' ? '.mp3' : '.bin'
            fs.writeFileSync(filename + ext, buffer)
            return buffer
        }
        return buffer
    } catch (e) {
        console.error("Download Error Log:", e)
        return null
    }
}

const sms = (conn, m, store) => {
    if (!m) return m
    let M = proto.WebMessageInfo
    if (m.key) {
        m.id = m.key.id
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = conn.decodeJid(m.fromMe && conn.user.id || m.participant || m.key.participant || m.chat || '')
    }

    if (m.message) {
        m.mtype = getContentType(m.message)
        // Check karein ke message direct hai ya ViewOnce
        m.msg = (m.mtype === 'viewOnceMessageV2' || m.mtype === 'viewOnceMessageV3' || m.mtype === 'viewOnceMessage') 
                ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] 
                : m.message[m.mtype]

        // Agar m.msg ab bhi empty hai (naye Baileys ki wajah se), to direct access karein
        if (!m.msg) m.msg = m.message[m.mtype]

        try {
            m.body = m.message.conversation || (m.msg && m.msg.caption) || (m.msg && m.msg.text) || (m.mtype == 'extendedTextMessage' && m.msg && m.msg.text) || '';
        } catch { m.body = false }

        let quoted = (m.quoted = m.msg && m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null);
        if (m.quoted) {
            let type = getContentType(quoted)
            m.quoted = m.quoted[type]
            if (typeof m.quoted === 'string') m.quoted = { text: m.quoted }
            m.quoted.mtype = type
            m.quoted.id = m.msg.contextInfo.stanzaId
            m.quoted.sender = conn.decodeJid(m.msg.contextInfo.participant)
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || ''
            // Quoted media download fix
            m.quoted.download = () => downloadMediaMessage(m.quoted)
        }
    }
    
    // Commands ke liye zaroori helpers
    m.reply = async (content) => {
        return await conn.sendMessage(m.chat, { text: content }, { quoted: m });
    }
    
    m.react = (emoji) => conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } })

    if (m.msg && m.msg.url) m.download = () => downloadMediaMessage(m)

    return m
}

module.exports = { sms, downloadMediaMessage }
			
