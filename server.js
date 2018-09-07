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

const {Posts, Authors} = require('./models');

//GET requests return all posts
app.get('/posts', (req, res) => {
    Posts
        .find()
        .then(posts => {
            console.log('Sending response from GET request ');
            res.status(200).json(
                posts.map(post => {
                    return {
                        id: post._id,
                        title: post.title,
                        content: post.content,
                        author: post.authorString,
                        created: post.created
                    }
                })
            )
         })
        .catch(err => {
            console.error("Get POST error ");
            res.status(500).json({
                message: "Internal server error"
            });
        });
});

// GET requests by id
app.get('/posts/:id', (req, res) => {
    Posts
        .findById(req.params.id)
        .then(post => {
            console.log('Sending response from GET request by Id');
            res.json({
                title: post.title,
                content: post.content,
                author: post.authorString,
                created: post.created,
                comments: post.comments
            })
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({
                message: "Internal server error"
            });
        });
});

app.post('/posts', (req, res) => {
    //ensure title, content and author_id are in request body
    const requiredFields = ['title', 'content', 'author'];
    const missingFields = requiredFields.filter(field => !(field in req.body));
    // check for missing fields
    if (missingFields.length) {
        const message = `Missing \`${missingFields.join(', ')}\` in request body`;
        console.error(message);
        return res.status(400).send(message);
    }

    // first look for author in Author collection
    return Authors
        .findById(req.body.author)
        .then(author => {
            if (author) {
            // success. Create blog post
            console.log('Posting a new blog post');
            return Posts
                .create({
                    title: req.body.title,
                    content: req.body.content,
                    author: req.body.author
                })
                .then(post => res.status(201).json({
                    id: post._id,
                    title: post.title,
                    content: post.content,
                    author: `${author.firstName} ${author.lastName}`,
                    created: post.created,
                    comments: post.comments
                }))
                .catch(err => {
                    console.error(err);
                    res.status(500).json({
                        message: "Internal server error"
                    })
                })
            }
            else {
                   const message = `Author with ${req.body.author_id} id not found`;
                   console.error(message);
                   return res.status(400).send(message);
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({
                message: "Internal server error"
            })
        })        
});

app.put('/posts/:id', (req, res) => {
    // check that id in request body matches id in request path
    if (req.params.id !== req.body.id) {
        const message = `Request path id ${req.params.id} and request body id ${req.body.id} must match`;
        console.error(message);
        return res.status(400).json({
            message: message
        });
    }
    // we only support a subset of fields being updateable
    // if the user sent over any of them (title, content)
    // we update those values on the database
    const updateableFields = ["title", "content"];
    // check what fields were sent in the request body to update
    const toUpdate = {};
    updateableFields.forEach(field => {
        if (field in req.body) {
            toUpdate[field] = req.body[field];
        }
    });
    // check if request body contains any updateable field
    if (toUpdate.length === 0) {
        const message = `Missing \`${updateableFields.join('or ')}\` in request body`;
        console.error(message);
        return res.status(400).json({
            message: message
        });
    }

    //success! all key/value pairs in toUpdate will be updated
    console.log(`Updating blog post with id \`${req.params.id}\``);
    return Posts
        .findByIdAndUpdate(req.params.id, {$set: toUpdate}, {new: true})
        .then(post => res.status(201).json({
            title: post.title,
            content: post.content,
            //author: post.authorString,
            created: post.created
        }))
        .catch(err => res.status(500).json({
            message: "Internal server error"
        }));
});

app.delete('/posts/:id', (req, res) => {
    return Posts
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

app.get('/authors', (req, res) => {
    Authors
        .find()
        .then(authors => {
            console.log('Get all authors');
            res.status(200).json(
                authors.map(author => {
                    return {
                        firstName: `${author.firstName}`,
                        lastName: `${author.lastName}`,
                        userName: author.userName
                    }
            }))
        })
        .catch(err=> {
            consolel.error(err);
            return res.status(500).json({message: 'Internal server error'});
        })
});

app.post('/authors', (req, res) => {
    // check that the request body includes firstName, lastName and userName
    const requiredFields = ['firstName', 'lastName', 'userName'];
    const missingFields = requiredFields.filter(field => (!field in req.body));
    if (missingFields.length !== 0) {
        const message = `Missing fields ${missingFields.join(', ')} in request body`;
        console.error(message);
        return res.status(400).json({message: message});
    }
    // check that userName is not already taken
    Authors
        .findOne({userName: req.body.userName})
        .then(author => {
            if (author) {
                const message = `The username ${req.body.userName} is already taken`;
                console.error(message);
                return res.status(400).json({message: message});
            }
            else {
                Authors
                    .create({
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        userName: req.body.userName
                    })
                    .then(author => res.status(201).json({
                        _id: author.id,
                        name: `${req.body.firstName} ${req.body.lastName}`,
                        userName: author.userName
                    }))
                    .catch(err => {
                        console.error(err);
                        res.status(500).json({message: "Internal server error"})
                    })
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({
                message: "Internal server error"
            })
        })
})

app.put('/authors/:id', (req,res) => {
    // check 1
    if (!req.body.id) {
         const message = `Missing Id on request body`;
         console.error(message);
         return res.status(400).json({
             message: message
         });
    }
    // check 2
    if (req.body.id !== req.params.id) {
        const message = `Id in request body and Id on request path don't match`;
        console.error(message);
        return res.status(400).json({message: message});
    }

    // check if the body request contains one or more of the fields to update
    const updateableFields = ['firstName', 'lastName', 'userName'];
    const toUpdateFields = {};
    updateableFields.forEach(field => {
        if (field in req.body) {
            toUpdateFields[field] = req.body[field];
        }
    });
    if (toUpdateFields.length === 0) {
        const message = `Missing ${updateableFields.join('or ')} fields in request body`;
        console.error(message);
        return res.status(400).json({
            message: message
        })
    }

    Authors
        .findOne({_id: req.body.id})
        .then(author => {
            if (author) {
                Authors
                    .findByIdAndUpdate(req.body.id, {$set: toUpdateFields}, {new: true})
                    .then(updatedAuthor => {
                        return res.status(200).json({
                            id: updatedAuthor._id,
                            name: `${updatedAuthor.firstName} ${updatedAuthor.lastName}`,
                            username: updatedAuthor.userName
                        })
                    })
                    .catch(err => {
                        console.error(err);
                        res.status(500).json({message: 'Internal server error'})
                    })
                }
            else {
                    const message = `Username with id ${req.body.id} doesn't exist`;
                    console.error(message);
                    return res.status(400).json({
                        message: message
                    });
            }
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({
                    message: 'Internal server error'
                })
            })
})

app.delete('/authors/:id', (req, res) => {
    Posts
        .remove({author: req.params.id})
        .then(posts => {
            console.log('Removed author from posts');
            Authors
                .findByIdAndRemove(req.params.id)
                .then(author => {
                    console.log(`Removed blog posts owned by author with id ${req.params.id}`);
                    res.status(200).json({message: `author ${req.params.id} deleted`});
                })
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({message: 'Internal server error'});
        })
})

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
        });
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