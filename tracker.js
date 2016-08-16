/*
tracker.js
*/

var Tail = require('tail').Tail;
var Request = require('request');
var EventEmitter = require('events').EventEmitter;
var Registry = require('winreg');
var util = require('util');
var fs = require('fs');

/*
Constructor
*/

var Tracker = function() {}

util.inherits(Tracker, EventEmitter);

/*
Methods
*/

Tracker.prototype.init = function (logPath) {
    this._tail = new Tail(logPath);

	// arrow functions are fine for binding lexically..
    this._tail.on('line', (line) => {
		this._handleLine(line);
	});

	console.log("Initialized tracker");
}

Tracker.prototype.findLog = function(cb) {
	switch (process.platform) {
		case 'linux':
			cb(process.env['HOME'] + '/.config/unity3d/Audiosurf, LLC/Audiosurf 2/Player.log');
			break;
		case 'darwin':
			cb(process.env['HOME'] + '/Library/Logs/Unity/Player.log');
			break;
		case 'win32':
			key = new Registry({
				hive: Registry.HKLM,
				key: '\\SOFTWARE\\WOW6432Node\\Valve\\Steam'
			});

			key.get('InstallPath', function(err, item) {
				var steamPath = item.value;
                cb(steamPath + '/steamapps/common/Audiosurf 2/Audiosurf2_Data/output_log.txt');
			});
			break;
	}
}

Tracker.prototype.start = function () {
    this._tail.watch();
}

Tracker.prototype.stop = function () {
    this._tail.watch();
}

/*
Helpers
*/

Tracker.prototype._handleLine = function (line) {
	var match = /^sending score\. title:(.+) duration:(.+) artist:(.*)$/.exec(line)

    //console.log(line)

	if (match != null) {
		this._postSong(match[1], match[2], match[3]);
	}
}

Tracker.prototype._postSong = function () {
	Request.post('http://as2tracker.com/input_script.php', {
		form: {
			title: title,
			duration: duration,
			artist: artist
		}
	}, function(error, response, body) {
		if (error)	{
			/*TODO: overhaul errorhandling*/
			this.emit('error', 'post_fail', error);
		}
		else {
			this.emit('post_sent', title, artist, ''); // TODO: Get songId
		}
	});
}

module.exports = Tracker;
