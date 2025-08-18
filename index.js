//JUNE//
//Terrivez
//supremeLord


require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const { 
    default: makeWASocket,
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
const pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics')
const { rmSync, existsSync } = require('fs')
const { join } = require('path')

// Create a store object with required methods
const store = {
    messages: {},
    contacts: {},
    chats: {},
    groupMetadata: async (jid) => {
        return {}
    },
    bind: function(ev) {
        // Handle events
        ev.on('messages.upsert', ({ messages }) => {
            messages.forEach(msg => {
                if (msg.key && msg.key.remoteJid) {
                    this.messages[msg.key.remoteJid] = this.messages[msg.key.remoteJid] || {}
                    this.messages[msg.key.remoteJid][msg.key.id] = msg
                }
            })
        })
        
        ev.on('contacts.update', (contacts) => {
            contacts.forEach(contact => {
                if (contact.id) {
                    this.contacts[contact.id] = contact
                }
            })
        })
        
        ev.on('chats.set', (chats) => {
            this.chats = chats
        })
    },
    loadMessage: async (jid, id) => {
        return this.messages[jid]?.[id] || null
    }
}

let phoneNumber = "94741035694"
let owner = JSON.parse(fs.readFileSync('./data/owner.json'))

global.botname = "♡ 𝐒𝐮𝐧𝐧𝐲 𝐓𝐞𝐜𝐡 𝐁𝐫𝐨 ♡"
global.themeemoji = "•"
global.statusview = true

const settings = require('./settings')
const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    } else {
        
        return Promise.resolve(settings.ownerNumber || phoneNumber)
    }
}

async function startconn() {
    let { version, isLatest } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState(`./session`)
    const msgRetryCounterCache = new NodeCache()

    const conn = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !pairingCode,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid)
            let msg = await store.loadMessage(jid, key.id)
            return msg?.message || ""
        },
        msgRetryCounterCache,
        defaultQueryTimeoutMs: undefined,
    })

    store.bind(conn.ev)

    conn.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                await handleStatus(conn, chatUpdate);
                return;
            }
            if (!conn.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
            
            try {
                await handleMessages(conn, chatUpdate, true)
            } catch (err) {
                console.error("පණිවිඩ අවලංගු කිරීමේ දෝෂය:", err)
                if (mek.key && mek.key.remoteJid) {
                    await conn.sendMessage(mek.key.remoteJid, { 
                        text: '❌ ඔබගෙ පණිවිඩය ක්‍රියා කිරීමට නොහැක.',
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: false,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '@newsler',
                                newsletterName: '♡ 𝐒𝐮𝐧𝐧𝐲 𝐓𝐞𝐜𝐡 𝐁𝐫𝐨 ♡',
                                serverMessageId: -1
                            }
                        }
                    }).catch(console.error);
                }
            }
        } catch (err) {
            console.error("Error in messages.upsert:", err)
        }
    })

    conn.ev.on('messages.upsert', async chatUpdate => {
        if (global.statusview){
            try {
                if (!chatUpdate.messages || chatUpdate.messages.length === 0) return;
                const mek = chatUpdate.messages[0];

                if (!mek.message) return;
                mek.message =
                    Object.keys(mek.message)[0] === 'ephemeralMessage'
                        ? mek.message.ephemeralMessage.message
                        : mek.message;

                if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                    let emoji = [ "💙","❤️","💓","⭐","👍","😘","🤍","🖤" ];
                    let sigma = emoji[Math.floor(Math.random() * emoji.length)];
                    await conn.readMessages([mek.key]);
                    conn.sendMessage(
                        'status@broadcast',
                        { react: { text: sigma, key: mek.key } },
                        { statusJidList: [mek.key.participant] },
                    );
                }
            } catch (err) {
                console.error(err);
            }
        }
    });

    conn.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    conn.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = conn.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    conn.getName = (jid, withoutContact = false) => {
        id = conn.decodeJid(jid)
        withoutContact = conn.withoutContact || withoutContact 
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = conn.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === conn.decodeJid(conn.user.id) ?
            conn.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    conn.public = true

    conn.serializeM = (m) => smsg(conn, m, store)

    if (pairingCode && !conn.authState.creds.registered) {
        if (useMobile) throw new Error('pair කේත භාවිතා කරන්න බැහැ ඔබගේ දුරකථන api තුල')

        let phoneNumber
        if (!!global.phoneNumber) {
            phoneNumber = global.phoneNumber
        } else {
            phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`කරුණාකර ඔබගේ දුරකථන අංකය ඇතුලත් කරන්න 😍\nFormat: 94726800969 ( + ලකුණ සහ හිස්තැන් නොතබන්න) : `)))
        }

        phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

        const pn = require('awesome-phonenumber');
        if (!pn('+' + phoneNumber).isValid()) {
            console.log(chalk.red('වැරදි දුරකතන අංකයකි. කරුණාකර නිවැරදි අංකය ඇතුලත් කරන්න (උදා., 94726800969 ශ්‍රීලංකාව තුල, 94726800969 ශ්‍රීලංකාව තුල.) + ලකුණ සහ හිස්තැන් නොතබන්න.'));
            process.exit(1);
        }

        setTimeout(async () => {
            try {
                let code = await conn.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(chalk.black(chalk.bgGreen(`ඔබගේ Pairing කේතය: `)), chalk.black(chalk.white(code)))
                console.log(chalk.yellow(`\nකරුණාකර මෙම කේතය WhatsApp app හි link කරගන්න:\n1. WhatsApp open කරගන්න\n2. Settings වලට යන්න> Linked Devices ඔබන්න\n3. "Link a Device"ඔබන්න\n4. කේතය ඇතුලත් කරන්න`))
            } catch (error) {
                console.error('pair කේතය ඉල්ලීම අසාර්ථකයි:', error)
                console.log(chalk.red('කේතය ඉල්ලීම අසාර්ථකයි. කරුණාකර දුරකථන අංකය නිවැරදිදැයි බලා නැවත උත්සහ කරන්න.'))
            }
        }, 3000)
    }

    
    conn.ev.on('connection.update', async (s) => {        
        const { connection, lastDisconnect } = s
        if (connection == "open") {
            await conn.groupAcceptInvite('HsPNX1fC2UY5mGSIyGr8m6');
            console.log(chalk.magenta(` `))
            console.log(chalk.yellow(`සම්බන්ධ උනි => ` + JSON.stringify(conn.user, null, 2)))
            
            const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';
            await conn.sendMessage(botNumber, { 
                text: 
                `
╭━━━〔 *♡ 𝐒𝐮𝐧𝐧𝐲 𝐓𝐞𝐜𝐡 𝐁𝐫𝐨 ♡* 〕━━━┈⊷
┃★╭──────────────
┃★│ 𝑶𝑾𝑵𝑬𝑹 : *SUNNY TECH BRO*
┃★│ 𝑩𝑨𝑰𝑳𝑬𝒀𝑺 : *Single Device*
┃★│ 𝑻𝒀𝑷𝑬 : *NodeJs*
┃★│ 𝑷𝑳𝑨𝑻𝑭𝑶𝑹𝑴 : *Heroku*
┃★│ 𝑴𝑶𝑫𝑬 : *[private]*
┃★│ 𝑷𝑹𝑰𝑭𝑰𝑿 : *[.]*
┃★│ 𝑽𝑬𝑹𝑺𝑰𝑶𝑵 : *v 1.0.0*
┃★╰──────────────
╰━━┏❐═⭔ *♡ සාර්ථකයි යකෝ 😅🔥✅ ♡* ⭔═❐
┃⭔ *බොට්:* ♡ 𝐒𝐮𝐧𝐧𝐲 𝐓𝐞𝐜𝐡 𝐁𝐫𝐨 ♡
┃⭔ *වෙලාව:* ${new Date().toLocaleString()}
┃⭔ *Status:* Online
┃⭔ *පරිශීලකයා:* ${botNumber}
┗❐═⭔════════⭔═❐`,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: false,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '@newsler',
                        newsletterName: '♡ 𝐒𝐮𝐧𝐧𝐲 𝐓𝐞𝐜𝐡 𝐁𝐫𝐨 ♡',
                        serverMessageId: -1
                    }
                }
            });

            await delay(1999)
            console.log(chalk.yellow(`\n\n    ${chalk.bold.blue(`[ ${global.botname || 'NIMA-V5'} ]`)}\n\n`))
            console.log(chalk.cyan(`< ================================================== >`))
            console.log(chalk.magenta(`\n${global.themeemoji || '•'} YT CHANNEL: SUPRMELORD`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} GITHUB: nimanew303`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} WA NUMBER: ${owner}`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} CREDIT: ♡ 𝐒𝐮𝐧𝐧𝐲 𝐓𝐞𝐜𝐡 𝐁𝐫𝐨 ♡`))
            console.log(chalk.green(`${global.themeemoji || '•'} 🤖 ♡ 𝐒𝐮𝐧𝐧𝐲 𝐓𝐞𝐜𝐡 𝐁𝐫𝐨 ♡ සාර්ථකව සම්බන්ධ උනි ✅`))
            console.log(chalk.cyan(`< ================================================== >`))
        }
        if (
            connection === "close" &&
            lastDisconnect &&
            lastDisconnect.error &&
            lastDisconnect.error.output.statusCode != 401
        ) {
            startconn()
        }
    })

    conn.ev.on('creds.update', saveCreds)

    conn.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantUpdate(conn, update);
    });

    conn.ev.on('messages.upsert', async (m) => {
        if (m.messages[0].key && m.messages[0].key.remoteJid === 'status@broadcast') {
            await handleStatus(conn, m);
        }
    });

    conn.ev.on('status.update', async (status) => {
        await handleStatus(conn, status);
    });

    conn.ev.on('messages.reaction', async (status) => {
        await handleStatus(conn, status);
    });
    
    conn.sendText = (jid, text, quoted = '', options) => conn.sendMessage(jid, {
        text: text,
        ...options
    }, {
        quoted,
        ...options
    });
    
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            let mek = chatUpdate.messages[0];
            if (!mek.message) return;
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
            if (mek.key && mek.key.remoteJid === 'status@broadcast') return;
            let m = smsg(conn, mek, store);
            require("./case.js")(conn, m, chatUpdate, store);
        } catch (err) {
            console.log(err);
        }
    });
    
    return conn;
}

startconn().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err)
})

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})
