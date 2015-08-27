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

      it('should return current instance', function() {
        expect(radioChannel.listenTo()).toBe(radioChannel);
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

      it('should return current instance', function() {
        expect(radioChannel.listenToOnce()).toBe(radioChannel);
      });
    });

    describe('#off()', function() {

      it('should remove single event from listener category', function() {
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

      it('should remove all events', function() {
        var valueShouldBeThree = 0;
        radioChannel.on('one two three four', function(n) {
          valueShouldBeThree += n;
        });
        radioChannel.trigger('one two three', 1);
        radioChannel.off();
        radioChannel.trigger('one two three four', 1);
        expect(valueShouldBeThree).toBe(3);
      });

      it('should remove event with provided callback', function() {
        var valueShouldBeTwo = 0;
        function callback() {
          valueShouldBeTwo++;
        }
        radioChannel.on('add:one', callback);
        radioChannel.on('add:another:one', callback);
        radioChannel.on('add:one', function(n) {
          if (n) {
            valueShouldBeTwo -= n;
          }
        });
        radioChannel.trigger('add:one');
        radioChannel.trigger('add:another:one');
        expect(valueShouldBeTwo).toBe(2);
        radioChannel.off('add:one', callback);
        radioChannel.trigger('add:one', 1);
        radioChannel.trigger('add:another:one');
        expect(valueShouldBeTwo).toBe(2);
      });

      it('should return current instance', function() {
        expect(radioChannel.off()).toBe(radioChannel);
      });
    });

    describe('#on()', function() {

      it('should assign context to callback event', function() {
        var value = { ShouldBeOne: 0 };
        radioChannel.on('test:event', function() {
          this.ShouldBeOne++;
        }, value);
        expect(value.ShouldBeOne).toBe(0);
        radioChannel.trigger('test:event');
        expect(value.ShouldBeOne).toBe(1);
      });

      it('should store callback properties to event list', function() {
        var callback = function() { return; }, context = 'this', listenerId = '123asd';
        radioChannel.on('test:event', callback, context, listenerId);
        var e = radioChannel.__events['test:event'][0];
        expect(e.callback).toBe(callback);
        expect(e.context).toBe(context);
        expect(e.listener).toBe(listenerId);
      });

      it('should return current instance', function() {
        expect(radioChannel.on()).toBe(radioChannel);
      });
    });

    describe('#once()', function() {

      it('should tag callback to only be triggerd once', function() {
        function callback() { return; }
        radioChannel.once('test:event', callback);
        expect(callback.__once).toBe(true);
      });

      it('should call through #on() method with callback', function() {
        function callback() { return; }
        spyOn(radioChannel, 'on');
        radioChannel.once('test:event', callback);
        expect(radioChannel.on).toHaveBeenCalledWith('test:event', callback);
      });

      it('should return current instance', function() {
        expect(radioChannel.once()).toBe(radioChannel);
      });
    });

    describe('#reply()', function() {

      it('should add item to internal request list', function() {
        var thing = 'new instance';
        radioChannel.reply('some:name', thing);
        expect(radioChannel.__items['some:name'].value).toBe(thing);
      });

      it('should add multiple items via object literal', function() {
        var itemsToBeAdded = {
          "one": "test",
          "two": {"test": 2},
          "three": function() { return "test"; }
        };
        radioChannel.reply(itemsToBeAdded);
        expect(radioChannel.__items['one'].value).toBe(itemsToBeAdded.one);
        expect(radioChannel.__items['two'].value).toBe(itemsToBeAdded.two);
        expect(radioChannel.__items['three'].value).toBe(itemsToBeAdded.three);
      });

      it('should return current instance', function() {
        expect(radioChannel.reply()).toBe(radioChannel);
      });
    });

    describe('#replyOnce()', function() {

      it('should add once setting to each item', function() {
        var item = 'item';
        radioChannel.replyOnce('some:name', item);
        expect(radioChannel.__items['some:name'].__once).toBe(true);
        radioChannel.replyOnce({
          'one': 'test1',
          'two': 'test2'
        });
        expect(radioChannel.__items['one'].__once).toBe(true);
        expect(radioChannel.__items['two'].__once).toBe(true);
      });

      it('should return current instance', function() {
        expect(radioChannel.replyOnce()).toBe(radioChannel);
      });
    });

    describe('#reset()', function() {

      it('should clear channel events list', function() {
        radioChannel.on('some:event', function() {
          return;
        });
        expect('some:event' in radioChannel.__events).toBe(true);
        radioChannel.reset();
        expect(radioChannel.__events).toEqual({});
      });

      it('should clear channel items list', function() {
        var thing = 'test';
        radioChannel.reply('some:name', thing);
        expect('some:name' in radioChannel.__items).toBe(true);
        expect(radioChannel.request('some:name')).toBe(thing);
        radioChannel.reset();
        expect('some:name' in radioChannel.__items).toBe(false);
        expect(radioChannel.request('some:name')).toBe(void 0);
      });

      it('should return current instance', function() {
        expect(radioChannel.reset()).toBe(radioChannel);
      });
    });

    describe('#request()', function() {

      it('should get item by provided name', function() {
        var value = 1;
        radioChannel.reply('test', value);
        expect(radioChannel.request('test')).toBe(value);
      });

      it('should retrieve items only once if taged to do so', function() {
        var value = 1;
        radioChannel.replyOnce('test', value);
        expect(radioChannel.request('test')).toBe(value);
        expect(radioChannel.request('test')).toBe(void 0);
      });
    });

    describe('#setContext()', function() {

      it('should reassign internal context property', function() {
        var context = 'test';
        radioChannel.setContext(context);
        expect(radioChannel.__context).toBe(context);
      });

      it('should return current instance', function() {
        expect(radioChannel.setContext()).toBe(radioChannel);
      });
    });

    describe('#stopListening', function() {

      it('should remove listeners from remote channel', function() {
        var valueShouldBeOne = 0;
        radioChannel.listenTo('anotherChannel', 'some:event', function() {
          valueShouldBeOne++;
        });
        $radio.channel('anotherChannel').trigger('some:event');
        expect(valueShouldBeOne).toBe(1);
        radioChannel.stopListening('anotherChannel');
        $radio.channel('anotherChannel').trigger('some:event');
        expect(valueShouldBeOne).toBe(1);
      });

      it('should remove listeners from channel via event name', function() {
        var valueShouldBeTwo = 0;
        function callback() { valueShouldBeTwo++; }
        radioChannel.listenTo('anotherChannel', 'some:event', callback);
        radioChannel.listenTo('anotherChannel', 'some:other:event', callback);
        $radio.channel('anotherChannel').trigger('some:event');
        expect(valueShouldBeTwo).toBe(1);
        radioChannel.stopListening('anotherChannel', 'some:event');
        $radio.channel('anotherChannel').trigger('some:event');
        expect(valueShouldBeTwo).toBe(1);
        $radio.channel('anotherChannel').trigger('some:other:event');
        expect(valueShouldBeTwo).toBe(2);
      });

      it('should stop listening to all channels', function() {
        var valueShouldBeTwo = 0;
        function callback() { valueShouldBeTwo++; }
        radioChannel.listenTo('someChannel', 'some:event', callback);
        radioChannel.listenTo('anotherChannel', 'some:event', callback);
        $radio.channel('someChannel').trigger('some:event');
        $radio.channel('anotherChannel').trigger('some:event');
        expect(valueShouldBeTwo).toBe(2);
        radioChannel.stopListening();
        $radio.channel('someChannel').trigger('some:event');
        $radio.channel('anotherChannel').trigger('some:event');
        expect(valueShouldBeTwo).toBe(2);
      });

      it('should return current instance', function() {
        expect(radioChannel.stopListening()).toBe(radioChannel);
      });
    });

    describe('#trigger()', function() {

      it('should invoke desired callback', function() {
        var valueShouldBeOne = 0;
        function callback() { valueShouldBeOne++ }
        radioChannel.on('test', callback);
        radioChannel.trigger('test');
        expect(valueShouldBeOne).toBe(1);
      });

      it('should invoke desired callback with argument list', function() {
        var valueShouldBeTen = 0;
        function callback(a, b) { valueShouldBeTen += a * b; }
        radioChannel.on('test', callback);
        radioChannel.trigger('test', 2, 5);
        expect(valueShouldBeTen).toBe(10);
      });

      it('should remove callbacks it tagged to only fire once', function() {
        var valueShouldBeTen = 0;
        function callback(a, b) { valueShouldBeTen += a * b; }
        radioChannel.once('test', callback);
        radioChannel.trigger('test', 2, 5);
        expect(valueShouldBeTen).toBe(10);
        radioChannel.trigger('test', 10, 15);
        expect(valueShouldBeTen).toBe(10);
      });

      it('should return current instance', function() {
        expect(radioChannel.trigger()).toBe(radioChannel);
      });
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

      it('should return current instance', function() {
        expect($radio.removeChannel()).toBe($radio);
      });
    });

    describe('#triggerChannel()', function() {

      it('should desired trigger channel w/ provided arguments', function() {
        var channel = $radio.channel('jasmine');
        spyOn(channel, 'trigger');
        $radio.triggerChannel('jasmine', 'test:event', 1, void 0, "HAI", [], {});
        expect(channel.trigger).toHaveBeenCalledWith('test:event', 1, void 0, "HAI", [], {});
      });

      it('should return current instance', function() {
        expect($radio.triggerChannel()).toBe($radio);
      });
    });
  });
});