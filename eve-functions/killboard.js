/**
 * Created by ivan on 13/02/2018.
 */
var request = require('request');
var request_options = {
    url: '',
    headers: {
        'User-Agent': 'De Perdidos Discord Bot. Maintainer: ivanviguera@gmail.com'
    },
    gzip: true
};

module.exports = {
    getCorporationKills: function (args) {
        "use strict";

        return [1, 2, 3, 4, 5];
    },
    getLastPilotKills: function (args, callback) {
        "use strict";

        var limit = 5;
        var output = [];
        var last_element = args.length - 1;

        if (args.length > 1 && !isNaN(parseInt(args[last_element]))) {
            limit = args.pop();
        }

        var name_pilot = '';
        var i = 0;
        var first = true;
        for (var i = 0; i < args.length; i++) {
            if (!first) {
                name_pilot += '+';
            } else {
                first = false;
            }
            name_pilot += args[i];
        }

        /**
         * @TODO harcoded values...yummy :3 in the future delegate to constants/conf file o api handler...
         */
        var eve_who_api = 'https://evewho.com/api.php?type=character&name=' + name_pilot;

        request(eve_who_api, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var char_info = JSON.parse(body);
                if (char_info.info != null) {
                    module.exports.getLastPilotKillsById([char_info.info.character_id, limit], function (response) {
                        callback(response);
                    });
                } else {
                    callback(['Error: ' + name_pilot + ' no existe en EVE.']);
                }
            } else {
                callback([error]);
            }
        });
    },
    getLastPilotKillsById: function (args, callback) {
        "use strict";
        var limit = 5;
        var output = [];

        if (args.length == 2 && !isNaN(parseInt(args[1]))) {
            limit = args[1];
        }

        var characterID = args[0];
        var aux_request_opt = request_options;

        aux_request_opt.url = 'https://zkillboard.com/api/limit/' + limit + '/characterID/' + characterID + '/';
        console.log(aux_request_opt.url);

        request(aux_request_opt, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                //https://discordapp.com/developers/docs/resources/channel#embed-object

                var kill_list = JSON.parse(body);
                var i = kill_list.length - 1;
                while (i >= 0) {
                    var copy = {
                        embed: {
                            title: 'Kill',
                            description: '',
                            url: '',
                            color: 3066993,
                            thumbnail: {
                                url: '',
                                height: 64,
                                width: 64
                            }/*,
                            fields: [{
                                name: 'Field 1',
                                value: 'value 1',
                            },{
                                name: 'Field 2',
                                value: 'value 2',
                            }]*/
                        }
                    };
                    var actual_kill = kill_list[i];
                    if(actual_kill['victim']['character_id'] == characterID) {
                        copy.embed.color = 15158332;
                        copy.embed.title = 'Lost';
                    }
                    copy.embed.url = 'https://zkillboard.com/kill/' + actual_kill['killmail_id'] + '/';
                    var thumb_url = 'https://imageserver.eveonline.com/Type/' +  actual_kill['victim']['ship_type_id'] + '_64.png';
                    copy.embed.thumbnail.url = thumb_url;
                    output.push(copy);
                    i--;
                }
            } else {
                output.push(error);
            }
            callback(output);
        });
    }
}
