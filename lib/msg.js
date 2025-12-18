const config = require('../config');
const { proto, downloadContentFromMessage, getContentType } = require(config.BAILEYS)
const fs = require('fs')

// Download function ko stable kiya gaya hai
const downloadMediaMessage = async(m, filename) => {
    let msg = m.msg || m
    let type = getContentType(msg) || m.mtype
    
    // ViewOnce handle karne ke liye
    if (m.type === 'viewOnceMessage' || m.type === 'viewOnceMessageV2') {
        msg = m.msg.message[getContentType(m.msg.message)]
    }

    try {
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
            m.body = (m.mtype === 'conversation') ? m.message.conversation : 
                     (m.mtype == 'imageMessage') ? m.message.imageMessage.caption : 
                     (m.mtype == 'videoMessage') ? m.message.videoMessage.caption : 
                     (m.mtype == 'extendedTextMessage') ? m.message.extendedTextMessage.text : 
                     (m.mtype == 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : 
                     (m.mtype == 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : 
                     (m.mtype == 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : '';
        } catch { m.body = false }

        let quoted = (m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null);
        if (m.quoted) {
            let type = getContentType(quoted)
            m.quoted = m.quoted[type]
            if (typeof m.quoted === 'string') m.quoted = { text: m.quoted }
            m.quoted.mtype = type
            m.quoted.id = m.msg.contextInfo.stanzaId
            m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat
            m.quoted.sender = conn.decodeJid(m.msg.contextInfo.participant)
            m.quoted.fromMe = m.quoted.sender === (conn.user && conn.user.id)
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || ''
            m.quoted.download = () => conn.downloadMediaMessage(m.quoted)
        }
    }
    
    m.text = m.msg.text || m.msg.caption || m.message.conversation || ''
    
    // Saare puraane functions (Reply, React etc) wapis add kar diye hain
    m.reply = async (content) => {
        return await conn.sendMessage(m.chat, { text: content }, { quoted: m });
    }
    
    m.react = (emoji) => conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } })
    
    m.senddoc = (doc, type, id = m.chat, option = {}) => conn.sendMessage(id, { 
        document: doc, 
        mimetype: type, 
        fileName: option.filename || 'file.pdf' 
    }, { quoted: m })

    return m
}

module.exports = { sms, downloadMediaMessage }
		
