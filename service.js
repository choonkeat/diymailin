var fs = require('fs');
var http = require('http');
var path = require('path');

module.exports = {
  email_url_map: {},
  req2url: function(req) {
    var that = this;
    var url = null;
    var sanitized = [];
    for (var i in req.to) { sanitized.push(req.to[i].replace(/\+.+@/, '@').toLowerCase().trim()); } // array of emails with +label stripped out
    for (var index in sanitized) {
      url = that.email_url_map[sanitized[index]];
      if (url) return url;
    }
  },
  request: require('request'),
  onSMTP: function(req, buffer) {
    var that = this;
    var url = that.req2url(req);
    console.log('POST', url);
    var r = that.request.post(url, { form: { message: buffer.getContentsAsString("utf8") } });
    r.on('error', function(err) {
      req.reject(err);
      console.log("FAIL", url, err);
    });
    r.on('end', function(err) {
      statusCode = (this.response && this.response.statusCode);
      if (!err && statusCode >= 200 && statusCode <= 299) return req.accept();
      if (!err) err = http.STATUS_CODES[statusCode];
      req.reject(err);
      console.log("FAIL", url, err);
    });
  },

  config_file: process.env.CONFIG || process.env.TMPDIR + path.sep + 'config.json',
  onHTTP: function(email, url, next) {
    var that = this;
    var key = email.replace(/\+.+@/, '@').toLowerCase().trim();
    if (url) {
      that.email_url_map[key] = url;
    } else {
      delete that.email_url_map[key];
    }
    console.log("Writing", that.config_file, that.email_url_map);
    fs.writeFile(that.config_file, JSON.stringify(that.email_url_map, null, 2), next);
  }
}
