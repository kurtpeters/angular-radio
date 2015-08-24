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

  function removeItemsFromEventList(eventList, items) {
    for (var itemsLength = items.length, idx = 0; idx < itemsLength; idx++) {
      eventList.splice(items[idx] - idx, 1);
    }
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

    "listenTo": function(namespace) {
      var args = Array.prototype.slice.call(arguments, 1),
          channel = getRadioChannel(namespace);
      args.push(this.__uid);
      return channel.on.apply(channel, args);
    },

    "listenToOnce": function(namespace, category, callback, context) {
      var args = Array.prototype.slice.call(arguments, 1),
          channel = getRadioChannel(namespace);
      args.push(this.__uid);
      return channel.once.apply(channel, args);
    },

    "off": function(category, callback, listener) {
      var eventList = this.__events[category] || [],
          voidCallback = callback === void 0,
          voidCategory = category === void 0,
          voidListener = listener === void 0;

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
      var hasMultiProcesses = this._processMultipleEvents('on', category, callback, context, listener);
      if (category === void 0 || hasMultiProcesses || callback === void 0) {
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
      var args = Array.prototype.slice.call(arguments),
          hasMultiProcesses = this._processMultipleEvents.apply(this, ['once'].concat(args));
      if (callback === void 0 || hasMultiProcesses) {
        return this;
      }
      callback.__once = true;
      return this.on.apply(this, args);
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
      if (namespace === void 0) {
        angular.forEach($radioChannels, function() {
          channel.off(void 0, null, this.__uid);
        });
        return this;
      }
      getRadioChannel(namespace)
        .off(category, callback || null, this.__uid);
      return this;
    },

    "trigger": function(category) {
      var DELIMITER = /\s+/g,
          args = Array.prototype.slice.call(arguments, 1),
          eventList = this.__events[category],
          itemsToBeRemoved = [];

      if (eventList === void 0) {
        if(category && DELIMITER.test(category)) {
          angular.forEach(category.split(DELIMITER), function(eventName) {
            this.trigger(eventName);
          }, this);
        }
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
    },

    "_processMultipleEvents": function(method, category) {
      var DELIMITER = /\s+/g,
          args = Array.prototype.slice.call(arguments, 3);
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

    "channel": function(ns) {
      return getRadioChannel(ns);
    },

    "removeChannel": function(ns) {
      delete $radioChannels[ns];
      return this;
    },

    "triggerChannel": function(ns, category) {
      var args = Array.prototype.slice.call(arguments, 1),
          channel = this.channel(ns);
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