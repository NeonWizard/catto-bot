const {Client} = require("discord.js");
const {promisify} = require('util');
const fs = require("fs");
const path = require("path");
const mysql = require("mysql");

// -- Helper funcs
const print = console.log;
global.print = print;
const wait = time => new Promise(resolve => setTimeout(resolve, time));

const BotEnv = class {
	constructor (config, client) {
		print("Client initializing...");

		this.config = config;
		this.client = client;

		this.dbconn = mysql.createPool({
			host		: 'localhost',
			user		: 'cattobot',
			password	: config.dbpass,
			database	: 'discordbot'
		});
		this.dbquery = promisify(this.dbconn.query).bind(this.dbconn);

		this.plugins = new Map();
		this.events = new Map();
		this.registeredEvents = new Map();
		this.events.attach = this.attachEvent.bind(this);

		this.guild_id = config.guild_id;
		this.type_ids = config.rcs;

		this.channels = {};
		this.roles = {};

		this.prepare().then(this.start.bind(this)).catch(console.error);
	}

	async prepare() {
		if (this.config.development) {
			print("Bot started in development mode, preparing in 3 seconds...");
			await wait(3000);
		}

		await this.preparePlugins();
		await this.readyPlugins();
		await this.readyDatabase();

		// After plugins are ready, any events that should have been attached will have been attached once you run the plugin (readyPlugins())
		await this.readyEvents();
	}

	async start() {
		await this.client.login(this.config.token);

		for (const [type, name, type_id] of this.type_ids) {
			this[type+"s"][name] = this.client.guilds.get(this.guild_id)[type+"s"].get(type_id);
			if (this.config.debug) print(`Added ${name} to the ${type}s object [${type_id}]`);
		}

		// - bulk delete spammer's messages
		// for (var channel of this.client.guilds.get(this.guild_id).channels.filter(c => c.type == "text").array()) {
		// 	var messages = [];
		// 	var last_id;

		// 	for (var i = 0; i < 10; i++) {
		// 		const options = { limit: 100 };
		// 		if (last_id) {
		// 			options.before = last_id;
		// 		}

		// 		const mtmp = await channel.fetchMessages(options);
		// 		messages.push(...mtmp.array());
		// 		last_id = mtmp.last().id;
		// 	}

		// 	messages.filter(m => m.author.id === "603024509951541249").forEach(m => m.delete());
		// }

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
            if (this.config.debug) print(`Event [${eventName}] loaded with [${events.length}] events attached.`)
        });
    }

	async readyPlugins() {
		// Run the plugin functions so events are placed in the client object.
		for (const [pluginName, fn] of this.plugins) try {
			await fn.bind(this)();
			if (this.config.debug) print(`[${pluginName}] is now ready for client events.`);
		} catch (err) {
			console.error(err, `Failed to ready plugin or plugin emitted an error [${pluginName}] (See above)`);
		}
	}

	async readyDatabase() {
		let foundModels = fs.readdirSync("./models");
		for (const fileName of foundModels) {
			const fn = require("./models/"+fileName);
			const model = await fn.bind(this)();
			this[model.name] = model;
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
