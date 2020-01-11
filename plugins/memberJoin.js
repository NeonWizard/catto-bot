const {promisify} = require('util');

module.exports = async function() {
	const { client, config, dbquery, guild_id, events } = this;
	if (config.development) return;

	// const readyEvent = async () => {
	// 	const guild = client.guilds.get(guild_id);

	// 	for (const [id, member] of guild.members.entries()) {
	// 		await dbquery("INSERT IGNORE INTO User SET ?", {id: id, initialJoinDate: member.joinedAt});
	// 	}
	// };

	// events.attach("post-ready", readyEvent);
	events.attach("guildMemberAdd", async (member) => {
		await dbquery("INSERT IGNORE INTO User SET ?", {id: member.id});
	});
}