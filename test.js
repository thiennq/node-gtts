var gtts = require('./index')('en', true);
var path = require('path');
var filepath = path.join(__dirname, 'i-love-you.wav');
gtts.save(filepath, 'I love you', function() {
  console.log('done');
})
