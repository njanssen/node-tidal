'use strict'

const Tidal = require('../')
const tidal = new Tidal({
	inPort: 9000,
	listenRms : true
})

tidal.on('rms', message => {
	// Display a VU meter for orbit 1 only
	if (message.orbit == 0) {
		const vuBlocks = " ▁▂▃▄▅▆▇█"
		const vuMax = vuBlocks.length-1

		// Add a vuBlock for the power of each channel (e.g. left, right) in the RMS message
		const output = message.channels.reduce((acc,value) => {
			const vuReading = Math.min(vuMax, Math.floor(275 * value.power))
			return `${acc} ${vuBlocks.charAt(vuReading)}`
		},`Orbit [${message.orbit}]`)

		process.stdout.write(output+'\r')
	}
})

tidal.on('error', err => {
	console.error('Error occured:', err)
})

