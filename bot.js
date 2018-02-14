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
var eve_corp_user = {
    tokens: null,
    auth_info: null
};
var eve_functions = {
    killboard: require('./eve-functions/killboard')
};

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
var intentos = 0;
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`

    logger.info('User: ' + user + ' con id ' + userID);

    //pequeña trolleada, quitarla mañana xd
    if(user != 'I3lack Knight' || intentos >= 1) {
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
                case 'dpar-killboard':
                    if (eve_corp_user.tokens != null) {
                        sendMessages(channelID,
                            eve_functions.killboard.getCorporationKills(args),
                            1000);
                    } else {
                        var message = 'Error access';
                        bot.sendMessage({
                            to: channelID,
                            message: message
                        });
                    }
                    break;
                case 'check-killboard':
                    if(args.length >= 1) {
                        eve_functions.killboard.getLastPilotKills(args, function(response) {
                            "use strict";
                            sendMessages(channelID,
                                response,
                                500);
                        });
                    } else {
                        var response = [];
                        response.push('Error: Insuficientes argumentos.');
                        response.push('!help');
                        sendMessages(channelID,
                            response,
                            500);
                    }
                    break;
                case 'help':
                    var command_list = [
                        'Lista de comandos:',
                        '!ping -> juega al ping-pong con el bot.',
                        '!check-killboard character_name [kills_to_show] -> muestra por defecto las últimas 5 entradas de zkillboard de character_name'
                    ];
                    sendMessages(channelID,
                        command_list,
                        1000);
                    break;
            }
        }
    } else {
        console.log('Intentos: ' + intentos);
        var mensajes = [':see_no_evil:', '¿A la 3a va la vencida?'];
        sendMessages(channelID,
            [mensajes[intentos]],
            500);
        intentos++;
    }
});


//Init http server for login petitions and refresh tokens
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
            eve_corp_user.tokens = accessToken;
            eve_corp_user.auth_info = charToken;
            res.send({eve_corp_user: eve_corp_user})
        }
    );
});
app.listen(3000, function () {
    console.log('Listening on port 3000!');
});

//https://github.com/izy521/discord.io/blob/master/example.js
/*Function declaration area*/
function sendMessages(ID, messageArr, interval) {
    var resArr = [], len = messageArr.length;
    var callback = typeof(arguments[2]) === 'function' ? arguments[2] : arguments[3];
    if (typeof(interval) !== 'number') interval = 1000;

    function _sendMessages() {
        setTimeout(function () {
            if (messageArr[0]) {
                var input = {
                    to: ID,
                };
                var actual_item = messageArr.shift();
                if(actual_item.hasOwnProperty('embed')) {
                    input.embed   = actual_item.embed;
                } else {
                    input.message = actual_item;
                }
                bot.sendMessage(input, function (err, res) {
                    resArr.push(err || res);
                    if (resArr.length === len) if (typeof(callback) === 'function') callback(resArr);
                });
                _sendMessages();
            }
        }, interval);
    }

    _sendMessages();
}