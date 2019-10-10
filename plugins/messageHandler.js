const fs = require("fs");
const path = require("path");

module.exports = async function() {
	const { config, client, events, DBHandler } = this;
	this.commands = new Map();

	const commandLoader = () => {
		const commandsDir = path.resolve("./commands");
		const commandDirs = fs.readdirSync(commandsDir);
		for (const dir of commandDirs) {
			const commands = fs.readdirSync(path.resolve(commandsDir, dir));
			for (const cmd of commands) {
				try {
					const command = require(path.resolve(commandsDir, dir, cmd));
					if (command && typeof command === "object") {
						const { name, triggers } = command;
						for (const trigger of triggers) {
							this.commands.set(trigger, command);
							print(`Added command trigger [${trigger}] for command [${name}]`);
						}
					}
				} catch(err) {
					console.error(err, `Failed to load command [${cmd}] (Read above)`)
				}
			}
		}
	};

	commandLoader();

	events.attach("message", async message => {
		const { guild, author, content, channel, member } = message;

		if (!guild) return;
		if (author.bot) return;

		if (content.toLowerCase().trim().indexOf(config.prefix) !== 0) return;

		let args = content.slice(config.prefix.length).trim().split(/ +/g);
		const command = args.shift().toLowerCase();

		const foundCommand = this.commands.get(command);
		if (foundCommand) {
			const { devOnly = false, isNSFW = false, modOnly = false, fn, ignoreChats = [] } = foundCommand;

			if (!fn) return;

			if (ignoreChats.includes(channel.id)) return;

			if (devOnly && !config.developers.includes(author.id)) return;
			if (isNSFW && !channel.nsfw) return;
			// if (modOnly && (!member.permissions.has("KICK_MEMBERS") && !member.permissions.has("BAN_MEMBERS"))) return;

			fn.bind(this)(message, args, command);
		}

		// fail silently
	});

};