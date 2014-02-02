var url = require('url');
var path = require('path');
var http = require('http');
var querystring = require('querystring');
var node_static = require('node-static');

function reply404(res) {
  res = res || this;
  res.writeHead(404, {'content-type': 'text/plain'});
  res.end();
}

module.exports = {
  start: function(httpPort, callback) {
    httpPort = httpPort || 3000;
    var static_directory = new node_static.Server(path.join(__dirname, 'public'));
    var server = http.createServer();
    server.addListener('request', function(req, res) {
      var uri = url.parse(req.url, !!'true:query as object');
      if (req.method == 'POST') {
        var content_type = (req.headers && req.headers['content-type'] || "");
        var content_length = +(req.headers && req.headers['content-length'] || 0);
        if (content_type.match(/www-form-urlencoded/i)) {
          var chunks = [];
          req.on('data', chunks.push.bind(chunks));
          req.on('end', callback ? function() {
            uri = querystring.parse(chunks.join("").toString());
            callback(uri.password, uri.email, uri.url, function(err) {
              res.writeHead(200, {'content-type': 'text/plain'});
              res.write(err || "Ok");
              res.end();
            });
          } : reply404.bind(res));
        } else {
          var chunks = [];
          req.on('data', chunks.push.bind(chunks));
          req.on('end', reply404.bind(res));
        }
      } else if (process.env.HIDE_FORM) {
        reply404(res);
      } else {
        static_directory.serve(req, res);
      }
    });

    server.listen(httpPort, '0.0.0.0', function(err) {
      console.log(  'HTTP server on 0.0.0.0:' + httpPort, err || "");
    });
  }
}
