let Tail = require('tail').Tail;
let request = require('request');
let util = require('util');
let EventEmitter = require('events').EventEmitter;
let Registry = require('winreg');
let fs = require('fs');

class Tracker {

  constructor(debug) {
    this.debug = debug ? true : false;
  }

  findLog(cb) {
    switch (process.platform) {
      case 'linux':
        cb(process.env['HOME'] + '/.config/unity3d/Audiosurf, LLC/Audiosurf 2/Player.log');
        break;
      case 'darwin':
        cb(process.env['HOME'] + '/Library/Logs/Unity/Player.log');
        break;
      case 'win32':
        key = new Registry({
          hive: Regsitry.HKLM,
          key: '\\SOFTWARE\\WOW6432Node\\Valve\\Steam'
        });
        key.get('InstallPath', (err, item) => {
          steamPath = item.value;
          libraryFolders = [steamPath];
          libraryFile = steamPath + '\\steamapps\\libraryfolders.vdf';
          libraryPattern = /^\s+\"\d+\"\s+\"(.+)\"$/;
          try {
            data = fs.readFileSync(libraryFile, 'UTF-8');
            for (var line in data.replace(/\r/g, '').split('\n')) {
              match = libraryPattern.exec(line);
              if (match != null) {
                libraryFolders.push(match[1]);
              }
            }
          } catch (e) {} // Ignore exception

          for (var dir in libraryFolders) {
            try {
              fs.stat(dir + '\\steamapps\\appmanifest_235800.acf', function(err, stats) {
                cb(dir + '\\steamapps\\common\\Audiosurf 2\\Audiosurf2_Data\\output_log.txt');
              });
            } catch (e) {} // Ignore exception
          }
        });
        break;
    }
  }
  
  init(logPath) {
    this._tail = new Tail(logPath);
    this._tail.on('line', this._handleLine.bind(this));
  }

  start() {
    this._tail.watch();
  }

  stop() {
    this._tail.unwatch();
  }

  _handleLine(line) {
    var match;
    if (match = /^sending score\. title:(.+) duration:(.+) artist:(.*)$/.exec(line)) {
      this._postSong(match[1], match[2], match[3]);
    }
  }

  _postSong(title, duration, artist) {
    request.post('http://as2tracker.com/input_script.php', {
      form: {
        title: title,
        duration: duration,
        artist: artist
      }
    }, (error, response, body) => {
      if (error)  {
        this.emit('error', 'post_fail', error);
      }
      else {
        this.emit('post_sent', title, artist, ''); // TODO: Get songId
      }
    });
  }
}
util.inherits(Tracker, EventEmitter);
exports.Tracker = Tracker;
