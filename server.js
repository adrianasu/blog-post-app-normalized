const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const {DATABASE_URL, PORT} = require("./config");


const app = express();

app.use(morgan('common'));
app.use(express.json());

// app.get("/", (req, res) => {
//     res.sendFile(__dirname + "/views/index.html");
// });

const {Posts} = require('./models');

//GET requests return 10 posts
app.get('/blog-posts', (req, res) => {
    Posts.find()
        .then(posts => {
            console.log('Sending response from GET request');
            res.json({
                posts: posts.map(post => post.serialize())
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({
                message: "Internal server error"
            });
        });
});

// GET requests by id
app.get('/blog-posts/:id', (req, res) => {
    Posts
        .findById(req.params.id)
        .then(post => {
            console.log('Sending response from GET request by Id');
            res.json(post.serialize())
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({
                message: "Internal server error"
            });
        });
});

// POST requests
app.post('/blog-posts', (req, res) => {
    //ensure title, content and author are in request body
    const requiredFields = ['title', 'content', 'author'];
    const missingFields = requiredFields.filter(field => !(field in req.body));
    const noStringFields = requiredFields.filter(field => typeof field === "string");
    // check 1
    if (missingFields.length) {
        const message = `Missing \`${missingFields.join(', ')}\` in request body`;
        console.error(message);
        return res.status(400).send(message);
    }

    //success
    console.log('Posting a new blog post');
    Posts.create({
            title: req.body.title,
            content: req.body.content,
            author: req.body.author,
        })
        .then(post => res.status(201).json(post.serialize()))
        .catch(err => {
            console.error(err);
            res.status(500).json({
                message: "Internal server error"
            })
        })
});

app.put('/blog-posts/:id', (req, res) => {
    // check that id in request body matches id in request path
    if (req.params.id !== req.body.id) {
        const message = `Request path id (${req.params.id}) and request body id `
        `(${req.body.id}) must match`;
        console.error(message);
        return res.status(400).json({
            message: message
        });
    }
    // we only support a subset of fields being updateable
    // if the user sent over any of them (title, content, author)
    // we update those values on the database
    const updateableFields = ["title", "content", "author"];
    // check if request body contains any updateable field
    if (updateableFields.length === 0) {
        const message = `Missing \`${updateableFields.join('or ')}\` in request body`;
        console.error(message);
        return res.status(400).json({
            message: message
        });
    }
    // check what fields were sent in the request body to update
    const toUpdate = {};
    updateableFields.forEach(field => {
        if (field in req.body) {
            toUpdate[field] = req.body[field];
        }
    });

    //success! all key/value pairs in toUpdate will be updated
    console.log(`Updating blog post with id \`${req.params.id}\``);
    Posts
        .findByIdAndUpdate(req.params.id, {
            $set: toUpdate
        })
        .then(post => res.status(201).json(post.serialize()))
        .catch(err => res.status(500).json({
            message: "Internal server error"
        }));
});

app.delete('/blog-posts/:id', (req, res) => {
    Posts
        .findByIdAndRemove(req.params.id)
        .then(post => {
            res.status(200).json({
                deleted: `${req.params.id}`,
                OK: "true"
            });
            console.log(`Deleted post \`${req.params.id}\``);
        })
        .catch(err => res.status(500).json({
            message: "Internal server error"
        }));
});

app.use('*', function (req, res) {
    res.status(404).json({
        message: "Not Found"
    });
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