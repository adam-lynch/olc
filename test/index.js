'use strict';

var concatStream = require('concat-stream');
var should = require('should');
var sets = require('simplesets');
var olc = require('../');
var getFile = require('./getFile');
var homographs = require('../homographs.json');

describe('olc', function() {

    it('should replace characters on a stream', function(done) {
        var filename = 'greek.js';

        getFile({
            filename: filename,
            isFixture: true,
            asStream: true
        }, function(error, file){
            if(error){
                return done(error);
            }

            var stream = olc();

            stream.on('data', function (newFile) {
                should.exist(newFile);
                should.exist(newFile.contents);

                newFile.contents.pipe(concatStream({encoding: 'string'}, function (data) {
                    getFile({
                        filename: filename
                    }, function(error, expectedFile){
                        if(error){
                            return done(error);
                        }

                        data.should.equal(expectedFile.contents.toString('utf8'));
                        done();
                    });
                }));
            });

            stream.write(file);
            stream.end();
        });
    });

    it('should replace characters on a buffer', function(done) {
        var filename = 'greek.js';

        getFile({
            filename: filename,
            isFixture: true
        }, function(error, file) {
            if (error) {
                return done(error);
            }

            var stream = olc();

            stream.on('data', function (newFile) {
                should.exist(newFile);
                should.exist(newFile.contents);

                getFile({
                    filename: filename
                }, function (error, expectedFile) {
                    if (error) {
                        return done(error);
                    }

                    newFile.contents.toString('utf8').should.equal(expectedFile.contents.toString('utf8'));
                    done();
                });
            });

            stream.write(file);
            stream.end();
        });
    });

    it("should replace given letters (as a string) if they're applicable", function(done) {
        var filename = 'brackets.js';

        getFile({
            filename: filename,
            isFixture: true
        }, function(error, file) {
            if (error) {
                return done(error);
            }

            var stream = olc({
                mode: 'one', // should be ignored
                charactersToReplace: '()e'
            });

            stream.on('data', function (newFile) {
                should.exist(newFile);
                should.exist(newFile.contents);

                getFile({
                    filename: filename
                }, function (error, expectedFile) {
                    if (error) {
                        return done(error);
                    }

                    newFile.contents.toString('utf8').should.equal(expectedFile.contents.toString('utf8'));
                    done();
                });
            });

            stream.write(file);
            stream.end();
        });
    });

    it("should replace given letters (as an array) if they're applicable", function(done) {
        var filename = 'brackets.js';

        getFile({
            filename: filename,
            isFixture: true
        }, function(error, file) {
            if (error) {
                return done(error);
            }

            var stream = olc({
                mode: 'one', // should be ignored
                charactersToReplace: ['(', ')', 'e']
            });

            stream.on('data', function (newFile) {
                should.exist(newFile);
                should.exist(newFile.contents);

                getFile({
                    filename: filename
                }, function (error, expectedFile) {
                    if (error) {
                        return done(error);
                    }

                    newFile.contents.toString('utf8').should.equal(expectedFile.contents.toString('utf8'));
                    done();
                });
            });

            stream.write(file);
            stream.end();
        });
    });

    it("should replace one random homograph", function(done) {
        var filename = 'everything.js';

        getFile({
            filename: filename,
            isFixture: true
        }, function(error, file) {
            if (error) {
                return done(error);
            }

            var fixtureCharactersSet = new sets.Set(file.contents.toString('utf8').split(''));
            var stream = olc({
                mode: 'one'
            });

            stream.on('data', function (newFile) {
                should.exist(newFile);
                should.exist(newFile.contents);

                var newCharactersSet = new sets.Set(newFile.contents.toString('utf8').split(''));
                var replacedCharactersSet = fixtureCharactersSet.difference(newCharactersSet);

                // There should only be one character from the original file missing in the new file
                replacedCharactersSet.array().length.should.equal(1);

                var replacedCharacter = replacedCharactersSet.array()[0];
                var addedCharacters = newCharactersSet.difference(fixtureCharactersSet).array();

                // added files should be homographs of replaced character
                addedCharacters.filter(function(character){
                    return homographs[replacedCharacter].indexOf(character) > -1
                }).length.should.equal(addedCharacters.length);
                done();
            });

            stream.write(file);
            stream.end();
        });
    });

    it("should replace all homographs", function(done) {
        var filename = 'everything.js';

        getFile({
            filename: filename,
            isFixture: true
        }, function(error, file) {
            if (error) {
                return done(error);
            }

            var fixtureCharactersSet = new sets.Set(file.contents.toString('utf8').split(''));
            var stream = olc({
                mode: 'all'
            });

            stream.on('data', function (newFile) {
                should.exist(newFile);
                should.exist(newFile.contents);

                var newCharactersSet = new sets.Set(newFile.contents.toString('utf8').split(''));
                var replacedCharactersSet = fixtureCharactersSet.difference(newCharactersSet);

                // All homographs we have should've been replaced
                replacedCharactersSet.array().length.should.equal(Object.keys(homographs).length);

                var addedCharacters = newCharactersSet.difference(fixtureCharactersSet).array();

                // get all possible characters which could be added
                var possibleSubstitutions = Object.keys(homographs)
                    .map(function(character) {
                        return homographs[character];
                    })
                    .reduce(function(charactersA, charactersB){
                        return charactersA + charactersB;
                    }, '').split('');

                // added files should be homographs of replaced character
                addedCharacters.filter(function(character){
                    return possibleSubstitutions.indexOf(character) > -1
                }).length.should.equal(addedCharacters.length);

                done();
            });

            stream.write(file);
            stream.end();
        });
    });

    it('should trigger events on a stream', function(done) {
        getFile({
            filename: 'greek.js',
            isFixture: true,
            asStream: true
        }, function(error, file) {
            if(error){
                return done(error);
            }

            var stream = olc()
                .on('finish', function() {
                    // No assertion required, we should end up here, if we don't the test will time out
                    done();
                });

            stream.write(file);
            stream.end();
        });
    });
});