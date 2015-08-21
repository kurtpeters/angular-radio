/*

  ngRadio

  $radio:

    channel - create (if doesn't exist) and return channel object

    +channel methods - $radio will inherit channel specific methods to use as GLOBAL events

    listenTo - listen to another channel.

    listenToOnce - listen to another channel only once.

    stopListening - stop listenting to a single channel or all of them.

  channel:

    on - listen to event. takes `name` and `callback`. on(string|object, function)

    once - listen to event only one time. takes `name` and `callback`. on(string|object, function)

    off - remove listener

    trigger - invoke events process with set of defined arguments. takes `name` and `argument list`. trigger(string, *...)

    setContext - set the context which will be bound to callbacks. default is the current channel.

    request - 

    reply - 

    replyOnce - 

    stopReplying -

    reset - destroy all handlers and requests from the channel. returns the channel.


    ////////// USAGE //////////

    var channel = radio.channel('current');

    ..., function($radio) {
    
      $radio.listenTo('settings', 'defaults:update', (response) => {
        console.log(response);
      });

    }

    ..., function($radio) {
  
      $radio.trigger('settings', defaults:update', {
        ...
      });

    }

*/

(function (root, factory) { 'use strict';

    if (typeof define === 'function' && define.amd) {
        define(['ngRadio'], factory);

    } else {
        root.ngRadio = factory(root.angular);
    }

}(this, function (angular) { 'use strict';

  var $radioChannels = {};

  function createUniqueId() {
    return 'c_' + new Date().getTime();
  }

  function getRadioChannel(namespace) {
    return $radioChannels[namespace] || ($radioChannels[namespace] = new $RadioChannel());
  }

  function getRelatedListeners(events, comparators) {
    var index = 0,
        relatedListenerIds = [],
        item;
    for (; index < events.length; index++) {
      item = events[index];
      if (item.callback === comparators.callback ||
          item.listener !== void 0 && item.listener === comparators.listener) {
        relatedListenerIds.push(index);
      }
    }
    return relatedListenerIds;
  }

/*=====================================
=            Channel Class            =
=====================================*/

  function $RadioChannel() {
    this.__context = this;
    this.__events = {};
    this.__items = {};
    this.__uid = createUniqueId();
  }

  angular.extend($RadioChannel.prototype, {

    "listenTo": function(namespace, category, callback, context) {
      var channel = getRadioChannel(namespace);
      channel.on(category, callback, context, this.__uid);
      return this;
    },

    "listenToOnce": function(namespace, category, callback, context) {
      var channel = getRadioChannel(namespace);
      channel.once(category, callback, context, this.__uid);
      return this;
    },

    "off": function(category, callback, listener) {
      var events = this.__events[category] || [],
          itemsToBeRemoved = [],
          index;

      if (category === void 0) {

        if (listener === void 0) {
          delete this.__events[category];
          return this;
        } 

        for (var eventCategory in this.__events) {
          events = this.__events[eventCategory];
          itemsToBeRemoved = getRelatedListeners(events, {
            callback: callback,
            listener: listener
          });
          index = 0
          for (; index < itemsToBeRemoved.length; index++) {
            events.splice(itemsToBeRemoved[index] - index, 1);
          }
        }

        return this;
      }

      itemsToBeRemoved = getRelatedListeners(events, {
        callback: callback,
        listener: listener
      });
      index = 0;
      for (; index < itemsToBeRemoved.length; index++) {
        events.splice(itemsToBeRemoved[index] - index, 1);
      }
      return this;
    },

    "on": function(category, callback, context, listener) {
      var events = this.__events[category] || (this.__events[category] = []);
      if (callback === void 0) {
        return;
      }
      events.push({
        "callback": callback,
        "context": context,
        "listener": listener
      });
      return this;
    },

    "once": function(category, callback) {
      if (callback === void 0) {
        return;
      }
      callback.__once = true;
      return this.on.apply(this, arguments);
    },

    "reply": function(ns, value) {
      this.__items[ns] = {
        value: value
      };
      return this;
    },

    "replyOnce": function(ns, value) {
      this.__items[ns] = {
        value: value,
        once: true
      };
      return this;
    },

    "request": function(ns) {
      var item = this.__items[ns];
      if (item.once) {
        delete this.__items[ns];
      }
      return item.value;
    },

    "setContext": function(context) {
      this.__context = context || this;
      return this;
    },

    "stopListening": function(namespace, category, callback) {
      var channel = getRadioChannel(namespace);
      channel.off(category, callback || null, this.__uid);
      return this;
    },

    "trigger": function(category) {
      var args = Array.prototype.slice.call(arguments, 1),
          events = this.__events[category],
          itemsToBeRemoved = [];
      if (events === void 0) {
        return this;
      }
      for (var item, index = 0; index < events.length; index++) {
        item = events[index];
        item.callback.apply(item.context || this.__context, args);
        if (item.callback.__once) {
          itemsToBeRemoved.push(index);
        }
      }
      index = 0
      for (; index < itemsToBeRemoved.length; index++) {
        events.splice(itemsToBeRemoved[index] - index, 1);
      }
      return this;
    }
  });

/*-----  End of Channel Class  ------*/

/*===================================
=            Radio Class            =
===================================*/

  function $Radio() {
    $RadioChannel.prototype.constructor.apply(this, arguments);
  }

  angular.extend($Radio.prototype, $RadioChannel.prototype, {

    "channel": function(namespace) {
      return getRadioChannel(namespace);
    },

    "triggerChannel": function(namespace, category) {
      var args = Array.prototype.slice.call(arguments, 2),
          channel = this.channel(namespace);
      channel.trigger.apply(channel, [category].concat(args));
      return this;
    },

    "removeChannel": function(namespace) {
      if (!$Radio.prototype.hasOwnProperty(namespace)) {
        delete this[namespace];
      }
      delete $radioChannels[namespace];
      return this;
    }

  });

/*-----  End of Radio Class  ------*/

  var exports = {
    "$radio": new $Radio(),
    "$radioChannel": $RadioChannel,
    "$radioChannels": $radioChannels
  };

  function $RadioProvider() {
    this.exports = exports;
    this.$get = function() { return exports.$radio; };
  }
  angular.extend($RadioProvider.prototype, $Radio.prototype);

  angular.module('ngRadio', [])
    .provider('$radio', $RadioProvider);

  return exports.$radio;

}));