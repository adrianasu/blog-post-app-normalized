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

function checkResponse(res, statusCode, resType) {
    expect(res).to.have.status(statusCode);
    expect(res).to.be.json;
    expect(res.body).to.be.a(resType);
}

function checkResponseContent(resPost, post, authorId) {
    expect(resPost.title).to.equal(post.title);
    expect(resPost.content).to.equal(post.content);
    if (authorId) {
        expect(resPost.author).to.deep.equal(post.author._id);
    }
    else {
        expect(resPost.author).to.equal(post.authorString);
    }
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
                    checkResponse(res, 200, 'array');
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
                    //console.log(JSON.stringify(res.body));
                    res.body.forEach(function (post) {
                        expect(post).to.be.a('object');
                        expect(post).to.include.keys(expectedKeys);
                    });
                    resPost = res.body[0];
                    return Posts.findById(resPost.id);
                })
                .then(function (post) {
                    checkResponseContent(resPost, post);
                });
        });
    });

    describe('POST endpoint', function() {
        it('Should add a new post', function() {
            let newPost;
            return Authors
                .findOne()
                .then(function(author) {
                    return newPost = generatePostData(author._id);
                })
                .then(function(newPost) {
                    return chai.request(app)
                        .post('/posts')
                        .send(newPost)
                        .then(function(res) {
                            checkResponse(res, 201, 'object');
                            expect(res.body).to.include.keys('title', 'content', 'author', 'created', 'comments');
                            expect(res.body.id).to.not.equal(null);
                            //console.log(JSON.stringify(res.body));
                            return Posts.findById(res.body.id);
                        })
                        .then(function(post) {
                            checkResponseContent(newPost, post, post.author._id);
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
             return Posts
                .findOne()
                .then(function(post) {
                    updateData.id = post._id;
                    return chai.request(app)
                        .put(`/posts/${post._id}`)
                        .send(updateData)
                })
                .then(function(res) {
                    checkResponse(res, 201, 'object');
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
            return Posts
                .findOne()
                .then(function(_post) {
                    post = _post;
                    return chai.request(app)
                        .delete(`/posts/${_post._id}`)
                })
                .then(function(res) {
                    checkResponse(res, 200, 'object');
                    expect(res.body.deleted).to.not.equal(null);
                    return Posts.findById(post._id);                    
                })
                .then(function(_post) {
                    expect(_post).to.be.null;
                });     
        });
    });
});
