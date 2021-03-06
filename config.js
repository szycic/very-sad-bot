require('dotenv').config();
const fs = require('fs');
const http = require('http');
const Discord = require('discord.js');
const client = new Discord.Client({
  intents: ['DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS', 'GUILDS', 'GUILD_INVITES', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_VOICE_STATES'],
  partials: ['CHANNEL'],
});
client.commands = new Discord.Collection();

module.exports = {
  client: client,

  getCommandFiles: function (dir) {
    fs.readdir(dir, (e, files) => {
      if (e) return console.error(e);
      files.forEach((file) => {
        if (file.endsWith('.js')) {
          const reqCommand = require(`${dir}${file}`);
          client.commands.set(reqCommand.name, reqCommand);
          console.log(`Imported command: ${dir}${file}`);
        } else {
          this.getCommandFiles(`${dir}${file}/`);
        }
      });
    });
  },

  startStatusTracker: function () {
    http
      .createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'ok',
            message: `${client.user.tag} is online`,
          }),
        );
      })
      .listen(process.env.TRACKER_PORT ? process.env.TRACKER_PORT : 8080);
    console.log(`Status tracker was started successfully at port ${process.env.TRACKER_PORT ? process.env.TRACKER_PORT : 8080}!`);
  },

  guildsJSON: function () {
    let guilds;
    
    if (!fs.existsSync('./guilds.json')) guilds = { guilds: [] };
    else guilds = JSON.parse(fs.readFileSync('./guilds.json'));

    for (guild of guilds.guilds) {
      if ([...client.guilds.cache.filter((x) => x.id == guild.id)].length != 0) continue;
      guilds.guilds = guilds.guilds.filter((x) => x.id != guild.id);
    }

    client.guilds.cache.forEach((guild) => {
      if (guilds.guilds.filter((x) => x.id == guild.id).length != 0) return;
      guilds.guilds.push({ id: guild.id, name: guild.name, debug: 'no' });
    });

    fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
    console.log('guilds.json file has been updated successfully!');
  },
};
