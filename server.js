const express = require('express');
const morgan = require('morgan');

const app = express();

const postsRouter = require('./postsRouter');

app.use(morgan('common'));
app.use(express.json());

app.use('/blog-posts', postsRouter);

app.listen(process.env.PORT || 8080, () => {
    console.log(`Your app is listening on port ${process.env.PORT || 8080}`);
});