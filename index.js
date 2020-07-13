'use strict'

const EventEmitter = require('events')
const osc = require('osc')
const { timeStamp } = require('console')

const OSC_ADDRESS = {
	ctrl: '/ctrl',
	play: '/play2',
	tempoRequest: '/hello',
	tempo: '/cps/cycle',
	notifyRequest: '/notify',
	rms: '/rms',
}

const OPTION_DEFAULTS = {
	inAddress: '127.0.0.1',
	inPort: 57120,
	outAddress: '127.0.0.1',
	outPort: 6010,
	addressPattern: OSC_ADDRESS.play,
	addMidiData: false,
	listenTempo: false,
	tempoAddress: '127.0.0.1',
	tempoPort: 9160,
	listenRms: false,
	rmsAddress: '127.0.0.1',
	rmsPort: 57110,
}

class Tidal extends EventEmitter {
	constructor(options = {}) {
		super()

		const {
			// UDP/OSC input and output ports for communicating with TidalCycles
			inAddress = OPTION_DEFAULTS.inAddress,
			inPort = OPTION_DEFAULTS.inPort,
			outAddress = OPTION_DEFAULTS.outAddress,
			outPort = OPTION_DEFAULTS.outPort,
			addressPattern = OPTION_DEFAULTS.addressPattern,
			// Add extra inferred MIDI information to TidalCycles messages
			addMidiData = OPTION_DEFAULTS.addMidiData,
			// Listen to tempo messages sent by TidalCycles
			listenTempo = OPTION_DEFAULTS.listenTempo,
			tempoAddress = OPTION_DEFAULTS.tempoAddress,
			tempoPort = OPTION_DEFAULTS.tempoPort,
			// Listen to RMS messages sent by SuperDirt
			listenRms = OPTION_DEFAULTS.listenRms,
			rmsAddress = OPTION_DEFAULTS.rmsAddress,
			rmsPort = OPTION_DEFAULTS.rmsPort,
		} = options

		this.addressPattern = addressPattern
		this.addMidiData = addMidiData

		this.connectTidal(inAddress, inPort, outAddress, outPort)

		if (listenTempo) {
			this.connectTempo(inAddress, inPort + 1, tempoAddress, tempoPort)
		}

		if (listenRms) {
			this.connectRms(inAddress, inPort + 2, rmsAddress, rmsPort)
		}
	}

	connectTidal = (inAddress, inPort, outAddress, outPort) => {
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
	}

	connectTempo = (inAddress, inPort, tempoAddress, tempoPort) => {
		this.tempoPort = new osc.UDPPort({
			localAddress: inAddress,
			localPort: inPort,
			remoteAddress: tempoAddress,
			remotePort: tempoPort,
			metadata: true,
		})

		this.tempoPort.open()

		this.tempoPort.on('ready', () => {
			// Enable TidalCycles tempo messages
			this.tempoPort.send({
				address: OSC_ADDRESS.tempoRequest,
				args: [],
			})
		})

		this.tempoPort.on('message', (packet) => {
			this.handleMessage(packet)
		})
	}

	connectRms = (inAddress, inPort, rmsAddress, rmsPort) => {
		this.rmsPort = new osc.UDPPort({
			localAddress: inAddress,
			localPort: inPort,
			remoteAddress: rmsAddress,
			remotePort: rmsPort,
			metadata: true,
		})

		this.rmsPort.open()

		this.rmsPort.on('ready', () => {
			// Enable SuperCollider notifications
			this.rmsPort.send({
				address: OSC_ADDRESS.notifyRequest,
				args: [
					{
						type: 'i',
						value: 1,
					},
				],
			})
		})

		this.rmsPort.on('message', (packet) => {
			this.handleMessage(packet)
		})
	}

	handleMessage = (packet) => {
		const address = packet.address
		const args = packet.args

		switch (address) {
			case this.addressPattern:
				const message = {}
				for (var i = 0; i < args.length; i += 2) {
					message[args[i].value] = args[i + 1].value
				}

				if (this.addMidiData) {
					message.octave =
						typeof message.octave === 'undefined'
							? 5
							: message.octave
					message.n = message.n || message.note || 0
					message.midinote = message.n + (message.octave + 1) * 12
				}

				this.emit('message', message)
				break
			case OSC_ADDRESS.tempo:
				const tempo = {
					atCycle: args[0].value,
					cps: args[1].value,
					paused: args[2].value,
				}
				this.emit('tempo', tempo)
				break
			case OSC_ADDRESS.rms:
				const rms = {
					orbit: args[1].value,
					channels: [],
				}

				for (var i = 2; i < args.length; i += 2) {
					rms.channels.push({
						peak: args[i].value,
						power: args[i + 1].value,
					})
				}
				this.emit('rms', rms)
				break
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
