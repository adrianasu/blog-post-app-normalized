const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const faker = require('faker');

const { app, closeServer, runServer } = require('../server');
const { Posts, Author } = require('../models');
const {TEST_DATABASE_URL} = require('../config');

// to make the "expect" syntax available through 
// this module
const expect = chai.expect;

chai.use(chaiHttp);

// we use faker library to generate placeholder values
// for author, title, content and put those random documents in db.
function generatePostData(id) {
    return {
        id: faker.random.number(),
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
        id: faker.random.number(),
        firstName: faker.random.first_name(),
        lastName: faker.random.last_name(),
        username: faker.internet.userName()
    }
}

function seedAuthorData() {
    console.info('Seeding author data');
    const seedAuthors = [];
    for (let x = 1; x <= 5; x++) {
        seedAuthors.push(generateAuthorData());
    }
    return Author.insertMany(seedAuthors);
}

function getAuthorId(authors) {
    return authors[Math.floor(Math.random() * authors.length)].id; 
}

function seedPostData(authors) {
    console.info('Seeding blog data');
    const seedPosts = [];
    for (let x = 1; x <= 10; x++) {
        seedPosts.push(generatePostData(getAuthorId(authors)));
    }
    return Posts.insertMany(seedPosts);
}

function seedBlogData() {
    return seedAuthorData()
        .then(authors => 
                seedPostData(authors))
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
            return chai.request(app)
                .get('/posts')
                .then(function (res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('array');
                    expect(res.body.length).to.be.at.least(1);
                    return Posts.count();
                })
                .then(function(count) {
                    expect(res.body.posts).to.have.lengthOf(count);
                })
        });

        it('Should return posts with right fields', function() { 
            let resPost;
            return chai.request(app)
                .get('/posts')
                .then(function (res) {
                    const expectedKeys = ['title', 'content', 'author', 'created'];
                    res.body.forEach(function (post) {
                        expect(post).to.be.a('object');
                        expect(post).to.include.keys(expectedKeys);
                    });
                    resPost = res.body.posts[0];
                    return Posts.findById(resPost.id);
                })
                .then(function (post) {
                    expect(resPost.title).to.equal(post.title);
                    expect(resPost.content).to.equal(post.content);
                    expect(resPost.author).to.equal(post.author);
                });
        });
    });

    describe('POST endpoint', function() {
        it('Should add a post on POST', function() {
            let newPost;
            generateAuthorData()
                .then(function(id) {
                    return newPost = generatePostData(id)});

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

-----------Falta PUT and DELETE---------------

    it('Should update a post on PUT', function() {
        const updatePost = {
            title: 'Christmas Vacation',
            content: "It's always exciting going back home and see mom and dad.",
            author: 'You'
        }
        return chai.request(app)
            .get('/blog-posts')
            .then(function(res) {
                updatePost.id = res.body[0].id;
                return chai.request(app)
                    .put(`/blog-posts/${updatePost.id}`)
                    .send(updatePost)
            })
            .then(function(res) {
                expect(res).to.have.status(201);
                expect(res).to.be.json;
                expect(res.body).to.be.a('object');
                expect(res.body).to.deep.equal(Object.assign(updatePost, {
                    id: res.body.id
                }));
            });
    });

    it('Should delete post on DELETE', function() {
        return chai.request(app)
            .get('/blog-posts')
            .then(function(res) {
                return chai.request(app)
                    .delete(`/blog-posts/${res.body[0].id}`)
            })
            .then(function(res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.a('object');
                expect(res.body.deleted).to.not.equal(null);
            });
    });
});