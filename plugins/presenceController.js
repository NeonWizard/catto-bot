/**
 * Sets the status of the bot to 1 of 5 statuses.
 */
module.exports = async function() {
    // this = BotEnvironment class
    const { client, events } = this;

    var presence = [
        "organizing cups",
        "owo what's this?",
        "bullying cooter"
    ];
    // Get the presenceoptions
    const presenceOptions = index => {
        return {
            game: {
                name: presence[index]
            },
            status: "Online"
        };
    };

    // Attach to already created events and execute the code.
    events.attach("ready", function() {
        presence.push(`with ${client.guilds.reduce((acc, cur) => acc+cur.memberCount, 0)} people ❤️`); // client.guilds must be used inside event

        client.user.setPresence(presenceOptions(Math.floor(Math.random() * presence.length))).catch(console.error);
        setInterval(() => {
            client.user.setPresence(presenceOptions(Math.floor(Math.random() * presence.length))).catch(console.error);
        }, 1000 * 60 * 60); // update presence every hour
    });
};