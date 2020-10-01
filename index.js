const Commando = require("discord.js-commando");
const Discord = require('discord.js')
const Database = require('better-sqlite3');
const db = new Database('star.db');
const bot = new Commando.Client({
    partials: ['MESSAGE', 'CHANNEL']
});

require('dotenv').config();

db.prepare('CREATE TABLE IF NOT EXISTS starids (msgid TEXT PRIMARY KEY, starid TEXT NOT NULL)').run();

bot.on("message", (message) => {
    if (message.channel.name === process.env.CHANNEL_NAME && message.author.id != process.env.BOT_ID) {
        message.delete(1000);
        // message.author.send("You are not " + process.env.BOT_NAME + ". You may not send messages in " + process.env.CHANNEL_NAME + ".");
    }

    // const thisWord = "java";
    // if(message.content.includes(thisWord))
    // {
    //     message.react('742671739301003334');
    // }
});


bot.on('messageReactionRemove', async (reaction, user) => {
    const message = reaction.message;

    let channel;
    try {
        channel = reaction.message.guild.channels.find(channel => channel.name === process.env.CHANNEL_NAME);
    } catch (e) {
        user.send(process.env.CHANNEL_NAME + " channel gibt es nicht. Bitte erstelle ein " + process.env.CHANNEL_NAME + " Channel.");
        return;
    }

    if (!channel) {
        user.send(process.env.CHANNEL_NAME + " channel gibt es nicht. Bitte erstelle ein " + process.env.CHANNEL_NAME + " Channel.");
        return;
    }

    if (reaction.emoji.name !== process.env.REACT_EMOTE) {
        return;
    }

    const starId = await getMessageFromDatabase(message.id);
    if (!starId) return;

    const stars = reaction.count;

    const starMessage = await channel.fetchMessages({around: starId, limit: 1})
        .then(msg => {
            const fetchedMsg = msg.first();
            return fetchedMsg;
        });

    if (!starMessage) return;

    if (stars == 0) {
        db.prepare('DELETE FROM starids WHERE msgid = ?').run(message.id);
        return await starMessage.delete();
    } else {
        const embed = new Discord.RichEmbed(starMessage.embeds[0])
            .setTitle(`${stars} ⭐`);

        await starMessage.edit(embed);
    }
});


bot.on('messageReactionAdd', async (reaction, user) => {
    const message = reaction.message;

    if (reaction.message.partial) {
        try {
            await reaction.message.fetch();
        } catch (error) {
            console.log('Fehler beim holen der Nachricht: ', error);
        }
    }

    if (message.author.id === user.id) {
        return message.channel.send(`${user}, du kannst deine eigene Beiträge nicht mit ⭐ versehen.`);
    }

    if (message.author.bot) {
        return message.channel.send(`${user}, Bot Nachrichten gehen nicht.`);
    }

    if (reaction.emoji.name === process.env.REACT_EMOTE) {
        let channel;
        try {
            channel = reaction.message.guild.channels.find(channel => channel.name === process.env.CHANNEL_NAME);
        } catch (e) {
            user.send(process.env.CHANNEL_NAME + " channel gibt es nicht. Bitte erstelle ein " + process.env.CHANNEL_NAME + " Channel.");
            return;
        }

        if (!channel) {
            user.send(process.env.CHANNEL_NAME + " channel gibt es nicht. Bitte erstelle ein " + process.env.CHANNEL_NAME + " Channel.");
            return;
        }

        if (message.content.length === 0 && message.attachments.length === 0 && (!message.embeds[0] || message.embeds[0].type !== 'image')) {
            return;
        }

        const starId = await getMessageFromDatabase(message.id);

        const stars = reaction.count;


        if (!starId) {
            const starMsg = await channel.send({
                embed: {
                    color: 0xFDD744,
                    author: {
                        name: reaction.message.author.username,
                        icon_url: reaction.message.author.avatarURL
                    },
                    title: `${stars} ⭐`,
                    description: message.content,
                    timestamp: reaction.message.createdAt,
                    image: resolveAttachment(message),
                    fields: [{
                        name: "Link zum Beitrag",
                        value: "https://ptb.discordapp.com/channels/" +
                            reaction.message.guild.id + "/" +
                            reaction.message.channel.id + "/" +
                            reaction.message.id
                    },
                        {
                            name: "Channel",
                            value: `<#${message.channel.id}>`
                        }
                    ],
                    footer: {
                        text: "Footer"
                    }
                }
            });
            db.prepare('INSERT INTO starids VALUES (?, ?)').run(message.id, starMsg.id);
        } else {
            const starMessage = await channel.getMessage(starId);
            if (!starMessage) return;
            await starMessage.edit(`${stars} ⭐ - <#${message.channel.id}>`);
        }
    }
});

function getMessageFromDatabase(msgid) {
    return (db.prepare('SELECT * FROM starids WHERE msgid = ?').get(msgid) || {}).starid;
}

function resolveAttachment(message) {
    if (message.attachments.length > 0 && message.attachments[0].width) {
        return message.attachments[0];
    } else if (message.embeds.length > 0 && message.embeds[0].type === 'image') {
        return message.embeds[0].image || message.embeds[0].thumbnail;
    } else {
        return null;
    }
}

bot.on("ready", () => {
    console.log("Bot geladen.");
});
bot.login(process.env.BOT_TOKEN);
