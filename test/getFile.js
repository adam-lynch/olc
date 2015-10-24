var globToVinyl = require('glob-to-vinyl');
var File = require('vinyl');
var fs = require('fs');

// args - {Object}
//      :filename - {String}
//      :isFixture - {Boolean}
//      :asStream - {Boolean}
// callback - {Function}. Will be called with an {Error} (or null) and the file vinyl {Object}
module.exports = function(args, callback){
    var parentDirectory = 'test/' + (args.isFixture ? 'fixtures' : 'expected');
    var filepath = parentDirectory + '/' + args.filename;

    if(args.asStream){
        callback(null, new File({
            path: filepath,
            cwd: 'test/',
            base: parentDirectory,
            contents: fs.createReadStream(filepath)
        }));
    }
    else {
        globToVinyl('./' + filepath, function(error, files){
            if(error){
                callback.apply(this, arguments);
            }
            else {
                callback(null, files[0]);
            }
        });
    }
};