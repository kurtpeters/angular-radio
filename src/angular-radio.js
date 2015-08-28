(function (root, factory) { 'use strict';
    /**
     * UMD
     * Uses AMD or browser globals to create a module.
     *
     * @param {Object} root
     * @param {Object} factory - $radio instance
     */
    if (typeof define === 'function' && define.amd) {
        define(['ngRadio'], factory);
    } else {
        root.ngRadio = factory(root.angular);
    }
}(this, function(angular) { 'use strict';
  /**
   * $radioChannels
   * Radio channel storage instance.
   *
   * @static
   * @type {Object}
   */
  var $radioChannels = {};
  /**
   * createUniqueId()
   * Unique id assigned to each $radioChannel instance.
   *
   * @func
   * @returns {String} uid
   */
  function createUniqueId() {
    return 'c_' + new Date().getTime();
  }
  /**
   * getRadioChannel)
   * Retrieve $radioChannel instance from closure.
   *
   * @func
   * @param {String} channelName - Tag for saving/retrieving channel instances
   * @returns {Object} channel
   */
  function getRadioChannel(channelName) {
    return $radioChannels[channelName] || ($radioChannels[channelName] = new $RadioChannel());
  }
  /**
   * getRelatedListenerItems()
   * Creates a list of related event listeners from a set of comparators.
   *
   * @func
   * @param {Array} events - List of events to compare against
   * @param {Object} comparators
   * @returns {Array}
   */
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
  /**
   * hasMultipleEvents()
   * Runs multiple channel events against a single instance method.
   * Returns boolean whether category provides multiple events.
   *
   * @func
   * @param {String} method - Instance method to invoke
   * @param {String|Object} category - List of channel events to iterate over
   * @returns {Boolean}
   */
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
  /**
   * removeItemsFromEventList()
   * Removes event items from event list via predefined index.
   *
   * @func
   * @param {Array} eventList - List of events to filter
   * @param {Array} items - List of item index properties
   */
  function removeItemsFromEventList(eventList, items) {
    for (var itemsLength = items.length, idx = 0; idx < itemsLength; idx++) {
      eventList.splice(items[idx] - idx, 1);
    }
  }
  /**
   * slice()
   * Helper method for Array slice prototype.
   *
   * @func
   * @param {Array} args - Scope arguments list
   * @param {Number} idx - Index to slice arguments with
   */
  function slice(args, idx) {
    return Array.prototype.slice.call(args, idx || 0);
  }
  /**
   * $RadioChannel
   * Create new radioChannel instance.
   *
   * @class
   */
  function $RadioChannel() {
    this.__context = this;
    this.__events = {};
    this.__items = {};
    this.__uid = createUniqueId();
  }
  angular.extend($RadioChannel.prototype, {
    /**
     * listenTo()
     *
     * @method
     * @param {String} channelName
     * @returns {$RadioChannel}
     */
    "listenTo": function(channelName) {
      var args = slice(arguments, 1),
          channel = getRadioChannel(channelName);
      args[3] = this.__uid;
      channel.on.apply(channel, args);
      return this;
    },
    /**
     * listenToOnce()
     *
     * @method
     * @param {String} channelName
     * @returns {$RadioChannel}
     */
    "listenToOnce": function(channelName) {
      var args = slice(arguments, 1),
          channel = getRadioChannel(channelName);
      args[3] = this.__uid;
      channel.once.apply(channel, args);
      return this;
    },
    /**
     * off()
     *
     * @method
     * @param {String} category
     * @param {Function} callback
     * @param {String} listener
     * @returns {$RadioChannel}
     */
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
    /**
     * on()
     *
     * @method
     * @param {String} category
     * @param {Function} callback
     * @param {String|Number|Array|Function|Object} context
     * @param {String} listener
     * @returns {$RadioChannel}
     */
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
    /**
     * once()
     *
     * @method
     * @param {String} category
     * @param {Function} callback
     * @returns {$RadioChannel}
     */
    "once": function(category, callback) {
      var args = slice(arguments),
          hasMultiProcesses = hasMultipleEvents.apply(this, ['once'].concat(args));
      if (callback === void 0 || hasMultiProcesses) {
        return this;
      }
      callback.__once = true;
      return this.on.apply(this, args);
    },
    /**
     * reply()
     *
     * @method
     * @param {String} itemName
     * @param {String|Number|Array|Function|Object} value
     * @returns {$RadioChannel}
     */
    "reply": function(itemName, value) {
      if (hasMultipleEvents.call(this, 'reply', itemName, value)) {
        return this;
      };
      this.__items[itemName] = {
        value: value
      };
      return this;
    },
    /**
     * replyOnce()
     *
     * @method
     * @param {String} itemName
     * @param {String|Number|Array|Function|Object} value
     * @returns {$RadioChannel}
     */
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
    /**
     * reset()
     *
     * @method
     * @returns {$RadioChannel}
     */
    "reset": function() {
      this.__events = {};
      this.__items = {};
      return this;
    },
    /**
     * request()
     *
     * @method
     * @param {String} itemName
     * @returns {}
     */
    "request": function(itemName) {
      var item = this.__items[itemName] || {};
      if (item.__once) {
        delete this.__items[itemName];
      }
      return item.value;
    },
    /**
     * setContext()
     *
     * @method
     * @param {String|Number|Array|Function|Object} context
     * @returns {$RadioChannel}
     */
    "setContext": function(context) {
      this.__context = context || this;
      return this;
    },
    /**
     * stopListening()
     *
     * @method
     * @param {String} namespace
     * @param {String} category
     * @param {Function} callback
     * @returns {$RadioChannel}
     */
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
    /**
     * trigger()
     *
     * @method
     * @param {String} category
     * @returns {$RadioChannel}
     */
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
  /**
   * $Radio
   * Create new radio instance.
   *
   * @class
   */
  function $Radio() {
    $RadioChannel.prototype.constructor.apply(this, arguments);
  }
  angular.extend($Radio.prototype, $RadioChannel.prototype, {
    /**
     * channel()
     *
     * @method
     * @param {String} channelName
     * @param {} context
     * @returns {channel}
     */
    "channel": function(channelName, context) {
      var channel = getRadioChannel(channelName);
      if (channel !== void 0) {
        channel.setContext(context);  
      }
      return channel;
    },
    /**
     * removeChannel()
     *
     * @method
     * @param {String} channelName
     * @returns {$Radio}
     */
    "removeChannel": function(channelName) {
      delete $radioChannels[channelName];
      return this;
    },
    /**
     * triggerChannel()
     *
     * @method
     * @param {String} channelName
     * @param {String} categoty
     * @returns {$Radio}
     */
    "triggerChannel": function(channelName, category) {
      var args = Array.prototype.slice.call(arguments, 1),
          channel = this.channel(channelName);
      channel.trigger.apply(channel, args);
      return this;
    }
  });
  /**
   * exports
   *
   * @static
   * @type {Object}
   */
  var exports = {
    "$radio": new $Radio(),
    "$radioChannel": $RadioChannel,
    "$radioChannels": $radioChannels
  };
  /**
   * $RadioChannelProvider()
   *
   * @func
   */
  function $RadioChannelProvider() {
    this.$get = function() { return exports.$radioChannel; };
  }
  /**
   * $RadioProvider()
   *
   * @func
   */
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