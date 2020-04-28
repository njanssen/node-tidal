'use strict'

const EventEmitter = require('events')
const osc = require('osc')

const OPTION_DEFAULTS = {
	inAddress: '127.0.0.1',
	inPort: 57120,
	outAddress: '127.0.0.1',
	outPort: 6010,
	addMidiData: false,
	listenTempo: false,
	tempoAddress: '127.0.0.1',
	tempoPort: 9160,
}

const OSC_ADDRESS = {
	ctrl: '/ctrl',
	play: '/play2',
	tempo: '/cps/cycle',
}

class Tidal extends EventEmitter {
	constructor(options = {}) {
		super()

		const {
			inAddress = OPTION_DEFAULTS.inAddress,
			inPort = OPTION_DEFAULTS.inPort,
			outAddress = OPTION_DEFAULTS.outAddress,
			outPort = OPTION_DEFAULTS.outPort,
			addMidiData = OPTION_DEFAULTS.addMidiData,
			listenTempo = OPTION_DEFAULTS.listenTempo,
			tempoAddress = OPTION_DEFAULTS.tempoAddress,
			tempoPort = OPTION_DEFAULTS.tempoPort,
		} = options

		this.addMidiData = addMidiData

		this.udpPort = new osc.UDPPort({
			localAddress: inAddress,
			localPort: inPort,
			remoteAddress: outAddress,
			remotePort: outPort,
			broadcast: true,
			metadata: true,
		})

		this.udpPort.open()

		this.udpPort.on('ready', () => {
			this.emit('ready')
		})

		this.udpPort.on('message', (packet) => {
			this.handleMessage(packet)
		})

		this.udpPort.on('bundle', (bundle) => {
			for (let packet of bundle.packets) {
				this.handleMessage(packet)
			}
		})

		this.udpPort.on('error', (err) => {
			this.emit('error', err)
		})

		if (listenTempo) {
			this.tempoPort = new osc.UDPPort({
				localAddress: inAddress,
				localPort: inPort + 1,
				remoteAddress: tempoAddress,
				remotePort: tempoPort,
				metadata: true,
			})

			this.tempoPort.open()

			this.tempoPort.on('ready', () => {
				this.tempoPort.send({
					address: '/hello',
					args: [],
				})
			})

			this.tempoPort.on('message', (packet) => {
				this.handleMessage(packet)
			})
		}
	}

	handleMessage = (packet) => {
		const address = packet.address
		const args = packet.args

		if (address.startsWith(OSC_ADDRESS.play)) {
			const message = {}
			for (var i = 0; i < args.length; i += 2) {
				message[args[i].value] = args[i + 1].value
			}

			if (this.addMididata) {
				message.octave =
					typeof message.octave === 'undefined' ? 5 : message.octave
				message.n = message.n || message.note || 0
				message.midinote = message.n + (message.octave + 1) * 12
			}

			this.emit('message', message)
		} else if (address.startsWith(OSC_ADDRESS.tempo)) {
			const data = {
				atCycle: args[0].value,
				cps: args[1].value,
				paused: args[2].value,
			}
			this.emit('tempo', data)
		}
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
					value: message,
				},
				{
					type: type,
					value: value,
				},
			],
		})
	}
}

module.exports = Tidal
