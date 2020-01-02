'use strict'

const Tidal = require('../')
const tidal = new Tidal()

tidal.on('ready', () => {
	console.log('Tidal UDP port ready')
})

tidal.on('message', message => {
	console.log('Received Tidal message:', message)
})

tidal.on('error', err => {
	console.error('Error occured:', err)
})

// Send random float every 100ms
const random = () => {
	const f = Math.random()
	tidal.cF('random', f)
	setTimeout(() => {
		random()
	},100)
}

random()