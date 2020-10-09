const Database = require('better-sqlite3');
const db = new Database('database.db');

module.exports = {
    init: function () {
        db.prepare('CREATE TABLE IF NOT EXISTS discordServers (id INTEGER PRIMARY KEY, serverId TEXT NOT NULL)').run();
    },
    bar: function () {
        // whatever
    }
};
