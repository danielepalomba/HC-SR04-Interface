import { RadarDisplay } from './radar.js';
import { SerialManager } from './serial.js';
import { DataSimulator } from './simulator.js';

class RadarApp {
    constructor() {
        this.radar = null;
        this.serial = null;
        this.simulator = null;

        this.isSimulationMode = false;

        this.elements = {
            connectBtn: document.getElementById('connectBtn'),
            disconnectBtn: document.getElementById('disconnectBtn'),
            simulationToggle: document.getElementById('simulationToggle'),
            connectionStatus: document.getElementById('connectionStatus'),
            angleDisplay: document.getElementById('angleDisplay'),
            distanceDisplay: document.getElementById('distanceDisplay'),
            rangeDisplay: document.getElementById('rangeDisplay'),
            maxRange: document.getElementById('maxRange'),
            fadeTime: document.getElementById('fadeTime'),
            modeDescription: document.getElementById('modeDescription')
        };

        this.init();
    }

    init() {
        this.radar = new RadarDisplay('radarCanvas');
        this.serial = new SerialManager();
        this.simulator = new DataSimulator();

        this.setupEventListeners();

        this.setupCallbacks();

        if (!this.serial.isSupported()) {
            this.showWarning('Web Serial API non supportata. Usa Chrome, Edge o Opera.');
            this.elements.connectBtn.disabled = true;
        }

        console.log('Radar App inizializzata');
    }

    setupEventListeners() {
        this.elements.connectBtn.addEventListener('click', () => {
            this.connectSerial();
        });

        this.elements.disconnectBtn.addEventListener('click', () => {
            this.disconnectSerial();
        });

        this.elements.simulationToggle.addEventListener('change', (e) => {
            this.toggleSimulation(e.target.checked);
        });

        this.elements.maxRange.addEventListener('change', (e) => {
            const range = parseInt(e.target.value);
            this.radar.setMaxRange(range);
            this.elements.rangeDisplay.textContent = `${range} cm`;
        });

        this.elements.fadeTime.addEventListener('change', (e) => {
            const time = parseInt(e.target.value);
            this.radar.setFadeTime(time);
        });
    }

    setupCallbacks() {
        this.serial.onData((angle, distance) => {
            this.handleData(angle, distance);
        });

        this.serial.onStatusChange((connected) => {
            this.updateConnectionStatus(connected);
        });

        this.simulator.onData((angle, distance) => {
            this.handleData(angle, distance);
        });
    }

    async connectSerial() {
        try {
            this.elements.connectBtn.disabled = true;
            await this.serial.connect();
            this.elements.disconnectBtn.disabled = false;
            this.elements.simulationToggle.disabled = true;
        } catch (error) {
            console.error('Connection error:', error);
            this.showError('Could not connect to serial port');
            this.elements.connectBtn.disabled = false;
        }
    }

    async disconnectSerial() {
        try {
            this.elements.disconnectBtn.disabled = true;
            await this.serial.disconnect();
            this.elements.connectBtn.disabled = false;
            this.elements.simulationToggle.disabled = false;
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    }

    toggleSimulation(enabled) {
        this.isSimulationMode = enabled;

        if (enabled) {
            this.simulator.start();
            this.elements.connectBtn.disabled = true;
            this.elements.disconnectBtn.disabled = true;
            this.updateConnectionStatus(false, true);
            this.elements.modeDescription.textContent = 'Simulation mode active - generating test data';
        } else {
            this.simulator.stop();
            this.elements.connectBtn.disabled = false;
            this.updateConnectionStatus(false, false);
            this.elements.modeDescription.textContent = 'Switch to simulation mode to test without hardware';
        }
    }

    handleData(angle, distance) {
        this.radar.addDetection(angle, distance);

        this.elements.angleDisplay.textContent = `${angle}°`;
        this.elements.distanceDisplay.textContent = distance > 0 ? `${distance} cm` : '-- cm';
    }

    updateConnectionStatus(connected, simulating = false) {
        const indicator = this.elements.connectionStatus.querySelector('.status-indicator');
        const text = this.elements.connectionStatus.querySelector('.status-text');

        if (simulating) {
            indicator.className = 'status-indicator simulating';
            text.textContent = 'Simulating';
        } else if (connected) {
            indicator.className = 'status-indicator connected';
            text.textContent = 'Connected';
        } else {
            indicator.className = 'status-indicator disconnected';
            text.textContent = 'Disconnected';
        }
    }

    showWarning(message) {
        console.warn(message);
        alert('[!]' + message);
    }

    showError(message) {
        console.error(message);
        alert('[X]' + message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.radarApp = new RadarApp();
});
