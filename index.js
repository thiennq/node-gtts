const request = require('request');
const escapeStringRegexp = require('escape-string-regexp');
const async = require('async');
const fs = require('fs');
const MultiStream = require('multistream');
const fakeUa = require('fake-useragent');

const GOOGLE_TTS_URL = 'http://translate.google.com/translate_tts';
const MAX_CHARS = 100;
const LANGUAGES = {
  'af': 'Afrikaans',
  'sq': 'Albanian',
  'ar': 'Arabic',
  'hy': 'Armenian',
  'ca': 'Catalan',
  'zh': 'Chinese',
  'zh-cn': 'Chinese (Mandarin/China)',
  'zh-tw': 'Chinese (Mandarin/Taiwan)',
  'zh-yue': 'Chinese (Cantonese)',
  'hr': 'Croatian',
  'cs': 'Czech',
  'da': 'Danish',
  'nl': 'Dutch',
  'en': 'English',
  'en-au': 'English (Australia)',
  'en-uk': 'English (United Kingdom)',
  'en-us': 'English (United States)',
  'eo': 'Esperanto',
  'fi': 'Finnish',
  'fr': 'French',
  'de': 'German',
  'el': 'Greek',
  'ht': 'Haitian Creole',
  'hi': 'Hindi',
  'hu': 'Hungarian',
  'is': 'Icelandic',
  'id': 'Indonesian',
  'it': 'Italian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'la': 'Latin',
  'lv': 'Latvian',
  'mk': 'Macedonian',
  'no': 'Norwegian',
  'pl': 'Polish',
  'pt': 'Portuguese',
  'pt-br': 'Portuguese (Brazil)',
  'ro': 'Romanian',
  'ru': 'Russian',
  'sr': 'Serbian',
  'sk': 'Slovak',
  'es': 'Spanish',
  'es-es': 'Spanish (Spain)',
  'es-us': 'Spanish (United States)',
  'sw': 'Swahili',
  'sv': 'Swedish',
  'ta': 'Tamil',
  'th': 'Thai',
  'tr': 'Turkish',
  'vi': 'Vietnamese',
  'cy': 'Welsh'
}

var lang, debug;

function Text2Speech(_lang, _debug) {
  lang = _lang || 'en';
  debug = _debug || false;
  lang = lang.toLowerCase();

  if (!LANGUAGES[lang])
    throw new Error('Language not supported: ' + lang);

  return {
    tokenize: tokenize,
    stream: function(text) {
      var text_parts = tokenize(text);
      var total = text_parts.length;

      return MultiStream(text_parts.map(function(part, index) {
        var headers = getHeader();
        var args = getArgs(part, index, total);
        var fullUrl = GOOGLE_TTS_URL + args

        if (debug) {
          console.log(fullUrl);
        }

        return request({
          uri: fullUrl,
          headers: headers,
          method: 'GET'
        });
      }));
    },

    save: function(filepath, text, callback) {
      var text_parts = tokenize(text);
      var total = text_parts.length;
      async.eachSeries(text_parts, function(part, cb) {
        var index = text_parts.indexOf(part);
        var headers = getHeader();
        var args = getArgs(part, index, total);
        var fullUrl = GOOGLE_TTS_URL + args;

        if (debug) {
          console.log(fullUrl);
        }

        var writeStream = fs.createWriteStream(filepath, {
          flags: index > 0 ? 'a' : 'w'
        });
        request({
            uri: fullUrl,
            headers: headers,
            method: 'GET'
          })
          .pipe(writeStream);
        writeStream.on('finish', cb);
        writeStream.on('error', cb);
      }, callback);
    }

  }
}

function getHeader() {
  var headers = {
    "User-Agent": fakeUa()
  };
  console.log('headers', headers);
  return headers;
}

function getArgs(text, index, total) {
  console.log('getArgs', text, index, total);
  var textlen = text.length;
  var encodedText = encodeURIComponent(text);
  var language = lang || 'en';
  return `?ie=UTF-8&tl=${language}&q=${encodedText}&total=${total}&idx=${index}&client=tw-ob&textlen=${textlen}`
}

function tokenize(text) {
  var text_parts = [];
  if (!text)
    throw new Error('No text to speak');

  var punc = '¡!()[]¿?.,;:—«»\n ';
  var punc_list = punc.split('').map(function(char) {
    return escapeStringRegexp(char);
  });

  var pattern = punc_list.join('|');
  var parts = text.split(new RegExp(pattern));
  parts = parts.filter(p => p.length > 0);

  var output = [];
  var i = 0;
  for (let p of parts) {
    if (!output[i]) {
      output[i] = '';
    }
    if (output[i].length + p.length < MAX_CHARS) {
      output[i] += ' ' + p;
    } else {
      i++;
      output[i] = p;
    }
  }
  output[0] = output[0].substr(1);
  return output;
}

module.exports = Text2Speech;
