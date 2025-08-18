const fs = require('fs');
const path = require('path');

// List of emojis for command reactions
const commandEmojis = ['☠️'];

// Path for storing auto-reaction state
const USER_GROUP_DATA = path.join(__dirname, '../data/userGroupData.json');

// Load auto-reaction state from file
function loadAutoReactionState() {
    try {
        if (fs.existsSync(USER_GROUP_DATA)) {
            const data = JSON.parse(fs.readFileSync(USER_GROUP_DATA));
            return data.autoReaction || false;
        }
    } catch (error) {
        console.error('ස්වයංක්‍රීය ප්‍රතික්‍රියා තත්ත්වය පූරණය කිරීමේදී දෝෂයකි:', error);
    }
    return false;
}

// Save auto-reaction state to file
function saveAutoReactionState(state) {
    try {
        const data = fs.existsSync(USER_GROUP_DATA) 
            ? JSON.parse(fs.readFileSync(USER_GROUP_DATA))
            : { groups: [], chatbot: {} };
        
        data.autoReaction = state;
        fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('ස්වයං ප්‍රතික්‍රියා තත්ත්වය සුරැකීමේ දෝෂයකි:', error);
    }
}

// Store auto-reaction state
let isAutoReactionEnabled = loadAutoReactionState();

function getRandomEmoji() {
    return commandEmojis[0];
}

// Function to add reaction to a command message
async function addCommandReaction(sock, message) {
    try {
        if (!isAutoReactionEnabled || !message?.key?.id) return;
        
        const emoji = getRandomEmoji();
        await sock.sendMessage(message.key.remoteJid, {
            react: {
                text: emoji,
                key: message.key
            }
        });
    } catch (error) {
        console.error('විධාන ප්‍රතික්‍රියාව එක් කිරීමේ දෝෂයකි:', error);
    }
}

// Function to handle areact command
async function handleAreactCommand(sock, chatId, message, isOwner) {
    try {
        if (!isOwner) {
            await sock.sendMessage(chatId, { 
                text: '❌ එක විධානය ♡ 𝐒𝐮𝐧𝐧𝐲 𝐓𝐞𝐜𝐡 𝐁𝐫𝐨 ♡ට පමණක් සීමා ඌවකි!',
                quoted: message
            });
            return;
        }

        const args = message.message?.conversation?.split(' ') || [];
        const action = args[1]?.toLowerCase();

        if (action === 'on') {
            isAutoReactionEnabled = true;
            saveAutoReactionState(true);
            await sock.sendMessage(chatId, { 
                text: '✅ Auto-reacti දැන් සක්‍රීයයි',
                quoted: message
            });
        } else if (action === 'off') {
            isAutoReactionEnabled = false;
            saveAutoReactionState(false);
            await sock.sendMessage(chatId, { 
                text: '✅ Auto-react දැන් අක්‍රීයයි',
                quoted: message
            });
        } else {
            const currentState = isAutoReactionEnabled ? 'සක්‍රීය' : 'අක්‍රීය';
            await sock.sendMessage(chatId, { 
                text: `Auto-react දැන් ${currentState} .\n\nභාවිතා කරන්න:\n.areact on - සක්‍රීයයි auto-reactions\n.areact off - auto-react අක්‍රීයයි`,
                quoted: message
            });
        }
    } catch (error) {
        console.error('ප්‍රතික්‍රියා විධානය හැසිරවීමේ දෝෂයකි:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ ප්‍රතික්‍රියා විධානය හැසිරවීමේ දෝෂයකි',
            quoted: message
        });
    }
}

module.exports = {
    addCommandReaction,
    handleAreactCommand
}; 
