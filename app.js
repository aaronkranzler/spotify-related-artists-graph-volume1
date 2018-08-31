var express = require('express');
var app = express();
require('dotenv').config();
var request = require('request');
var Promise = require('bluebird');
var btoa = require('btoa');

var client_id = process.env.SPOTIFY_CLIENT_ID;
var client_secret = process.env.SPOTIFY_CLIENT_SECRET;

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.get('/:id', function (req, res) {
    makePostRequest(getAuthOptions(), req.params.id)
        .then(function (result) {
            const body = formatResponseByName(result);
            res.send('Here are the 20 most related artists to the artist with the id ' + req.params.id + ': ' + body);
        });
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

function getAuthOptions() {
    var auth_header = btoa(`${client_id}:${client_secret}`);
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Authorization': `Basic ${auth_header}`,
            'content-type': 'application/x-www-form-urlencoded',
        },
        form: {
            grant_type: 'client_credentials'
        },
        json: true
    };
    return authOptions;
}

function makePostRequest(authOptions, artistId) {
    return new Promise(
        function (resolve, reject) {
            request.post(authOptions, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    // use the access token to access the Spotify Web API
                    var token = body.access_token;
                    var auth_header2 = `Bearer ${token}`;
                    var options = {
                        url: `https://api.spotify.com/v1/artists/${artistId}/related-artists`,
                        headers: {
                            'Authorization': auth_header2,
                        },
                        json: true
                    }
                    request.get(options, function (error, response, body) {
                        resolve(body);
                    });
                }
            });
        }
    );
}

function formatResponseByName(body) {
    let result = '';
    for (let i = 0; i < body.artists.length; i++) {
        result += body.artists[i].name + ' ';
    }
    return result;
}

