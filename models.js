const uuid = require('uuid');
const mongoose = require('mongoose');

const BlogPostsSchema = mongoose.Schema({
    id: String,
    title: {type: String, required: true},
    content: {type: String, required: true},
    author: {type: Object, required: true},
    created: Date
});

//virtual that sets author object into a string
BlogPostsSchema.virtual("authorString").get(function() {
    return`${this.author.firstName} ${this.author.lastName}`.trim();
});

// this instance method will be available on all instances of
// the model. This method will be used to return an object
// exposing only the fields we want from the underlying data
BlogPostsSchema.methods.serialize = function() {
    return {
        title: this.title,
        content: this.content,
        author: this.authorString,
        created: this.created
    };
};

 // after all instance methods and virtual properties have
 // been defined, we make the call to '.model'
 const BlogPosts = mongoose.model("BlogPosts", BlogPostsSchema);

module.exports = { BlogPosts };