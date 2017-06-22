# node-gtts
Google Text-to-Speech for NodeJS (Unofficial API)

## How to install
```bash
npm install node-gtts
```

## How to use
```javascript
const gtts = require('node-gtts')('en');
gtts.save(filepath, 'your text', callback);


// pipe directly to router response
app.get('/speech', function(req, res) {
  res.set({'Content-Type': 'audio/mpeg'});
  gtts.stream(req.query.text).pipe(res);
})
```

## Example
```javascript
var gtts = require('node-gtts')('en');
var path = require('path');
var filepath = path.join(__dirname, 'i-love-you.wav');
gtts.save(filepath, 'I love you', function() {
  console.log('save done');
})
```
