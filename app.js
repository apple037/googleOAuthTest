const express = require('express');
const { google } = require('googleapis');
const app = express();
// Load environment variables from env.toml
const toml = require('toml');
const fs = require('fs');

// Before app starts, initialize environment variables
const env = toml.parse(fs.readFileSync('env.toml', 'utf-8'));
const googleConfig = env.google;
// Print out environment variables
console.log(googleConfig);

app.get('/', (req, res) => {
    const oauth2Client = new google.auth.OAuth2(
        googleConfig.clientId,
        googleConfig.clientSecret,
        googleConfig.redirectUrl
    );

    const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid',
        // phone number
        'https://www.googleapis.com/auth/user.phonenumbers.read',
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes
    });

    res.redirect(url);
});

app.get('/oauth2callback', (req, res) => {
    const oauth2Client = new google.auth.OAuth2(
        googleConfig.clientId,
        googleConfig.clientSecret,
        googleConfig.redirectUrl
    );

    const code = req.query.code;
    oauth2Client.getToken(code, (err, tokens) => {
        if (err) {
            return console.error('Error retrieving access token', err);
        }
        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({
            auth: oauth2Client,
            version: 'v2'
        });
        // oAuthInfo
        let oAuthInfo = {};
        oauth2.userinfo.get((err, response) => {
            if (err) {
                return console.error('Error retrieving user info', err);
            }
            oAuthInfo.userInfo = response.data;
            console.log(oAuthInfo.userInfo);
        });
        // people me api
        const people = google.people({
            auth: oauth2Client,
            version: 'v1'
        });
        people.people.get({
            resourceName: 'people/me',
            personFields: 'phoneNumbers'
        }, (err, response) => {
            if (err) {
                return console.error('Error retrieving people/me', err);
            }
            oAuthInfo.peopleMe = response.data;
            console.log(oAuthInfo.peopleMe);
            res.send(oAuthInfo);
        });
    });
});

app.listen(3000, () => {
    console.log('App is listening on port 3000');
});