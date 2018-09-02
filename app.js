var express = require('express');
var app = express();
require('dotenv').config();
var request = require('request');
var Promise = require('bluebird');
var btoa = require('btoa');

var client_id = process.env.SPOTIFY_CLIENT_ID;
var client_secret = process.env.SPOTIFY_CLIENT_SECRET;

var currentToken = '';

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.get('/:artistName', function (req, res) {
    getArtistIdFromSearchName(getAuthOptions(), req.params.artistName)
        .then(function (result1) {
	    //  There is going to only be one 'items' object in the list, because limit=1 in request   
            return relatedArtistsRequest(result1.artists.items[0].id);
        })
        .then(function (result) {
            const body = formatResponseByName(result);
            res.send('Here are the 20 closest related artists to the artist based on the search term \"' + req.params.artistName + '\": ' + body);
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

function relatedArtistsRequest(artistId) {
    return new Promise(
        function (resolve, reject) {
                var auth_header2 = `Bearer ${currentToken}`;
                var options = {
                    url: `https://api.spotify.com/v1/artists/${artistId}/related-artists`,
                    headers: {
                        'Authorization': auth_header2,
                    },
                    json: true
                };
                request.get(options, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                          resolve(body);
                    } else {
                          console.log("ERROR: " + error + ", STATUS CODE: " + statusCode);
                    }
                });
        }
    );
       
}

function getArtistIdFromSearchName(authOptions, query) {
    return new Promise(
        function (resolve, reject) {
            request.post(authOptions, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    currentToken = body.access_token;
                    let queryParam = query;
                    if (query.indexOf(' ') >= 0) {
                        queryParam = formatSearchQueryParam(query);
                    }
                    var auth_header2 = `Bearer ${currentToken}`;
                    var options = {
                        url: `https://api.spotify.com/v1/search?q=${queryParam}&type=artist&limit=1`,
                        headers: {
                            'Authorization': auth_header2,
                        },
                        json: true
                    }; 
                    request.get(options, function (error, response, body) {
			if (!error && response.statusCode === 200) {
                       		resolve(body);
			} else {
				console.log("ERROR: " + error + ", STATUS CODE: " + statusCode);
			}
                    });
                } else {
			console.log("ERROR: " + error + ", STATUS CODE: " + statusCode);
		}
            });
        }
    );
}

function formatSearchQueryParam(queryString) {
    for (var i = 0; i < queryString.length; i++) {
        if (queryString[i] === ' ') {
            queryString = queryString.substring[0, i] + '+' + queryString.substring[i + 1, queryString.length];
        }
    }
    return queryString;
}

function formatResponseByName(body) {
    let result = '';
    for (let i = 0; i < body.artists.length; i++) {
        result += body.artists[i].name + ', ';
    }
    return result;
}

