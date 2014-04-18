var fs = require('fs'),
    http = require('http'),
    service = require('./service'),
    smtp = require('./smtp'),
    http = require('./http');

fs.readFile(service.config_file, function(err, data) {
  service.email_url_map = (data ? JSON.parse(data) : {});
  console.log("Loaded", service.config_file, service.email_url_map);

  smtp.start(process.env.SMTP_PORT, service.req2url.bind(service), service.onSMTP.bind(service));
  http.start(process.env.PORT, service.onHTTP.bind(service));
});
