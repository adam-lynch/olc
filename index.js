var replace = require('gulp-replace');
var escapeStringForRegex = require('escape-string-regexp');
var homographs = require('./homographs.json');

// haystack - {Array}
// Returns one item
var getRandomItem = function(haystack){
    return haystack[Math.round(Math.random() * (haystack.length - 1))];
};

// args - {Object}
//      :mode - (Optional) {String}. Defaults to `greek`.
//      :charactersToReplace - (Optional) {String}
module.exports = function(args) {
    args = args || {};
    args.mode = args.mode || 'greek';
    var charactersToReplace;

    if(args.charactersToReplace){
        charactersToReplace = args.charactersToReplace;

        if(typeof charactersToReplace === 'string'){
            charactersToReplace = charactersToReplace.split('');
        }

        // discard unsupported characters
        charactersToReplace = charactersToReplace.filter(function(character){
            return !!homographs[character];
        });
    }
    else {
        if (args.mode === 'greek') {
            return replace(';', homographs[';'][0]);
        }

        var replaceableCharacters = Object.keys(homographs);
        if (args.mode === 'one') {
            charactersToReplace = [getRandomItem(replaceableCharacters)];
        }
        else if (args.mode === 'all') {
            charactersToReplace = replaceableCharacters;
        }
    }

    // build regular expression from the characters (escaped) which would match any
    var search = new RegExp(charactersToReplace.map(escapeStringForRegex).join('|'), 'g');
    // hand off the real work to gulp-replace (and replaceable-stream)
    return replace(search, function(characterToReplace){
        // if the character has multple homoglyphs, take one at random (per occurrence)
        return getRandomItem(homographs[characterToReplace].split(''), true);
    });
};