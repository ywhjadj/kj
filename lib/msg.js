const config = require('../config');
const { proto, downloadContentFromMessage, getContentType } = require(config.BAILEYS)
const fs = require('fs')

// ✅ Optimized Media Downloader
const downloadMediaMessage = async(m, filename) => {
    try {
        let msg = m.msg || m
        let type = m.type || getContentType(m.message)
        
        // Handling ViewOnce messages (Latest Fix)
        if (type === 'viewOnceMessage' || type === 'viewOnceMessageV2' || type === 'viewOnceMessageV3') {
            msg = msg.message[getContentType(msg.message)]
            type = getContentType(m.message[type].message)
        }

        const typeMap = {
            'imageMessage': 'image',
            'videoMessage': 'video',
            'audioMessage': 'audio',
            'stickerMessage': 'sticker',
            'documentMessage': 'document'
        }

        const downloadType = typeMap[type] || type.replace('Message', '')
        const stream = await downloadContentFromMessage(msg, downloadType)
        
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        if (filename) {
            const ext = type === 'documentMessage' ? msg.fileName.split('.').pop() : (downloadType === 'audio' ? 'mp3' : downloadType === 'image' ? 'jpg' : 'mp4')
            const name = `${filename}.${ext}`
            fs.writeFileSync(name, buffer)
            return buffer
        }
        return buffer
    } catch (e) {
        console.error("Download Error:", e)
        return null
    }
}

const sms = (conn, m, store) => {
    if (!m) return m
    let M = proto.WebMessageInfo
    if (m.key) {
        m.id = m.key.id
        m.isBot = m.id.startsWith('BAES') && m.id.length === 16
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = conn.decodeJid(m.fromMe && conn.user.id || m.participant || m.key.participant || m.chat || '')
    }
    if (m.message) {
        m.mtype = getContentType(m.message)
        m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype])
        
        try {
            m.body = m.message.conversation || m.msg.caption || m.msg.text || (m.mtype == 'extendedTextMessage' && m.msg.text) || ''
        } catch {
            m.body = false
        }

        let quoted = (m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null);
        m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
       
        if (m.quoted) {
            let type = getContentType(quoted)
            m.quoted = m.quoted[type]
            if (['productMessage'].includes(type)) {
                type = getContentType(m.quoted)
                m.quoted = m.quoted[type]
            }
            if (typeof m.quoted === 'string') m.quoted = { text: m.quoted }
            
            m.quoted.mtype = type
            m.quoted.id = m.msg.contextInfo.stanzaId
            m.quoted.sender = conn.decodeJid(m.msg.contextInfo.participant)
            m.quoted.fromMe = m.quoted.sender === (conn.user && conn.user.id)
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || ''
            
            // ✅ Fix for Quoted Download
            m.quoted.download = () => conn.downloadMediaMessage(m.quoted)
        }
    }
    
    if (m.msg && m.msg.url) m.download = () => conn.downloadMediaMessage(m.msg)
    
    // ✅ All Utility Functions (Reply, React, SendDoc)
    m.reply = (text) => conn.sendMessage(m.chat, { text }, { quoted: m })
    m.react = (emoji) => conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } })
    
    m.senddoc = (doc, type, filename) => conn.sendMessage(m.chat, { 
        document: doc, 
        mimetype: type, 
        fileName: filename 
    }, { quoted: m })

    return m
}

module.exports = { sms, downloadMediaMessage }
			
