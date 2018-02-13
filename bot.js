/*
 Font:
 https://medium.com/@renesansz/tutorial-creating-a-simple-discord-bot-9465a2764dc0
 */
var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');


var express = require('express');
var app = express();

//https://www.npmjs.com/package/eve-sso-simple
var esso = require('eve-sso-simple');
var eve_scopes = 'esi-wallet.read_corporation_wallet.v1 esi-killmails.read_corporation_killmails.v1 esi-wallet.read_corporation_wallets.v1 esi-bookmarks.read_corporation_bookmarks.v1';
var eve_access_token = null;
var eve_character_token = null;

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
    token: auth.token,
    autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];

        args = args.splice(1);
        switch (cmd) {
            // !ping
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!'
                });
                break;
            // Just add any case commands if you want to..
            case 'kills':
                var kills = [];
                if(eve_access_token != null) {
                    kills = getKills(args);
                    sendMessages(channelID , kills, 1000);
                } else {
                    var message = 'Error access';
                    bot.sendMessage({
                        to: channelID,
                        message: message
                    });
                }
                break;
        }
    }
});

app.get('/', (req, res) => {
    esso.login(
        {
            client_id: auth.eve_client_id,
            client_secret: auth.ëve_secret_key,
            redirect_uri: 'http://localhost:3000/callback',
            scope: eve_scopes
        }, res);
});

app.get('/callback', (req, res) => {
    // Returns a promise - resolves into a JSON object containing access and character token.
    esso.getTokens({
            client_id: auth.eve_client_id,
            client_secret: auth.ëve_secret_key
        }, req, res,
        (accessToken, charToken) => {
            eve_access_token = accessToken;
            eve_character_token = charToken;
            res.send({access_token: eve_access_token, character_token: eve_character_token})
        }
    );
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

function getKills(args) {
    "use strict";

    return [1,2,3,4,5];
}

//https://github.com/izy521/discord.io/blob/master/example.js
/*Function declaration area*/
function sendMessages(ID, messageArr, interval) {
    var resArr = [], len = messageArr.length;
    var callback = typeof(arguments[2]) === 'function' ?  arguments[2] :  arguments[3];
    if (typeof(interval) !== 'number') interval = 1000;

    function _sendMessages() {
        setTimeout(function() {
            if (messageArr[0]) {
                bot.sendMessage({
                    to: ID,
                    message: messageArr.shift()
                }, function(err, res) {
                    resArr.push(err || res);
                    if (resArr.length === len) if (typeof(callback) === 'function') callback(resArr);
                });
                _sendMessages();
            }
        }, interval);
    }
    _sendMessages();
}