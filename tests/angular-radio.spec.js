'use strict'

describe('ngRadio', function() {
  var $radioChannel, $radio;

  beforeEach(module('ngRadio'));
  beforeEach(inject(function(_$radioChannel_, _$radio_){
    $radioChannel = _$radioChannel_;
    $radio = _$radio_;
  }));

  describe('$radioChannel', function() {
    var radioChannel;

    beforeEach(function() {
      radioChannel = new $radioChannel();
    });

    describe('#constructor()', function() {

      it('should assign new channel uid to insatnce', function() {
        expect(/^c_\d+$/.test(radioChannel.__uid)).toBe(true);
        expect(typeof radioChannel.__uid).toBe('string');
      })
    });

    describe('#listenTo()', function() {

      it('should assign listener to desired channel\'s event list', function() {
        var didItWork = false;
        radioChannel.listenTo('jasmine', 'test:event', function() {
          didItWork = true;
        });
        $radio.triggerChannel('jasmine', 'test:event');
        expect(didItWork).toBe(true);
      });

      it('should assign context to desired event', function() {
        var didItWork = false;
        radioChannel.listenTo('jasmine', 'test:event', function() {
          didItWork = this;
        }, 'you bet it did!');
        $radio.triggerChannel('jasmine', 'test:event');
        expect(didItWork).toBe('you bet it did!');
      });
    });

    describe('#listenToOnce()', function() {

      it('should assign listener to desired channel\'s event list one time', function() {
        var valueShouldBeOne = 0, valueShouldBeTwo = 0;
        radioChannel.listenToOnce('jasmine', 'test:event', function() {
          valueShouldBeOne++;
        });
        radioChannel.listenTo('jasmine', 'test:event', function() {
          valueShouldBeTwo++;
        });
        $radio.triggerChannel('jasmine', 'test:event');
        $radio.triggerChannel('jasmine', 'test:event');
        expect(valueShouldBeOne).toBe(1);
        expect(valueShouldBeTwo).toBe(2);
      });

      it('should assign context to desired event', function() {
        var didItWork = false;
        radioChannel.listenToOnce('jasmine', 'test:event', function() {
          didItWork = this;
        }, 'you bet it did!');
        $radio.triggerChannel('jasmine', 'test:event');
        expect(didItWork).toBe('you bet it did!');
      });
    });

    describe('#off()', function() {

      it('should remove events from listener category', function() {
        var valueShouldBeOne = 0, valueShouldBeTwo = 0;
        radioChannel.on({
          "test:event": function() { valueShouldBeOne++; },
          "test:another:event": function() { valueShouldBeTwo++; }
        });
        radioChannel.trigger('test:event test:another:event');
        radioChannel.off('test:event');
        radioChannel.trigger('test:event test:another:event');
        expect(valueShouldBeOne).toBe(1);
        expect(valueShouldBeTwo).toBe(2);
      });

      it('should remove event if callback')
    });
  });

  describe('$radio', function() {

    it('should be extended from $radioChannel', function() {
      angular.forEach($radioChannel.prototype, function(method, property) {
        expect($radio[property]).toBe(method);
      });
    });

    describe('#channel()', function() {

      it('should return singleton for desired radio channel', function() {
        var channel = $radio.channel('jasmine'),
            anotherChannel = $radio.channel('enimsaj'),
            sameChannel = $radio.channel('jasmine');
        expect(!!(channel && anotherChannel && sameChannel)).toBe(true);
        expect(channel).not.toBe(anotherChannel);
        expect(channel).toBe(sameChannel);
      });
    });

    describe('#removeChannel()', function() {

      it('should delete channel from radioChannel cache', function() {
        var channelUid = $radio.channel('jasmine').__uid;
        expect(channelUid).toBe($radio.channel('jasmine').__uid);
        $radio.removeChannel('jasmine');
        expect(channelUid).not.toBe($radio.channel('jasmine').__uid);
      });
    });

    describe('#triggerChannel()', function() {

      it('should desired trigger channel w/ provided arguments', function() {
        var channel = $radio.channel('jasmine');
        spyOn(channel, 'trigger');
        $radio.triggerChannel('jasmine', 'test:event', 1, void 0, "HAI", [], {});
        expect(channel.trigger).toHaveBeenCalledWith('test:event', 1, void 0, "HAI", [], {});
      });
    });
  });
});