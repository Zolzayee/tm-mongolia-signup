// Toastmasters Mongolia: copies web sign-ups into the "Schedule" tab.
// Sign-ups win over names typed by hand. Runs on a time trigger (see steps).
var SIGNUP_URL = 'https://tm-mongolia-role-signup.netlify.app/api/signups?format=text&code=TM-36948';
var ROLES = {
  tm: 'Toastmaster', warm: 'Warm-up Master', word: 'Word Master', tt: 'Table Topics Master',
  ge: 'General Evaluator', ah: 'Ah-Counter', gram: 'Grammarian', timer: 'Timer',
  joke: 'Joke Master', sp1: 'Speaker 1', ev1: 'Evaluator 1', sp2: 'Speaker 2',
  ev2: 'Evaluator 2', sp3: 'Speaker 3', ev3: 'Evaluator 3', backup: 'Back-up'
};
var MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

function syncSignups() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Schedule');
  var res = UrlFetchApp.fetch(SIGNUP_URL, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('Sign-up site returned ' + res.getResponseCode());

  var SIGN = {};
  res.getContentText().split('\n').forEach(function (line) {
    var p = line.split('\t');
    if (p.length === 2 && p[1].trim()) SIGN[p[0].trim()] = p[1].trim();
  });

  var props = PropertiesService.getScriptProperties();
  var PREV = JSON.parse(props.getProperty('prev') || '{}');

  var data = sh.getDataRange().getValues();
  var header = data[0].map(function (h) { return String(h).trim(); });
  var tz = ss.getSpreadsheetTimeZone();
  var rowByMD = {};
  for (var r = 1; r < data.length; r++) {
    var a = data[r][0], md = null;
    if (a instanceof Date) md = Utilities.formatDate(a, tz, 'MM-dd');
    else {
      var m = String(a).match(/([A-Za-z]{3})[A-Za-z]*\.?\s+(\d{1,2})\s*$/);
      if (m && MONTHS.indexOf(m[1].toLowerCase()) >= 0) {
        var mo = MONTHS.indexOf(m[1].toLowerCase()) + 1;
        md = ('0' + mo).slice(-2) + '-' + ('0' + m[2]).slice(-2);
      }
    }
    if (md) rowByMD[md] = r;
  }

  function cellFor(key) {
    var parts = key.split('_');
    var r = rowByMD[parts[0].slice(5)];
    var c = header.indexOf(ROLES[parts[1]]);
    return (r === undefined || c < 0) ? null : { r: r, c: c };
  }

  var changes = 0;
  Object.keys(SIGN).forEach(function (key) {
    var pos = cellFor(key); if (!pos) return;
    if (String(data[pos.r][pos.c]).trim() !== SIGN[key]) {
      sh.getRange(pos.r + 1, pos.c + 1).setValue(SIGN[key]); changes++;
    }
  });
  Object.keys(PREV).forEach(function (key) {
    if (SIGN[key] !== undefined) return;            // still signed up
    var pos = cellFor(key); if (!pos) return;
    if (String(data[pos.r][pos.c]).trim() === PREV[key]) {   // cancelled: clear it
      sh.getRange(pos.r + 1, pos.c + 1).clearContent(); changes++;
    }
  });
  props.setProperty('prev', JSON.stringify(SIGN));
  Logger.log('Sync done, ' + changes + ' change(s)');
}
