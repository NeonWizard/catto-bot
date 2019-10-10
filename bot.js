const {Client} = require("discord.js");
const fs = require("fs");
const path = require("path");

// -- Helper funcs
const print = console.log;
global.print = print;
const wait = time => new Promise(resolve => setTimeout(resolve, time));

const BotEnv = class {
	constructor (config, client) {
		print("Client initializing...");

		this.config = config;
		this.client = client;

		this.plugins = new Map();
		this.events = new Map();
		this.registeredEvents = new Map();
		this.events.attach = this.attachEvent.bind(this);

		this.prepare().then(this.start.bind(this)).catch(console.error);
	}

	async prepare() {
		if (this.config.development) {
			print("Bot started in development mode, preparing in 3 seconds...");
			await wait(3000);
		}

		await this.preparePlugins();
		await this.readyPlugins();

		// After plugins are ready, any events that should have been attached will have been attached once you run the plugin (readyPlugins())
		await this.readyEvents();
	}

	async start() {
		await this.client.login(this.config.token);

		print("LOGIN COMPLETE :: Emitting 'post-ready'...");
		this.client.emit("post-ready");
	}

	static async requirePlugin(rawPluginName) {
		const pluginName = rawPluginName.replace(/(\.js)/i, '');
		const pluginPath = path.resolve("./plugins", pluginName);
		try {
			const rawPlugin = require(pluginPath);
			if (rawPlugin && typeof rawPlugin === "function") {
				print(`Found and loaded plugin [plugins/${rawPluginName}]`);
				return rawPlugin;
			}
		} catch (err) {
			throw err;
		}
		throw "Plugin returns an invalid type. Make sure it returns a regular function.";
	}

	async loadSinglePlugin(fileName) {
		const match = fileName.match(/(\.js)/i);
		const toLoad = (match && match[0]) ? fileName : `${fileName}/index.js`;
		try {
			const cleanPluginName = fileName.replace(/(\.js)/i, '');
			this.plugins.set(cleanPluginName, await BotEnv.requirePlugin(toLoad));
		} catch (err) {
			console.error(err, `Failed to load [${toLoad}] (Find the error above)`);
		}
	}
	async preparePlugins() {
		print("Preparing plugins...");
		let foundPlugins = fs.readdirSync("./plugins");
		foundPlugins.forEach(async filename => this.loadSinglePlugin(filename));
		print("Plugins prepared.");
	}

    async readyEvents() {
        this.events.forEach((events, eventName) => {
            const listener = (...eventArgs) => {
                for (const event of events) event.bind(this.client)(...eventArgs);
            };
            this.registeredEvents.set(eventName, listener);
            this.client.on(eventName, listener);
            print(`Event [${eventName}] loaded with [${events.length}] events attached.`)
        });
    }

	async readyPlugins() {
		// Run the plugin functions so events are placed in the client object.
		for (const [pluginName, fn] of this.plugins) try {
			await fn.bind(this)();
			print(`[${pluginName}] is now ready for client events.`);
		} catch (err) {
			console.error(err, `Failed to ready plugin or plugin emitted an error [${pluginName}] (See above)`);
		}
	}

	attachEvent(event, fn) {
		const existingEvent = this.events.get(event);
		this.events.set(event, existingEvent ? [fn, ...existingEvent] : [fn]);
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
