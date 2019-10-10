const { promisify, inspect } = require('util');

// const redis = require('redis');
// const redisClient = redis.createClient();

// const cache = {
// 	get: promisify(redisClient.get).bind(redisClient),
// 	set: promisify(redisClient.set).bind(redisClient)
// };

module.exports = async function() {
	const { client, events, DBHandler, channels, guild_id, roles, config } = this;
	const { reactRoles, rcs } = config;

	const readyEvent = async () => {
		const guild = client.guilds.get(guild_id);

		const embed = {
			color: 0xcc86a7,
			title: "Select a role by clicking on one of the reactions!",
			description:
				"To remove that role click the reaction again\n*If roles don't work, try remove and re-add the role or contact a moderator (try yourself first)*\n\n" +
				reactRoles.map(({id, rct, title, desc}) => `${guild.emojis.get(rct)} = <@&${id}> ${desc}`).join('\n\n') + "\n\n" +
				"In order to get access to NSFW channels you must agree that you:\n- Are above the age of 18\n- Read and understood <#525721047413161996>\n- Understand that you will be banned permanently if you are lying\n\n" +
				"* If you understand the consequences and agree, type `i agree nsfw` in <#564907856583720960>.",
		};

		const rmm = "role-manager-message";
		const roleChannel = channels.roles;
		let roleMessage;

		try {
			roleMessage = await roleChannel.messages.fetch(await cache.get(rmm));
		} catch(err) {
			roleMessage = false;
		}

		if (roleMessage) {

			if (!config.development) await roleMessage.edit({embed});
			print("Edited role manager message.");

		} else {

			if (!config.development) roleMessage = await roleChannel.send({embed});
			await cache.set(rmm, roleMessage.id);
			print("New role manager message saved.");

		}

		for (const {rct} of reactRoles) {
			if (!config.development) await roleMessage.react(rct);
		}



		print("Role manager prepared.");
	};

	const reactionHandler = async (reaction, user, action) => {

		const guild = client.guilds.get(guild_id);
		const member = guild.members.get(user.id);

		const rct = reactRoles.filter(({rct}) => rct === reaction.emoji.id)[0];

		if (rct) {

			if (rct.condition && rct.condition[0]) {
				const not0 = (rct.condition[0].charAt(0) === "!");

				if (not0 && member.roles.has(rct.condition[0].replace('!', ''))) return;
				if (!not0 && !member.roles.has(rct.condition[0])) return;

				if (rct.condition[1]) {
					const not1 = (rct.condition[1].charAt(0) === "!");
					if (not1 && member.roles.has(rct.condition[1].replace('!', ''))) return;
					if (!not1 && !member.roles.has(rct.condition[1])) return;
				}
			}

			if (!(action === "remove" && rct.sticky)) {
				const role = guild.roles.get(rct.id);
				const nsfwRole = guild.roles.get(this.roles.nsfw.id);
				const trustedNSFWRole = guild.roles.get(this.roles.trustednsfw.id);

				if (action === "add" && member.roles.has("557516639407570964")) {
					if (nsfwRole) await member.roles.remove(nsfwRole);
					if (trustedNSFWRole) await member.roles.remove(trustedNSFWRole);
				}

				if (role) {
					// print(`${user.tag} => ${rct.title} ${action}`);
					await member.roles[action](role);
				}
			}

		}

	};

	events.attach("message", async ({ guild, channel, member, cleanContent }) => {

		if (!member) return;

		const staffChannel = guild.channels.get("525733493615886336");

		if (channel.id === "564907856583720960" && cleanContent.toLowerCase().trim() === "i agree nsfw") {
			if (member.roles.has(roles.nsfw.id)) return;
			if (member.roles.has(roles.not18.id)) {
				channel.send("You are not allowed to have the NSFW role.");
				if (staffChannel) staffChannel.send(`${member} tried adding the NSFW role but have Not18`)
			} else {
				await member.roles.add(roles.nsfw);
				channel.send("You were given the NSFW role.");
				if (staffChannel) staffChannel.send(`${member} agreed and added the NSFW role`)
			}
		}

		try {
			if (member.roles.has(roles.not18.id)) {
				if (member.roles.has(roles.nsfw.id)) await member.roles.remove(roles.nsfw).catch();
				if (member.roles.has(roles.trustednsfw.id)) await member.roles.remove(roles.trustednsfw).catch();
			}
		} catch(e) { console.error(e) }

	});

	events.attach("post-ready", readyEvent);
	events.attach("messageReactionAdd", (reaction, user) => reactionHandler(reaction, user, "add"));
	events.attach("messageReactionRemove", (reaction, user) => reactionHandler(reaction, user, "remove"));

	events.attach("guildMemberUpdate", (oldMember, newMember) => {
		if (oldMember.db_roles !== newMember.roles.map(({id}) => id)) {
			newMember.updateDBRoles();
		}
	});

};