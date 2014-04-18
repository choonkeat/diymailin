var service = require('../service');
var events = require('events');
var streamBuffers = require("stream-buffers");

describe('service', function() {
  var old_url = 'old url';
  var new_url = 'new url';
  var old_email = 'exist@example.com';
  var new_email = 'new@example.com';
  var smtp_request = {
    to: [old_email],
    accept: function() {},
    reject: function() {}
  };
  beforeEach(function() {
    service.config_file = '/dev/null';
    service.email_url_map = {};
    service.email_url_map[old_email] = old_url;
  });
  describe('#req2url', function() {
    it('should return url for exact string', function() {
      expect(service.req2url({to: [old_email]})).toBe(old_url);
    });
    it('should return url for space padded string', function() {
      expect(service.req2url({to: [' ' + old_email + ' ']})).toBe(old_url);
    });
    it('should return url for different-case string', function() {
      expect(service.req2url({to: [old_email.toUpperCase()]})).toBe(old_url);
    });
    it('should return undefined for different string', function() {
      expect(service.req2url({to: [old_email + '~']})).toBe(undefined);
    });
  });

  describe('#onSMTP', function() {
    it('should accept smtp request when webhook is successful', function() {
      var accepted = false;
      var ev = new events.EventEmitter();
      var buffer = new streamBuffers.WritableStreamBuffer();
      spyOn(service.request, 'post').andCallFake(function() { console.log('calling', arguments); return ev; });
      spyOn(smtp_request, 'accept').andCallFake(function() { accepted = true; });
      runs(function() {
        service.onSMTP(smtp_request, buffer);
        ev.response = { statusCode: 200 };
        ev.emit('end');
      })
      waitsFor(function() { return accepted; }, 'smtp request should be accepted', 1);
    });
    it('should reject smtp request when webhook is error', function() {
      var rejected_with_error_message = false;
      var err_message = 'boo';
      var ev = new events.EventEmitter();
      var buffer = new streamBuffers.WritableStreamBuffer();
      spyOn(service.request, 'post').andCallFake(function() { console.log('calling', arguments); return ev; });
      spyOn(smtp_request, 'reject').andCallFake(function(txt) { rejected_with_error_message = (txt == err_message); });
      runs(function() {
        service.onSMTP(smtp_request, buffer);
        ev.response = { statusCode: 500 };
        ev.emit('end', err_message);
      })
      waitsFor(function() { return rejected_with_error_message; }, 'smtp request should be rejected with explicit error', 1);
    });
    // un-matched email would not trigger onSMTP
  });

  describe('#onHTTP', function() {
    it('should add key pair if none exist', function() {
      var bool = false;
      expect(service.email_url_map[new_email]).toBe(undefined);
      runs(function() {
        service.onHTTP(new_email, new_url, function() { bool = true; });
      });
      waitsFor(function() {
        if (bool) expect(service.email_url_map[new_email]).toBe(new_url);
        return bool;
      }, 'email_url_map should add new key-value pair', 1);
    });
    it('should update key pair if key exist', function() {
      var bool = false;
      expect(service.email_url_map[old_email]).toBe(old_url);
      runs(function() {
        service.onHTTP(old_email, new_url, function() { bool = true; });
      });
      waitsFor(function() {
        if (bool) expect(service.email_url_map[old_email]).toBe(new_url);
        return bool;
      }, 'email_url_map should update key-value pair', 1);
    });
    it('should delete key pair if value is falsey', function() {
      var bool = false;
      expect(service.email_url_map[old_email]).toBe(old_url);
      runs(function() {
        service.onHTTP(old_email, '', function() { bool = true; });
      });
      waitsFor(function() {
        if (bool) expect(service.email_url_map[old_email]).toBe(undefined);
        return bool;
      }, 'email_url_map should delete key', 1);
    });
  });
});
