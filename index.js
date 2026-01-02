const express = require("express");
const cors = require("cors");
require("dotenv").config();



const app = express()
const PORT = process.env.PORT || 3000;


///// MIDDLEWARE
app.use(cors())
app.use(express.json())

///// MEMORY
const SessionStore = {};
const WhitelistedUsers = new Set();


////// DISCORD BOT SETUP
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

const bot = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ] 
});



const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

const commands = [
    new SlashCommandBuilder()
        .setName('session')
        .setDescription('Create a new OFFLINE session')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('The code to create a session with')
                .setRequired(true)
        )
];

const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);


bot.on('ready', async () => {
    console.log(`Bot logged in as ${bot.user.tag}`);

    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationCommands(bot.user.id),
            { body: commands }
        );
        console.log('Slash commands registered!');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});


bot.on('interactionCreate', async interaction => {
     if (!interaction.isChatInputCommand()) return;

      if (!WhitelistedUsers.has(interaction.user.id)) {
        return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
      }

    if (interaction.commandName === 'session') {
        const code = interaction.options.getString('code');

        const sessionKey = `OFFLINE-${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

        SessionStore[sessionKey] = code;

        console.log(`Session made by ${interaction.user.tag}: ${sessionKey}`);

        await interaction.reply({ content: `Session created! Your session key is:\n\`${sessionKey}\`\nUse this key to retrieve your code later.`, ephemeral: true });


    }

});




////// LOGIN
bot.login(DISCORD_BOT_TOKEN);

///// TEST END-POINT
app.get('/', (req, res) => {
    res.json({message: "Server is running!"});
});


///// CREATE SESSION -- I guess
app.post("/api/session/create", (req, res) => {
    const { code } = req.body;

    const sessionKey = `OFFLINE-${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    SessionStore[sessionKey] = code;

    console.log(`Session made: ${sessionKey}`)

    res.json({
        success: true,
        sessionKey: sessionKey
    });
});



///// USE SESSION
app.get("/api/session/use/:sessionKey", (req, res) => {
    const { sessionKey } = req.params;

    if(!SessionStore[sessionKey]) {
        return res.status(404).json({
            success: false,
            error: "No Session found, sadly. Was it already used?"
        })
    }

    const code = SessionStore[sessionKey];

    delete SessionStore[sessionKey];

    console.log(`Session used: ${sessionKey}`);

    res.json({
        success: true,
        code: code
    });
});




////////////// START \\\\\\\\\\\\\\\\\
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});