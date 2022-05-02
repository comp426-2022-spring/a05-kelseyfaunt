// Put your database code here
"use strict";

const database = require('better-sqlite3')
const logdb = new database('log.db')

const stmt = logdb.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='accesslog';`
);

let row = stmt.get();
if(row == undefined) {
    console.log('Your database appears to be empty. I will initialize it now.');

     const sqlInit = `
    CREATE TABLE accesslog (id INTEGER PRIMARY KEY, remoteaddr VARCHAR, remoteuser VARCHAR, time VARCHAR, method VARCHAR, url TEXT, protocol TEXT, status TEXT, httpversion TEXT, referer TEXT, useragent TEXT );`
    logdb.exec(sqlInit)
} else {
    console.log('Database exists')
}


module.exports = logdb