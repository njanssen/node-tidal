# node-tidal

Node.js interface for [TidalCycles](https://tidalcycles.org). TidalCycles is open source software allows you to make patterns with code and is typically used for live coding music at algoraves.

## What does this library do?

This library supports the following interactions with TidalCycles:

-   Sending [controller input](https://tidalcycles.org/index.php/Controller_Input) OSC messages to TidalCycles
-   Listening to standard or [custom](https://tidalcycles.org/index.php/Custom_OSC) OSC messages from TidalCycles
-   Listening to [tempo](https://tidalcycles.org/index.php/Network_tempo_sharing) messages from TidalCycles
-   Listening to RMS messages from SuperDirt

## Installation

```
yarn add @vliegwerk/tidal
```

or

```
npm install @vliegwerk/tidal --save
```

## Basic usage

The following code can be used to start listening to TidalCycles' OSC messages:

```
const Tidal = require('@vliegwerk/tidal')
const tidal = new Tidal()

tidal.on('ready', () => {
	// Listening to messages from TidalCycles
})

tidal.on('message', message => {
	// Received a message from TidalCycles
})

tidal.on('error', err => {
	// Error occured
})
```

This code creates a new `Tidal` instance which depends on the [osc.js](https://www.npmjs.com/package/osc) library for initializing UDP ports for sending and receiving OSC messages. The argument of the event listener contains a Javscript object version of the OSC message sent by TidalCycles. For example:

```
{
    cps: 0.5625,
    cycle: 43,
    delta: 1.7777776718139648,
    orbit: 0,
    s: 'bd'
}
```

Please note that the orbit numbering starts at 0 in these messages. So, orbit 1 (e.g. `# orbit 1`) in TidalCycles will appear as `orbit: 0` in these messages.

The following code can be used to send controller input OSC messages to TidalCycles:

```
tidal.cF('myFloat',1.0) // to send a float
tidal.cI('myInt',1) // to send an integer
tidal.cS('myString','Hello TidalCycles!') // to send a string
tidal.cP('myPattern','[0,5,7]') // to send a parseable pattern (e.g. a pattern for n)
```

For more examples, see the `examples` folder in the [node-tidal repository](https://github.com/njanssen/node-tidal/tree/master/examples) on GitHub.

## Configuration

By default, your `Tidal` instance will listen for OSC messages on port `57120` which is the standard port used by TidalCycles to send OSC messages to SuperDirt/SuperCollider for producing sound. You can tell TidalCycles to use another port number and/or send (custom) OSC messages to multiple targets by updating your `BootTidal.hs` file. For more details, see the [TidalCycles documentation](https://tidalcycles.org/index.php/Custom_OSC).

Specify the UDP ports to use for communicating with TidalCycles when creating an instance of `Tidal` in your code:

```
const tidal = new Tidal({
	inAddress: '127.0.0.1',
	inPort: 9000,
	outAddress: '127.0.0.1',
	outPort: 6010
})
```

TidalCycles sends out its OSC messages ahead of the time that the sound event should actually happen.
Your `Tidal` instance will emit the `message` event immediately after receiving an OSC message from TidalCycles
which means you need to handle this interval by yourself, for instance by using the `setTimeout` function
to delay processing of the incoming message.

Another option is to tell TidalCycles to send the OSC messages in time by setting `oSchedule` of the OSC target to `Live`.

The following snippet taken from a `BootTidal.hs` file can be used to configure two OSC targets,
one standard SuperDirt target on port `57120` for sound processing by SuperDirt/SuperCollider, and another custom OSC target on port `9000` for
this library where message are sent in time (`oSchedule = Live`).

```
:{
tidal <- startStream defaultConfig [
           (superdirtTarget {oLatency = 0.1, oAddress = "127.0.0.1", oPort = 57120}, [superdirtShape])
         , (Target {oName = "node-tidal", oAddress = "127.0.0.1", oPort = 9000, oLatency = 0.2, oWindow = Nothing, oSchedule = Live}, [superdirtShape])
         ]
:}
```

Please note that you can also define your own OSC message structure instead of using the standard `superdirtShape`. For examples, see the [TidalCycles documentation](https://tidalcycles.org/index.php/Custom_OSC).

By default, your `Tidal` instance will emit `message` events for the standard SuperDirt `/play2` OSC messages.
You can configure a custom OSC address pattern using the `addressPattern` option when instantiating your `Tidal` instance:

```
const tidal = new Tidal({
	inAddress: '127.0.0.1',
	inPort: 9000,
	addressPattern: '/myaddresspattern'
})
```

## Network tempo sharing

TidalCycles supports [network tempo sharing](https://tidalcycles.org/index.php/Network_tempo_sharing) which allows you to synchronize multiple computers running TidalCycles.

The following configuration will make your `Tidal` instance listen for these tempo messages:

```
const Tidal = require('@vliegwerk/tidal')
const tidal = new Tidal({
	listenTempo : true
})

tidal.on('tempo', message => {
	console.log(message)
})
```

Tempo messages are sent directly after connecting to the tempo server, and whenever you evaluate the `setcps` or `resetCycles` functions in TidalCycles.

The following Javascipt object is an example of the data that's available on a `tempo` event:

```
{
    atCycle: 173.8507843017578,
    cps: 0.699999988079071,
    paused: 0
}
```

## SuperDirt RMS messages

This library can listen for RMS readings sent by SuperDirt. These messages can be used to build VU meters. To enable listening to RMS messages, you should first run the following code in SuperCollider before starting SuperDirt:

```
s.options.maxLogins = 8;
```

And the following code after starting SuperDirt (e.g. with `SuperDirt.start`):

```
 ~dirt.startSendRMS;
```

Please make sure this code has been evaluated in SuperCollider before initializing your `Tidal` class.

The following configuration will make your `Tidal` instance listen for SuperDirt's RMS messages:

```
const Tidal = require('@vliegwerk/tidal')
const tidal = new Tidal({
	listenRms : true
})

tidal.on('rms', message => {
	console.log(message)
})
```

The following Javascipt object is an example of the data that's available on an `rms` event:

```
{
  orbit: 0,
  channels: [
    { peak: 0.31483814120292664, power: 0.04383470118045807 },
    { peak: 0.1453121155500412, power: 0.01931002549827099 }
  ]
}
```

This message contains the peak and power value per channel for an orbit.
In this case, the message contains the peak and power values for the left and the right channel for orbit 1.

## Extras

-   Install your TidalCycles environment by following the instructions found in the [TidalCycles documentation](https://tidalcycles.org/index.php/Installation).
-   For a basic project using this library, see [tidal-pilot](https://github.com/njanssen/tidal-pilot).
-   The code for listening to SuperDirt's RMS messages is based on the implementation of the VU meters in Alex McLean's [Feedforward](https://github.com/yaxu/feedforward)
    editor for TidalCycles.
-   See the [License](LICENSE) file for license rights and limitations (MIT).
-   Pull Requests are welcome!
