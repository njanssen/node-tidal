'use strict'

const EventEmitter = require('events')
const osc = require('osc')

const TIDAL_OSC_DEFAULTS = {
	inAddress: '127.0.0.1',
	inPort: 57120,
	outAddress: '127.0.0.1',
	outPort: 6010
}

const TIDAL_OSC_ADDRESS = {
	ctrl: '/ctrl',
	play: '/play2'
}

class Tidal extends EventEmitter {
	constructor(options = {}) {
		super()

		const {
			inAddress = TIDAL_OSC_DEFAULTS.inAddress,
			inPort = TIDAL_OSC_DEFAULTS.inPort,
			outAddress = TIDAL_OSC_DEFAULTS.outAddress,
			outPort = TIDAL_OSC_DEFAULTS.outPort
		} = options

		this.udpPort = new osc.UDPPort({
			localAddress: inAddress,
			localPort: inPort,
			remoteAddress: outAddress,
			remotePort: outPort,
			broadcast: true,
			metadata: true
		})

		this.udpPort.open()

		this.udpPort.on('ready', () => {
			this.emit('ready')
		})

		this.udpPort.on('bundle', bundle => {
			for (let packet of bundle.packets) {
				const address = packet.address
				const args = packet.args

				if (address.startsWith(TIDAL_OSC_ADDRESS.play)) {
					const message = {}
					for (var i = 0; i < args.length; i += 2) {
						message[args[i].value] = args[i + 1].value
					}

					setTimeout(() => {
						this.emit('message', message)
					}, message.delta * 1000)
				}
			}
		})

		this.udpPort.on('error', err => {
			this.emit('error', err)
		})
	}

	cF = (message, value) => {
		const f = parseFloat(value)
		if (!isNaN(f)) this.sendCtrl(message, 'f', f)
	}

	cI = (message, value) => {
		const i = parseInt(value)
		if (!isNaN(i)) this.sendCtrl(message, 'i', i)
	}

	cP = (message, value) => {
		const s = value
		this.sendCtrl(message, 's', s)
	}

	cS = (message, value) => {
		const s = value
		this.sendCtrl(message, 's', s)
	}

	sendCtrl = (message, type, value) => {
		this.udpPort.send({
			address: TIDAL_OSC_ADDRESS.ctrl,
			args: [
				{
					type: 's',
					value: message
				},
				{
					type: type,
					value: value
				}
			]
		})
	}
}

module.exports = Tidal
