const Tidal = require('../index')
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
