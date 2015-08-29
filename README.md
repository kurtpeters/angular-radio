ngRadio
=======

Clone this repository or install via [Bower](http://bower.io/)

```
bower install angular-radio
```

## Using With Angular

```js
angular.module('app', ['ngRadio'])
  .controller(function($radio) {
    var channel = $radio.channel('app', this);
  });
```

## API

### $radio

#### `channel( channelName, [context] )`

```js
var authChannel = $radio.channel('auth');
```

#### `removeChannel( channelName )`

```js
$radio.removeChannel('auth');
```

#### `triggerChannel( channelName [, args...] )`

```js
$radio.triggerChannel('auth', 'success');
```

### Channel

```js
var myChannel = $radio.channel('my:channel');
```

#### `listenTo( channelName, eventName, callback [, context] )`

```js
myChannel.listenTo('auth', 'success', function() {
  console.log('This will fire on every auth success event!');
});
```

#### `listenToOnce( channelName, eventName, callback [, context] )`

```js
myChannel.listenToOnce('auth', 'success', function() {
  console.log('This will only fire once.');
});
```

#### `off( [eventName] [, callback] )`

```js
myChannel.off('change');
```

#### `on( eventName, callback [, context] )`

```js
myChannel.on('change', function() {
  console.log('Change event has been triggered.');
});
```

#### `once( eventName, callback [, context] )`

```js
myChannel.on('change', function() {
  console.log('This will only fire once on change event');
});
```

#### `reply( requestName [, args...] )`

```js
myChannel.reply('greet', 'hello');
```

#### `replyOnce( requestName [, args...] )`

```js
myChannel.replyOnce('greet', 'good day');
```

#### `reset()`

```js
myChannel.reset();
```

#### `request( requestName [, args...] )`

```js
myChannel.request('greet');
```

#### `setContext( context )`

```js
myChannel.setContext(this);
```

#### `stopListening( [channelName] [, eventName] [, callback] )`

```js
myChannel.stopListening('auth');
```

#### `trigger( eventName [, args...] )`

```js
myChannel.trigger('change');
```