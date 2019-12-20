const EventEmitter = require('events')
const osc = require('osc')
const _ = require('lodash')

const TIDAL_OSC_DEFAULTS = {
	inAddress: '127.0.0.1',
	inPort: 9000,
	outAddress: '127.0.0.1',
	outPort: '6010'
}

const TIDAL_OSC_ADDRESSES = {
	controller: '/ctrl',
	play: '/play2'
}

class Tidal extends EventEmitter {
	constructor(options) {
        super()

		this.options = options || TIDAL_OSC_DEFAULTS

		const udpPort = new osc.UDPPort({
			localAddress: this.options.inAddress || TIDAL_OSC_DEFAULTS.inAddress,
			localPort: this.options.inPort || TIDAL_OSC_DEFAULTS.inPort,
			remoteAddress: this.options.outAddress || TIDAL_OSC_DEFAULTS.outAddress,
			remotePort: this.options.outPort  || TIDAL_OSC_DEFAULTS.outPort,
			broadcast: true,
			metadata: true
		})

		udpPort.open()

		udpPort.on('ready', () => {
			this.emit('ready')
		})

		udpPort.on('bundle', (bundle) => {
			_.forEach(bundle.packets, (packet) => {
				const address = packet.address
				const args = packet.args
	
				if (_.startsWith(address, TIDAL_OSC_ADDRESSES.play)) {
					let message = {}
					for (var i = 0; i < args.length; i += 2) {
						message[args[i].value] = args[i + 1].value
					}
	
					setTimeout(() => {
						this.emit('message',message)
					}, message.delta * 1000)
				}
			})
		})

		udpPort.on('error', err => {
			this.emit('error', err)
		})
	}

	cF = (message, value) => {
		const f = parseFloat(value)
		if (!isNaN(f)) sendCtrl(message, 'f', f)
	}

	cI = (message, value) => {
		const o = parseInt(value)
		if (!isNaN(i)) sendCtrl(message, 'i', i)
	}

	cP = (message, value) => {
		const s = value
		sendCtrl(message, 's', s)
	}

	sendCtrl = (message, type, value) => {
		udpPort.send({
			address: TIDAL_OSC_CTRL,
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
