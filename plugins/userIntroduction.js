const {promisify} = require('util');
const Vibrant = require('node-vibrant');

module.exports = async function() {
	const { client, config, dbconn, events, channels, guild_id } = this;
	if (config.development) return;

	const cache = {
		_queryAsync: promisify(dbconn.query).bind(dbconn),
		get: async (k) => { return await cache._queryAsync("SELECT * FROM cache WHERE k=?", [k]) },
		set: async (k, v) => { await cache._queryAsync("INSERT INTO cache SET ?", {k: k, val: v})}
	};

	const readyEvent = async () => {
		const embed = {
			color: 0xfc8090,
			title: "Introduce yourself to the server!",
			description:
				"React to this message for the bot to message you and get you started with creating an introduction."
		};

		const uim = "user-introduction-message";
		const introChannel = channels.introduction;
		let introMessage;

		try {
			const result = await cache.get(uim);
			if (result.length != 1) throw "Intro channel message ID not found in cache";
			introMessage = await introChannel.fetchMessage(result[0].val);
		} catch (e) {
			console.log(`ERROR: ${e}`);
			introMessage = false;
		}

		if (introMessage) {
			await introMessage.edit({embed});
			print("Edited intro channel message.");
		} else {
			introMessage = await introChannel.send({embed});
			await cache.set(uim, introMessage.id);
			print("New intro channel message saved.");
		}

		await introMessage.react("💬");

		print("Intro channel prepared.");
	};

	events.attach("post-ready", readyEvent);
	events.attach("messageReactionAdd", async (reaction, user) => {
		if (user.id == client.user.id) return; // don't handle reaction from bot
		if ((await cache._queryAsync("SELECT * FROM UserIntro WHERE uid=?", [user.id])).length > 0) return;
		await user.send("Welcome to Spooky's Forest! Would you like to introduce yourself? Say **yes** to get started! :heart:");
		await cache._queryAsync("INSERT IGNORE INTO UserIntro SET ?", {uid: user.id}); // TODO: replace with global queryAsync
	});
	events.attach("message", async (message) => {
		if (message.channel.type !== "dm") return;
		if (message.author == client.user) return;

		let introSelect = await cache._queryAsync("SELECT * FROM UserIntro WHERE uid=?", [message.author.id]); // TODO: replace with global queryAsync
		if (introSelect.length == 0) return;
		let introIndex = introSelect[0].index;

		switch (introIndex) {
			case (0):
				if (message.cleanContent.toLowerCase() != "yes") return; // handle message content
				await message.author.send("Alright. What's your name?"); // send next step
				break;
			case (1):
				await cache._queryAsync("UPDATE UserIntro SET name=? WHERE uid=?", [message.cleanContent, message.author.id]); // TODO: replace with global queryAsync
				await message.author.send(`What country are you from, ${message.cleanContent}?`);
				break;
			case (2):
				await cache._queryAsync("UPDATE UserIntro SET country=? WHERE uid=?", [message.cleanContent, message.author.id]); // TODO: replace with global queryAsync
				await message.author.send("What's your gender? `(male, female, other)`");
				break;
			case (3):
				let txt = message.cleanContent.toLowerCase();
				if (!["male", "female", "other"].includes(txt)) {
					await message.author.send("Sorry, that's not a valid option.");
					return;
				}
				await cache._queryAsync("UPDATE UserIntro SET gender=? WHERE uid=?", [txt.charAt(0).toUpperCase()+txt.slice(1), message.author.id]); // TODO: replace with global queryAsync
				await message.author.send("Cool! How old are you?");
				break;
			case (4):
				if (isNaN(message.cleanContent) || message.cleanContent > 80 || message.cleanContent < 12) {
					await message.author.send("Sorry, that's not a valid age.");
					return;
				}
				await cache._queryAsync("UPDATE UserIntro SET age=? WHERE uid=?", [message.cleanContent, message.author.id]); // TODO: replace with global queryAsync
				await message.author.send("Lastly, tell us about yourself! Do you have any hobbies/interests?");
				break;
			case (5):
				await cache._queryAsync("UPDATE UserIntro SET about=? WHERE uid=?", [message.cleanContent, message.author.id]); // TODO: replace with global queryAsync
				let palette = await Vibrant.from(message.author.displayAvatarURL).getPalette();

				const embed = {
					color: parseInt(palette.Vibrant.hex.replace(/^#/, ''), 16),
					author: {
						name: message.author.tag,
						icon_url: message.author.displayAvatarURL
					},
					thumbnail: {
						url: message.author.displayAvatarURL
					},
					fields: [
						{
							name: "Name",
							value: introSelect[0].name,
							inline: true
						},
						{
							name: "Location",
							value: introSelect[0].country,
							inline: true
						},
						{
							name: "Age",
							value: introSelect[0].age,
							inline: true
						},
						{
							name: "Gender",
							value: introSelect[0].gender
						},
						{
							name: "About Me",
							value: message.cleanContent
						}
					]
				};

				channels.introduction.send({embed});
				await message.author.send(`Thank you ${introSelect[0].name}! Your introduction has been posted in <#654079528658010137> :heart:`);
				break;
			default: return;
		}

		await cache._queryAsync("UPDATE UserIntro SET `index`=`index`+1 WHERE uid=?", [message.author.id]); // TODO: replace with global queryAsync
	});
}