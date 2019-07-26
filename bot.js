const {Client} = require("discord.js");
const fs = require("fs");
const path = require("path");

// -- Helper funcs
const print = console.log;
global.print = print;

const BotEnv = class {
	constructor (config, client) {
		print("Client initialized.");

		this.config = config;
		this.client = client;

		this.prepare().then(this.start.bind(this)).catch(console.error);
	}

	async prepare() {

	}

	async start() {
		await this.client.login(this.config.token);

		print("LOGIN COMPLETE");
	}
}

new BotEnv(require("./config.js"), new Client({
	disableEveryone: true
}));

// client.on("ready", () => {
// 	console.log(`Logged in as ${client.user.tag}!`);
// });

// client.on("message", msg => {
// 	// Our bot needs to know if it will execute a command
// 	// It will listen for messages that will start with `!`
// 	if (msg.content.substring(0, 1) == "!") {
// 		let args = msg.content.substring(1).split(" ");
// 		let cmd = args[0];

// 		args = args.splice(1);
// 		switch(cmd) {
// 			// !ping
// 			case "ping":
// 				msg.channel.send("pong");
// 				break;
// 			// Just add any case commands if you want to..
// 		 }
// 	 }
// });
