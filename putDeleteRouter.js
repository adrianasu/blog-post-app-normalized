const express = require('express');
const router = express.Router();

const {BlogPosts} = require('./models');

router.put('/:id', (req,res) => {
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
    // check 2
    // if (noStringFields.length) {
    //     const message = `Fields \`${missingFields.join(', ')}\` should be strings`;
    //     console.error(message);
    //     return res. status(400).send(message);
    // }
    //success
     console.log(`Updating blog post with id \`${req.params.id}\``);
    const post = BlogPosts.update({
        id: req.params.id,
        title: req.body.title, 
        content: req.body.content,
        author: req.body.author,
        publishDate: req.body.publishDate
    });
    res.status(201).json(post);
});

router.delete('/:id', (req, res) => {
    BlogPosts.delete(req.params.id);
    console.log(`Deleted post \`${req.params.id}\``);
    //res.status(200).json({"deleted": "${req.params.id}", "OK": "true"});
    res.status(204).end();
});

module.exports = router;