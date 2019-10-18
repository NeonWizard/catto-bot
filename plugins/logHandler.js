module.exports = async function() {
    const { client, events, channels, config } = this;
    if (config.development) return;

    const editEvent = async (oldMessage, newMessage) => {
        const author = oldMessage.author;
        const channel = newMessage.channel;
        if (author.id == client.user.id) return;

        const embed = {
            color: 0xefefef,
            author: {
                name: author.tag,
                icon_url: author.avatarURL
            },
            description: `**${author.tag}** edited their message.`,
            fields: [
                {
                    name: "Channel",
                    value: `${channel.toString()} (${channel.name})\n[Go To Message](${newMessage.url})`
                },
                {
                    name: "Now",
                    value: newMessage.content
                },
                {
                    name: "Previous",
                    value: oldMessage.content
                }
            ],
            timestamp: newMessage.editedAt,
            footer: {
                text: client.user.tag,
                icon_url: client.user.avatarURL
            }
        };
        await channels.staff_logs.send({embed});
    };

    events.attach("messageUpdate", editEvent);
}