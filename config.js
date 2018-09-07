"use strict";
// our DB name is blog-post-app in mLab
exports.DATABASE_URL =
    process.env.DATABASE_URL || "mongodb://localhost/blog-post-app";
exports.TEST_DATABASE_URL =
    process.env.TEST_DATABASE_URL || "mongodb://localhost/test-blog-posts";
exports.PORT = process.env.PORT || 8080;



