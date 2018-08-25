const express = require('express');
const router = express.Router();

const bodyParser =  require('body-parser');
const jsonParser = bodyParser.json();

const {BlogPosts} = require('./models');

BlogPosts.create('Whiskers arrival', 'It\'s the first time we adopt a pet. We\'re excited and nervous at the same time. But when we see Whiskers coming out of its cage we immediately know that he\'s perfect for us', 'Adriana');
BlogPosts.create('Moving to a new city', 'We put everything in a big container and left our small apartment to go to a new city. We\'re sad to leave our friends but excited to see our new home', 'Adriana');
BlogPosts.create('Finding our thing', 'I\'m so happy! I decided to enroll in a coding bootcamp with the idea of restarting my professional life doing something I enjoy a lot', 'Adriana');

router.get('/', (req, res) => {
    res.json(BlogPosts.get());
});

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
    // check 2
    // if (noStringFields.length) {
    //     const message = `Fields \`${missingFields.join(', ')}\` should be strings`;
    //     console.error(message);
    //     return res.status(400).send(message);
    // }
    //success
    const post = BlogPosts.create(req.body.title, req.body.content, req.body.author);
    res.status(201).json(post);
});

module.exports = router;
