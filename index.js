'use strict'

const EventEmitter = require('events')
const osc = require('osc')

const OPTION_DEFAULTS = {
	inAddress: '127.0.0.1',
	inPort: 57120,
	outAddress: '127.0.0.1',
	outPort: 6010,
	onTime: true,
	addMidiData: false 
}

const OSC_ADDRESS = {
	ctrl: '/ctrl',
	play: '/play2'
}

class Tidal extends EventEmitter {
	constructor(options = {}) {
		super()

		const {
			inAddress = OPTION_DEFAULTS.inAddress,
			inPort = OPTION_DEFAULTS.inPort,
			outAddress = OPTION_DEFAULTS.outAddress,
			outPort = OPTION_DEFAULTS.outPort,
			onTime =  OPTION_DEFAULTS.onTime,
			addMidiData = OPTION_DEFAULTS.addMidiData,
		} = options

		this.onTime = onTime

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

				if (address.startsWith(OSC_ADDRESS.play)) {
					const message = {}
					for (var i = 0; i < args.length; i += 2) {
						message[args[i].value] = args[i + 1].value
					}

					if (addMidiData) {
						message.octave = (typeof message.octave === 'undefined') ? 5 : message.octave
						message.n = message.n || message.note || 0
						message.midinote = message.n + (message.octave + 1) * 12
					}

					if (onTime) {
						setTimeout(() => {
							delete message.delta
							this.emit('message', message)
						}, message.delta * 1000)
					} else {
						this.emit('message', message)
					}
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
			address: OSC_ADDRESS.ctrl,
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
