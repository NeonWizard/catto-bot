module.exports = {
    name: "random-ping",
    triggers: ["ping"],
    fn: ({channel}) => channel.send("Pong!")
};