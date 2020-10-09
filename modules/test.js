module.exports = {
    name: 'test',
    description: 'desc.',
    execute(message, args) {
        message.channel.send('Pong.');
    },
};
