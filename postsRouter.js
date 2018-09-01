const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const {BlogPosts} = require('./models');

//GET requests return 10 posts
router.get('/', (req, res) => {
    BlogPosts.find()
        .limit(10)
        .then(posts => {
            console.log('Sending response from GET request');
            console.log("p" + posts);
            res.json({posts: posts.map(post => post.serialize())
            });
        })
        .catch(err=> {
            console.error(err);
            res.status(500).json({message: "Internal server error"});
        });
    });

// GET requests by id
router.get('/:id', (req, res) => {
    BlogPosts
        .findById(req.params.id)
        .then(post => {
            console.log('Sending response from GET request by Id');
            res.json(post.serialize())
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({message: "Internal server error"});
        });
});

// POST requests
router.post('/', (req,res) => {
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
    BlogPosts.create({
        title: req.body.title, 
        content: req.body.content, 
        author: {
                firstName: req.body.firstName,
                lastName: req.body.lastName 
        }
    })
    .then(post => res.status(201).json(post.serialize()))
    .catch(err => {
        console.error(err);
        res.status(500).json({message: "Internal server error"})
    })
});

router.put('/:id', (req, res) => {
     // check that id in request body matches id in request path
     if (req.params.id !== req.body.id) {
         const message = `Request path id (${req.params.id}) and request body id `
         `(${req.body.id}) must match`;
         console.error(message);
         return res.status(400).json({message: message});
     }
    // we only support a subset of fields being updateable
    // if the user sent over any of them (title, content, author)
    // we update those values on the database
    const updateableFields = ["title", "content", "author"];
    // check if request body contains any updateable field
    if (missingFields.length === 0) {
        const message = `Missing \`${updateableFields.join('or ')}\` in request body`;
        console.error(message);
        return res.status(400).json({message: message});
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
    BlogPosts
        .findByIdAndUpdate(req.params.id, {$set: toUpdate})
        .then(post => res.status(201).json(post.serialize()))
        .catch(err => res.status(500).json({message: "Internal server error"}));
});

router.delete('/:id', (req, res) => {
    BlogPosts
        .findByIdAndRemove(req.params.id)
        .then(post => {
            res.status(200).json({
            deleted: "${req.params.id}",
            OK: "true"
             });
             console.log(`Deleted post \`${req.params.id}\``);
        })
        .catch(err => res.status(500).json({message: "Internal server error"}));
});

router.use("*", function(req, res) {
    res.status(404).json({message: "Not Found"});
});

module.exports = router;
