'use strict'

describe('ngRadio', function() {
  var $radio;

  beforeEach(module('ngRadio'));
  beforeEach(inject(function(_$radio_){
    $radio = _$radio_;
  }));

  describe('$radio', function() {

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

  });

});