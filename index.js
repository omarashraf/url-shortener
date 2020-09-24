const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const yup = require('yup');
const bodyParser = require('body-parser');
const { nanoid } = require('nanoid');
const db = require('monk')('mongodb+srv://omarashraf:vfkgF2Kofup11kZX@url-shortener.e46hw.mongodb.net/url-shortener?retryWrites=true&w=majority')

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(cors());
// app.use(express.json());
app.set('views', './views');
app.set('view engine', 'pug');

const urlSchema = yup.object().shape({
    url: yup.string().required(),
    createdOn: yup.date().default(function () {
      return new Date();
    }),
});

const urls = db.get('urls');

app.get('/', function(req, res) {
    res.render('main', { title: 'Hey', message: 'Hello World!' });
});

// get the correct url for the provided shortened one
app.get('/:url', async function (req, res) {
    const url = await urls.find({ shortUrlId: req.params.url });
    if (url.length > 0) {
        res.redirect(url[0].url);
    } else {
        res.render('main', { error: 'not found' });
    }
});

// shorten given url
app.post('/', async function(req, res) {
    const valid = await urlSchema.isValid(req.body);
    if(!valid) {
        res.render('main', { error: 'please make sure you send \'url\' field' });
    }
    const url = await urls.find({ url: req.body.url });
    if (url.length == 0) {
        const shortUrlId = nanoid(7);
        const result = await urls.insert({ ...req.body, shortUrlId });
        if (result) {
            res.render('main', { reqUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}${shortUrlId}` });
        } else {
            res.render('main', { error: 'something wrong occured, please try again' });
        }
    } else {
        res.render('main', { reqUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}${url[0].shortUrlId}` });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Listerning on port 3000');
});