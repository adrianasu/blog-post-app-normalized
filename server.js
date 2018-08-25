const express = require('express');
const morgan = require('morgan');

const app = express();

const getPostRouter = require('./getPostRouter');
const putDeleteRouter = require('./putDeleteRouter');

app.use(morgan('common'));
app.use(express.json());

app.use('/blog-posts', getPostRouter);
app.use('/blog-posts/:id', putDeleteRouter);

app.listen(process.env.PORT || 8080, () => {
    console.log(`Your app is listening on port ${process.env.PORT || 8080}`);
});