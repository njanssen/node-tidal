# node-tidal

Node.js interface for [TidalCycles](https://tidalcycles.org). TidalCycles is open source software allows you to make patterns with code and is typically used for live coding music at algoraves.

## What does this library do?

This library supports the following interactions with TidalCycles:

-   Sending [controller input](https://tidalcycles.org/index.php/Controller_Input) OSC messages to TidalCycles
-   Listening to standard or [custom](https://tidalcycles.org/index.php/Custom_OSC) OSC messages from TidalCycles

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

The following code can be used to send controller input OSC messages to TidalCycles:

```
tidal.cF('myFloat',1.0) // to send a float
tidal.cI('myInt',1) // to send an integer
tidal.cS('myString','Hello TidalCycles!') // to send a string
tidal.cP('myPattern','[0,5,7]') // to send a parseable pattern (e.g. a pattern for n)
```

For more examples, see the `examples` folder in the [node-tidal repository](https://github.com/njanssen/node-tidal/tree/master/examples) on GitHub.

## Configuration

By default, your `Tidal` instance will listen for OSC messages on port `57120` which is the standard port used by TidalCycles to send OSC messages to SuperDirt/SuperCollider for producing sound. You can tell TidalCycles to use another port number or send (custom) OSC messages to multiple targets by updating your `BootTidal.hs` file. For more details, see the [TidalCycles documentation](https://tidalcycles.org/index.php/Custom_OSC).

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
This library emits the `message` event immediately after receiving an OSC message from TidalCycles
which means you need to handle this interval by yourself, for instance by using the `setTimeout` function
to delay processing of the incoming message.

Another option is to tell TidalCycles to send the OSC messages in time by setting the `oTimestamp` of the OSC target
to `NoStamp`. The following snippet taken from a `BootTidal.hs` file can be used two configure two OSC targets,
one target on port `57120` for sound processing by SuperDirt/SuperCollider, and the other target on port `9000` for
this library where message are sent at in time (`oTimestamp = NoStamp`).

```
tidal <- startMulti [
        superdirtTarget {oLatency = 0.1, oAddress = "127.0.0.1", oPort = 57120}
    ,   superdirtTarget {oLatency = 0.1, oAddress = "127.0.0.1", oPort = 9000, oTimestamp = NoStamp}
    ] (defaultConfig {cFrameTimespan = 1/20})
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

The following Javascipt object is an example of the OSC message with tempo information sent by TidalCycles:

```
{
    atCycle: 173.8507843017578,
    cps: 0.699999988079071,
    paused: 0
}
```

## Extras

-   Install your TidalCycles environment by following the instructions found in the [TidalCycles documentation](https://tidalcycles.org/index.php/Installation).
-   For a basic project using this library, see [tidal-pilot](https://github.com/njanssen/tidal-pilot).
-   See the [License](LICENSE) file for license rights and limitations (MIT).
-   Pull Requests are welcome!
