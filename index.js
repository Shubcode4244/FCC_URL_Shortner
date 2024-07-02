require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

let uri = 'mongodb+srv://shubhamsahoo831:CZaHTGWFm5yclDtY@cluster01.f7l4oti.mongodb.net/urls';

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let urlSchema = new mongoose.Schema({
  original: { type: String, required: true },
  short: Number,
});

let Url = mongoose.model('Url', urlSchema);

app.post('/api/shorturl', async (req, res) => {
  let inputurl = req.body.url;

  let urlRegex = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi);
  if(!inputurl.match(urlRegex)){
    res.json({error:'Invalid URL'})
    return
  }

  let obj = { original_url: inputurl };

  try {
    let result = await Url.findOne().sort({ short: 'desc' }).exec();
    let inputShort = result ? result.short + 1 : 1;

    let data = await Url.findOneAndUpdate(
      { original: inputurl },
      { original: inputurl, short: inputShort },
      { new: true, upsert: true }
    ).exec();

    obj['short_url'] = data.short;
    res.json(obj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/shorturl/:input', async (req, res) => {
  let input = req.params.input;

  try {
    let result = await Url.findOne({ short: input }).exec();
    if (result) {
      res.redirect(result.original);
    } else {
      res.json({ error: 'URL not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
