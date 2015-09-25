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
    return 'c_' + Date.now();
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
        args = slice(arguments, 2);
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
     * Assign channel event listeners to remote channel(s).
     *
     * @method
     * @param {String} channelName
     * @returns {$RadioChannel}
     */
    "listenTo": function(channelName, eventName, callback, context) {
      var args = slice(arguments, 1),
          channel = getRadioChannel(channelName);
      context === void 0 ? args.push(this, this.__uid) : args.push(this.__uid);
      channel.on.apply(channel, args);
      return this;
    },
    /**
     * listenToOnce()
     * Assign channel event listeners to remote channel(s) only once.
     *
     * @method
     * @param {String} channelName
     * @returns {$RadioChannel}
     */
    "listenToOnce": function(channelName, eventName, callback, context) {
      var args = slice(arguments, 1),
          channel = getRadioChannel(channelName);
      context === void 0 ? args.push(this, this.__uid) : args.push(this.__uid);
      channel.once.apply(channel, args);
      return this;
    },
    /**
     * off()
     * Remove event listeners from channel.
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
     * Assign event listeners to channel.
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
     * Assign event listeners to channel only once.
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
     * Set response item to request list.
     *
     * @method
     * @param {String} itemName
     * @param {String|Number|Array|Function|Object} value
     * @returns {$RadioChannel}
     */
    "reply": function(itemName, value, context) {
      if (hasMultipleEvents.call(this, 'reply', itemName, value)) {
        return this;
      };
      this.__items[itemName] = {
        context: context,
        value: value
      };
      return this;
    },
    /**
     * replyOnce()
     * Set response item to request list only once.
     *
     * @method
     * @param {String} itemName
     * @param {String|Number|Array|Function|Object} value
     * @returns {$RadioChannel}
     */
    "replyOnce": function(itemName, value, context) {
      if (hasMultipleEvents.call(this, 'replyOnce', itemName, value)) {
        return this;
      };
      this.__items[itemName] = {
        __once: true,
        context: context,
        value: value
      };
      return this;
    },
    /**
     * reset()
     * Return channel to original (empty) state.
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
     * Retrieve response item from request list.
     *
     * @method
     * @param {String} itemName
     * @returns {}
     */
    "request": function(itemName) {
      var args = slice(arguments, 1),
          item = this.__items[itemName] || this.__items.default || {};
      if (item.__once) {
        this.stopReplying(itemName);
      }
      if (angular.isFunction(item.value)) {
        return item.value.apply(item.context || this.__context, args);
      }
      return item.value;
    },
    /**
     * setContext()
     * Configure default channel context for all event callbacks.
     *
     * @method
     * @param {String|Number|Array|Function|Object} context
     * @returns {$RadioChannel}
     */
    "setContext": function(context) {
      this.__context = context || this;
      this.setScope(this.__context);
      return this;
    },
    /**
     * setScope()
     * Remove event listeners when given $scope is destroyed.
     *
     * @method
     * @param {Object} $scope
     * @returns {$RadioChannel}
     */
    "setScope": function($scope) {
      if (angular.isFunction(this.__angularListener)) {
        this.__angularListener();
      }
      if ($scope !== void 0 && '$on' in $scope) {
        console.log('condition');
        this.__angularListener = $scope.$on('$destroy', angular.bind(this, function() {
          this.stopListening().reset();
        }));
        console.log(this, this.__angularListener);
      } else {
        delete this.__angularListener;
      }
      return this;
    },
    /**
     * stopListening()
     * Remove channel event listeners from remote channel(s).
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
     * stopReplying()
     * Remove response items from request list.
     *
     * @method
     * @param {String} itemName
     * @returns {$RadioChannel}
     */
    "stopReplying": function(itemName) {
      if (itemName === void 0) {
        var defaultItem = this.__items.default;
        this.__items = { "default": defaultItem };
      }
      if (typeof itemName === 'string') {
        delete this.__items[itemName];
      }
      return this;
    },
    /**
     * trigger()
     * Invoke event callback(s) for current channel.
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
     * Retrieve remote channel and assign a default context.
     *
     * @method
     * @param {String} channelName
     * @param {} context
     * @returns {channel}
     */
    "channel": function(channelName, context) {
      var channel = getRadioChannel(channelName);
      if (channel !== void 0 && context !== void 0) {
        channel.setContext(context);
      }
      return channel;
    },
    /**
     * removeChannel()
     * Remove remote channel.
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
     * Trigger event from remote channel.
     *
     * @method
     * @param {String} channelName
     * @returns {$Radio}
     */
    "triggerChannel": function(channelName) {
      var args = slice(arguments, 1),
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
    $RadioChannel.call(this);
    this.$new = function() { return new $RadioChannel(); };
    this.$get = angular.bind(this, function() { return this; });
  }
  /**
   * $RadioProvider()
   *
   * @func
   */
  function $RadioProvider() {
    angular.extend(this, exports.$radio);
    this.$get = function() { return exports.$radio; };
  }
  angular.extend($RadioChannelProvider.prototype, $RadioChannel.prototype);
  angular.extend($RadioProvider.prototype, $Radio.prototype);
  angular.module('ngRadio', [])
    .provider('$radioChannel', $RadioChannelProvider)
    .provider('$radio', $RadioProvider);
  return exports.$radio;
}));