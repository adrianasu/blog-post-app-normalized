const chai = require('chai');
const chaiHttp = require('chai-http');

const { app, closeServer, runServer } = require('../server');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Posts', function() {
    before(function() {
        return runServer();
    });

    after(function() {
        return closeServer();
    })

    it('Should list posts on GET', function() {
        return chai.request(app)
            .get('/blog-posts')
            .then(function (res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.a('array');
                expect(res.body.length).to.be.at.least(1);
                const expectedKeys = ['title', 'content', 'author'];
                res.body.forEach(function (recipe) {
                    expect(recipe).to.be.a('object');
                    expect(recipe).to.include.keys(expectedKeys);
                });
            });
    });

    it('Should add a post on POST', function() {
        const newPost = {
            title: 'This morning',
            content: "Happy birthday my little baby. I'\m so happy to be your mom",
            author: 'Me'
        }
        return chai.request(app)
            .post('/blog-posts')
            .send(newPost)
            .then(function(res) {
                expect(res).to.have.status(201);
                expect(res).to.be.json;
                expect(res.body).to.be.a('object');
                expect(res.body).to.include.keys('title', 'content', 'author');
                expect(res.body.id).to.not.equal(null);
                expect(res.body).to.deep.equal(Object.assign(newPost, {
                    id: res.body.id,
                    publishDate: res.body.publishDate
                }));
            });
    });

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