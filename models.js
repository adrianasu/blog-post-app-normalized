const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const AuthorSchema = mongoose.Schema({
    firstName: String,
    lastName: String,
    userName: {type: String, unique: true}
});

const CommentSchema = mongoose.Schema({
    content: String
});

const BlogPostsSchema = mongoose.Schema({
    title: {type: String, required: true},
    content: {type: String, required: true},
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Author"
    },
    comments: [CommentSchema],
    created: {type: Date, default:Date.now}
});

//virtual that sets author object into a string
BlogPostsSchema.virtual("authorString").get(function() {
    return`${this.author.firstName} ${this.author.lastName}`.trim();
});

// prehook function to populate author data after each call
// to find
BlogPostsSchema.pre('find', function (next) {
    this.populate('author');
    next();
});

// prehook function to populate author data after each call
// to findOne
BlogPostsSchema.pre('findOne', function(next) {
    this.populate('author');
    next();
});

// this instance method will be available on all instances of
// the model. This method will be used to return an object
// exposing only the fields we want from the underlying data
BlogPostsSchema.methods.serialize = function() {
    return {
        id: this._id,
        title: this.title,
        content: this.content,
        author: this.authorString,
        comments: this.comments,
        created: this.created
    };
};

 // after all instance methods and virtual properties have
 // been defined, we make the call to '.model'
 const Posts = mongoose.model("Post", BlogPostsSchema);
 const Author = mongoose.model("Author", AuthorSchema);

module.exports = { Posts, Author };