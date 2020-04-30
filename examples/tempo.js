'use strict'

const Tidal = require('../')
const tidal = new Tidal({
	listenTempo : true
})

tidal.on('tempo', message => {
	console.log('Received Tidal tempo message:', message)
})

tidal.on('error', err => {
	console.error('Error occured:', err)
})

