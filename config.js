"use strict";
// our DB name is blog-post-app in mLab
exports.DATABASE_URL =
    process.env.DATABASE_URL || "mongodb://localhost/blog-post-app";
exports.TEST_DATABASE_URL =
    process.env.TEST_DATABASE_URL || "mongodb://localhost/test-blog-posts";
exports.PORT = process.env.PORT || 8080;


//TEST_DATABASE_URL=mongodb://adrianasu:8ur8ujitaM@ds141942.mlab.com:41942/test-blog-posts npm test

//DATABASE_URL=mongodb://adrianasu:8ur8ujitaM@ds239692.mlab.com:39692/blog-post-app npm start

