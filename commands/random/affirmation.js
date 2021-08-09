module.exports = {
	name: "affirmation",
	triggers: ["affirmation"],
	fn: ({channel}) => {
    channel.send("good job!!!")
  }
};