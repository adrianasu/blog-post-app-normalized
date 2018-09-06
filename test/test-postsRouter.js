const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const faker = require('faker');
const uuid = require('uuid');


const { app, closeServer, runServer } = require('../server');
const { Posts, Authors } = require('../models');
const {TEST_DATABASE_URL} = require('../config');

// to make the "expect" syntax available through 
// this module
const expect = chai.expect;

chai.use(chaiHttp);

// we use faker library to generate placeholder values
// for author, title, content and put those random documents in db.
function generatePostData(id) {
    return {
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraph(),
        author: id
    }
}

// we use faker library to generate placeholder values
// for firstName, lastName and username. The author id will be passed
// as an argument from the generatePostData object created
function generateAuthorData() {
    return {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        userName: faker.internet.userName()
    }
}

function seedAuthorData() {
    console.info('Seeding author data');
    const seedAuthors = [];
    for (let x = 1; x <= 5; x++) {
        seedAuthors.push(generateAuthorData());
    }
    return Authors.insertMany(seedAuthors);
}

function getAuthorId(authors) {
    return authors[Math.floor(Math.random() * authors.length)].id; 
}

function seedPostData(authors) {
    console.info('Seeding posts data');
    const seedPosts = [];
    for (let x = 1; x <= 10; x++) {
        let id = getAuthorId(authors);
        seedPosts.push(generatePostData(id));
    }
    return Posts.insertMany(seedPosts);
}

function seedBlogData() {
    return seedAuthorData()
        .then(authors => {
                return seedPostData(authors)})
        .catch(err => {
            console.error(err);
        })
}

//this function deletes the entire database
function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}

describe('Posts API resource', function() {
    
    before(function () {
        return runServer(TEST_DATABASE_URL);
    });
    // hook function to seed the db before starting each test
    beforeEach(function () {
        return seedBlogData();
    });

    afterEach(function () {
        return tearDownDb();
    });
    after(function () {
        return closeServer();
    });

    describe('GET all posts endpoint', function() {

        it('Should return all posts on GET', function() {
            let res;
            return chai.request(app)
                .get('/posts')
                .then(function (_res) {
                    res = _res;
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('array');
                    expect(res.body.length).to.be.at.least(1);
                    return Posts.count();
                })
                .then(function(count) {
                    expect(res.body).to.have.lengthOf(count);
                })
        });

        it('Should return posts with right fields', function() { 
            let resPost;
            return chai.request(app)
                .get('/posts')
                .then(function (res) {
                    const expectedKeys = ['title', 'content', 'author', 'created'];
                    console.log(JSON.stringify(res.body));
                    res.body.forEach(function (post) {
                        expect(post).to.be.a('object');
                        expect(post).to.include.keys(expectedKeys);
                    });
                    console.log(res.body[0]);
                    resPost = res.body[0];
                    return Posts.findById(resPost.id);
                })
                .then(function (post) {
                    expect(resPost.title).to.equal(post.title);
                    expect(resPost.content).to.equal(post.content);
                    expect(resPost.author).to.equal(post.authorString);
                });
        });
    });

    describe('POST endpoint', function() {
        it('Should add a new post', function() {
            let newPost;
            Authors
                .findOne()
                .then(function(author) {
                    return newPost = generatePostData(author._id);
                })
                .then(function(newPost) {
                    return chai.request(app)
                        .post('/posts')
                        .send(newPost)
                        .then(function(res) {
                            expect(res).to.have.status(201);
                            expect(res).to.be.json;
                            expect(res.body).to.be.a('object');
                            expect(res.body).to.include.keys('title', 'content', 'author', 'created', 'comments');
                            expect(res.body.id).to.not.equal(null);
                            expect(res.body.title).to.equal(newPost.title);
                            expect(res.body.content).to.equal(newPost.content);
                            expect(res.body.author).to.equal(newPost.author);
                            expect(res.body.created).to.equal(newPost.created);
                            expect(res.body.comments).to.equal(newPost.comments);
                            return Posts.findById(res.body.id);
                        })
                        .then(function(post) {
                            expect(post.title).to.equal(newPost.title);
                            expect(post.content).to.equal(newPost.content);
                            expect(post.author).to.equal(newPost.author);
                            expect(post.created).to.equal(newPost.created);
                            expect(post.comments).to.equal(newPost.comments);
                        });
                });
        });
    });

    describe('PUT endpoint', function() {
        it('Should update title and content', function() {
            const updateData = {
                title: "Good morning",
                content: "Updated content"
            };
             Posts
                .findOne()
                .then(function(post) {
                    console.log(post);
                    updateData.id = post._id;
                    return chai.request(app)
                        .put(`/posts/${post._id}`)
                        .send(updateData)
                })
                .then(function(res) {
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    return Posts.findById(updateData.id);
                })
                .then(function(post) {
                    expect(post.title).to.equal(updateData.title);
                    expect(post.content).to.equal(updateData.content);
                });
            });
    });
    
    describe('DELETE endpoint', function() {
        it('Should delete a post by id', function() {
            let post;
            Posts
                .findOne()
                .then(function(_post) {
                    post = _post;
                    return chai.request(app)
                        .delete(`/posts/${_post._id}`)
                })
                .then(function(res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body.deleted).to.not.equal(null);
                    return Posts.findById(post._id);                    
                })
                .then(function(_post) {
                    expect(_post).to.be.null;
                });     
        });
    });
});
