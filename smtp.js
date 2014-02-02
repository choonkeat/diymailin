var simplesmtp = require("simplesmtp"),
    streamBuffers = require("stream-buffers"),
    config = {
      requireAuthentication: false,
      enableAuthentication: false,
      timeout: 30000,
      disableEHLO: true,
      disableDNSValidation: true,
      SMTPBanner: "server"
    };

module.exports = {
  start: function(smtpPort, allowing, callback) {
    smtpPort = smtpPort || 25;
    allowing = allowing || function() { };
    simplesmtp.createSimpleServer(config, function(request) {
      if (allowing(request)) {
        console.log((new Date()) + "\tGOOD\t" + request.remoteAddress + "\t" + request.from + "\t" + request.to.join(' '));
        var buffer = new streamBuffers.WritableStreamBuffer({
            initialSize: (100 * 1024),   // start as 100 kilobytes.
            incrementAmount: (10 * 1024) // grow by 10 kilobytes each time buffer overflows.
        });
        request.pipe(buffer);
        request.on("end", function() {
          callback(request, buffer);
        });
      } else {
        console.log((new Date()) + "\tFAIL\t" + request.remoteAddress + "\t" + request.from + "\t" + request.to.join(' '));
        request.reject();
      }
    }).listen(smtpPort, '0.0.0.0', function(err) {
      console.log('SMTP server on 0.0.0.0:' + smtpPort, err || "");
    });
  }
}
