const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require("./config");
const {Restaurant} = require("./models");

const app = express();

const postsRouter = require('./postsRouter');

app.use(morgan('common'));
app.use(express.json());

app.use('/blog-posts', postsRouter);

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

let server;

function runServer(databaseUrl, port=PORT) {
    return new Promise((resolve, reject) =>{
        mongoose.connect(
            databaseUrl,
            err => {
                if(err) {
                    return reject(err);
                }
            server = app.listen(port, () => {
            console.log(`Your app is listening on port ${port}`);
            resolve();
            })
            .on('error', err => {
                mongoose.disconnect();
                reject(err);
            });
        }
        );
    });
}

function closeServer() {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log("Closing server");
            server.close(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}

if (require.main === module) {
    runServer(DATABASE_URL).catch(err=> console.error(err));
}

module.exports = {app, runServer, closeServer};