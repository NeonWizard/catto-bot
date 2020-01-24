module.exports = {
	name: "nuke last messages",
	triggers: ["nuke"],
	devOnly: true,
	fn: ({channel}, args) => {
		if (isNaN(args[0])) {
			channel.send("Invalid nuke argument!");
		} else {
			channel.bulkDelete(args[0]);
			channel.send(`Successfully deleted ${args[0]} messages.`);
		}
	}
};