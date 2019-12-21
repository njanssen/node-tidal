# node-tidal

Node.js interface for [TidalCycles](https://tidalcycles.org). TidalCycles is open source software allows you to make patterns with code and is typically used for live coding music at algoraves.

## What does this library do?

This library supports the following interactions with TidalCycles:
- Sending [controller input](https://tidalcycles.org/index.php/Controller_Input) OSC messages to TidalCycles
- Listening to standard or [custom](https://tidalcycles.org/index.php/Custom_OSC) OSC messages from TidalCycles

## Installation

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

This code create a new `Tidal` instance which depends on the [osc.js](https://www.npmjs.com/package/osc) library for initializing UDP ports for sending and receiving OSC messages. 

By default, your `Tidal` instance will listen for OSC messages on port `57120` which is the standard port used by TidalCycles to send OSC messages to SuperDirt/SuperCollider for producing sound. You can tell TidalCycles to use another port number or send (custom) OSC messages to multiple targets by updating your `BootTidal.hs` file. For more details, see the [TidalCycles documentation](https://tidalcycles.org/index.php/Custom_OSC). 

Specify the UDP ports to use for communicating with TidalCycles when creating an instance of `Tidal` in your code:

```
const tidal = new Tidal({
    // Listen for OSC messages on port 9000
	inAddress: '127.0.0.1', 
	inPort: 9000,
    // Send controller input messages to TidalCycles
	outAddress: '127.0.0.1',
	outPort: 6010
})
```

The following code can be used to send controller input OSC messages to TidalCycles:

```
tidal.cF('myFloat',1.0) // to send a float
tidal.cI('myInt',1) // to send an integer
tidal.cS('myString','Hello TidalCycles!') // to send a string 
tidal.cP('myPattern','[0,5,7]') // to send a parseable pattern (e.g. a pattern for n)
```

For more examples, see the `examples` folder in the [node-tidal repository](https://github.com/njanssen/node-tidal/tree/master/examples) on GitHub.

## Extras

- Install your TidalCycles environment by following the instructions found in the [TidalCycles documentation](https://tidalcycles.org/index.php/Installation).
- See the [License](LICENSE) file for license rights and limitations (MIT).
- Pull Requests are welcome!


