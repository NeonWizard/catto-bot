const {promisify} = require('util');

module.exports = async function() {
	const { client, events, dbconn, channels, guild_id, roles, config } = this;
	const { reactRoles, rcs } = config;

	const cache = {
		_queryAsync: promisify(dbconn.query).bind(dbconn),
		get: async (k) => { return await cache._queryAsync("SELECT * FROM cache WHERE k=?", [k]) },
		set: async (k, v) => { await cache._queryAsync("INSERT INTO cache SET ?", {k: k, val: v})}
	}

	const readyEvent = async () => {
		const guild = client.guilds.get(guild_id);

		const embed = {
			color: 0xfc8090,
			title: "Select a role by clicking on one of the reactions!",
			description:
				"To remove a role click the reaction again.\n*If roles don't work, try to remove and re-add the role, or contact a moderator.*\n\n" +
				reactRoles.map(({id, rct, title, desc}) => `${rct} = <@&${id}> ${desc}`).join('\n\n') + "\n\n" +
				"In order to get access to NSFW channels you must agree that you:\n- Are above the age of 18\n- Read and understood <#463464079126691870>\n- Understand that you may be banned if you are caught lying\n\n" +
				"* If you understand the consequences and agree, type `i agree nsfw` in <#463857799642742794>.",
		};

		const rmm = "role-manager-message";
		// const roleChannel = client.guilds.get("597623447438491669")["channels"].get("621570239938691072");
		const roleChannel = channels.roles;
		let roleMessage;

		try {
			const result = await cache.get(rmm);
			if (result.length != 1) throw "Role manager message ID not found in cache";
			roleMessage = await roleChannel.fetchMessage(result[0].val);
		} catch (e) {
			console.log(`ERROR: ${e}`);
			roleMessage = false;
		}

		if (!config.development) {
			if (roleMessage) {
				await roleMessage.edit({embed});
				print("Edited role manager message.");
			} else {
				roleMessage = await roleChannel.send({embed});
				await cache.set(rmm, roleMessage.id);
				print("New role manager message saved.");
			}

			for (const {rct} of reactRoles) {
				if (!config.development) await roleMessage.react(rct);
			}
		}

		print("Role manager prepared.");
	};

	const reactionHandler = async (reaction, user, action) => {
		if (user.id == client.user.id) return; // don't apply reaction roles to bot

		const guild = client.guilds.get(guild_id);
		const member = guild.members.get(user.id);

		const rct = reactRoles.filter(({rct}) => rct === reaction.emoji.toString())[0];

		if (rct) {
			const role = guild.roles.get(rct.id);
			if (action === "add") member.addRole(role);
			if (action === "remove") member.removeRole(role);
		}
	};

	events.attach("message", async ({ guild, channel, member, cleanContent }) => {
		if (!member) return;

		if (channel.id === channels.bot_stuff.id && cleanContent.toLowerCase().trim() === "i agree nsfw") {
			if (member.roles.has(roles.nsfw.id)) return;

			await member.addRole(roles.nsfw);
			channel.send("You were given the NSFW role.");
			channels.staff_logs.send(`${member} agreed and added the NSFW role`);
		}
	});

	events.attach("post-ready", readyEvent);
	events.attach("messageReactionAdd", (reaction, user) => reactionHandler(reaction, user, "add"));
	events.attach("messageReactionRemove", (reaction, user) => reactionHandler(reaction, user, "remove"));
};