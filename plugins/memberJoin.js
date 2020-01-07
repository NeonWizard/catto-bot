const {promisify} = require('util');

module.exports = async function() {
	const { client, config, dbconn, events } = this;
	if (config.development) return;

	const _queryAsync = promisify(dbconn.query).bind(dbconn);

	events.attach("guildMemberAdd", async (member) => {
		await _queryAsync("INSERT IGNORE INTO User SET ?", {id: member.id});
	});
}