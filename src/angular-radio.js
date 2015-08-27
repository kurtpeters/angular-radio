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

  function getRelatedListenerItems(events, comparators) {
    var relatedListenerIds = [];
    for (var item, index = 0; index < events.length; index++) {
      item = events[index];
      if (item.callback === comparators.callback || item.listener !== void 0 && item.listener === comparators.listener) {
        relatedListenerIds.push(index);
      }
    }
    return relatedListenerIds;
  }

  function hasMultipleEvents(method, category) {
    var DELIMITER = /\s+/g,
        args = Array.prototype.slice.call(arguments, 2);
    if (angular.isObject(category)) {
      angular.forEach(category, function(_callback, _category) {
        this[method].apply(this, [_category, _callback].concat(args));
      }, this);
      return true;
    }
    if (DELIMITER.test(category)) {
      angular.forEach(category.split(DELIMITER), function(eventName) {
        this[method].apply(this, [eventName].concat(args));
      }, this);
      return true;
    }
    return false;
  }

  function removeItemsFromEventList(eventList, items) {
    for (var itemsLength = items.length, idx = 0; idx < itemsLength; idx++) {
      eventList.splice(items[idx] - idx, 1);
    }
  }

  function slice(args, idx) {
    return Array.prototype.slice.call(args, idx || 0);
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

    "listenTo": function(channelName) {
      var args = slice(arguments, 1),
          channel = getRadioChannel(channelName);
      args[3] = this.__uid;
      channel.on.apply(channel, args);
      return this;
    },

    "listenToOnce": function(channelName) {
      var args = slice(arguments, 1),
          channel = getRadioChannel(channelName);
      args[3] = this.__uid;
      channel.once.apply(channel, args);
      return this;
    },

    "off": function(category, callback, listener) {
      var eventList = this.__events[category] || [],
          voidCallback = callback === void 0,
          voidCategory = category === void 0,
          voidListener = listener === void 0;
      if (hasMultipleEvents.call(this, 'off', category, callback, listener)) {
        return this;
      }
      if (voidCategory) {
        if (voidListener) {
          this.__events = [];
          return this;
        } 
        for (var eventCategory in this.__events) {
          eventList = this.__events[eventCategory];
          removeItemsFromEventList(eventList, getRelatedListenerItems(eventList, {
            callback: callback,
            listener: listener
          }));
        }
        return this;
      }
      if (voidCallback && voidListener) {
        delete this.__events[category];
        return this;
      }
      removeItemsFromEventList(eventList, getRelatedListenerItems(eventList, {
        callback: callback,
        listener: listener
      }));
      return this;
    },

    "on": function(category, callback, context, listener) {
      var hasMultiProcesses = hasMultipleEvents.call(this, 'on', category, callback, context, listener);
      if (hasMultiProcesses || category === void 0 || callback === void 0) {
        return this;
      }
      var eventList = this.__events[category] || (this.__events[category] = []);
      eventList.push({
        "callback": callback,
        "context": context,
        "listener": listener
      });
      return this;
    },

    "once": function(category, callback) {
      var args = slice(arguments),
          hasMultiProcesses = hasMultipleEvents.apply(this, ['once'].concat(args));
      if (callback === void 0 || hasMultiProcesses) {
        return this;
      }
      callback.__once = true;
      return this.on.apply(this, args);
    },

    "reply": function(itemName, value) {
      if (hasMultipleEvents.call(this, 'reply', itemName, value)) {
        return this;
      };
      this.__items[itemName] = {
        value: value
      };
      return this;
    },

    "replyOnce": function(itemName, value) {
      if (hasMultipleEvents.call(this, 'replyOnce', itemName, value)) {
        return this;
      };
      this.__items[itemName] = {
        __once: true,
        value: value
      };
      return this;
    },

    "reset": function() {
      this.__events = {};
      this.__items = {};
      return this;
    },

    "request": function(itemName) {
      var item = this.__items[itemName] || {};
      if (item.__once) {
        delete this.__items[itemName];
      }
      return item.value;
    },

    "setContext": function(context) {
      this.__context = context || this;
      return this;
    },

    "stopListening": function(namespace, category, callback) {
      if (namespace === void 0) {
        angular.forEach($radioChannels, function(channel) {
          channel.off(void 0, null, this.__uid);
        }, this);
        return this;
      }
      getRadioChannel(namespace)
        .off(category, callback || null, this.__uid);
      return this;
    },

    "trigger": function(category) {
      var args = args = slice(arguments, 1),
          eventList = this.__events[category],
          itemsToBeRemoved = [];
      if (eventList === void 0) {
        hasMultipleEvents.apply(this, ['trigger', category].concat(args));
        return this;
      }
      for (var item, index = 0; index < eventList.length; index++) {
        item = eventList[index];
        item.callback.apply(item.context || this.__context, args);
        if (item.callback.__once) {
          itemsToBeRemoved.push(index);
        }
      }
      removeItemsFromEventList(eventList, itemsToBeRemoved);
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

    "channel": function(channelName) {
      return getRadioChannel(channelName);
    },

    "removeChannel": function(channelName) {
      delete $radioChannels[channelName];
      return this;
    },

    "triggerChannel": function(channelName, category) {
      var args = Array.prototype.slice.call(arguments, 1),
          channel = this.channel(channelName);
      channel.trigger.apply(channel, args);
      return this;
    }

  });

/*-----  End of Radio Class  ------*/

  var exports = {
    "$radio": new $Radio(),
    "$radioChannel": $RadioChannel,
    "$radioChannels": $radioChannels
  };

  function $RadioChannelProvider() {
    this.$get = function() { return exports.$radioChannel; };
  }

  function $RadioProvider() {
    this.exports = exports;
    this.$get = function() { return exports.$radio; };
  }

  angular.extend($RadioProvider.prototype, $Radio.prototype);

  angular.module('ngRadio', [])
    .provider('$radioChannel', $RadioChannelProvider)
    .provider('$radio', $RadioProvider);

  return exports.$radio;

}));