const Discord = require('discord.js');
const auth = require('./auth.json');

// Initialize Discord Bot
const client = new Discord.Client();

client.on("ready", () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", msg => {
	// Our bot needs to know if it will execute a command
	// It will listen for messages that will start with `!`
	if (msg.content.substring(0, 1) == "!") {
		let args = msg.content.substring(1).split(" ");
		let cmd = args[0];

		args = args.splice(1);
		switch(cmd) {
			// !ping
			case "ping":
				msg.channel.send("pong");
				break;
			// Just add any case commands if you want to..
		 }
	 }
});

client.login(auth.token);
