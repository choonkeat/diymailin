var fs = require('fs'),
    path = require('path'),
    request = require('request'),
    smtp = require('./smtp'),
    http = require('./http');

var config = process.env.CONFIG || process.env.TMPDIR + path.sep + 'config.json';
fs.readFile(config, function(err, data) {
  var whiteList = (data ? JSON.parse(data) : {});
  console.log("Loaded", config, whiteList);

  var url_for = function(req) {
    var url = null;
    var bare_addresses = [];
    for (var i in req.to) { bare_addresses.push(req.to[i].replace(/\+.+@/, '@')); } // array of emails with +label stripped out
    for (var email in whiteList) {
      url = whiteList[email];
      if (url && bare_addresses.indexOf(email) != -1) return url;
    }
  }

  smtp.start(process.env.SMTP_PORT, url_for, function(req, buffer) {
    var url = url_for(req);
    console.log('POST', url);
    var r = request.post(url);
    r.form().append('message', buffer.getContents());
    r.on('error', function(err) {
      req.reject(err);
      console.log("FAIL", url, err);
    });
    r.on('end', function(err) {
      if (! err) return req.accept();
      req.reject(err);
      console.log("FAIL", url, err);
    });
  });

  http.start(process.env.PORT, function(email, url, next) {
    whiteList[email.replace(/\+.+@/, '@')] = url;
    console.log("Writing", config, whiteList);
    fs.writeFile(config, JSON.stringify(whiteList, null, 2), next);
  });
});
