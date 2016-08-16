var Tracker = require('./tracker.js');

var tracker = new Tracker()

tracker.on('post_sent', function(title, artist, songId) {
    console.log('Score sent for ' + title + ' - ' + artist + ' http://as2tracker.com/song/' + songId);
});

/*tracker.findLog(function(path) {
  tracker.init(path);
});*/

tracker.init("C:/Program Files (x86)/Steam/steamapps/common/Audiosurf 2/Audiosurf2_Data/output_log.txt");
