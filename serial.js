export class SerialManager {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.isConnected = false;
        this.onDataCallback = null;
        this.onStatusChangeCallback = null;
    }

    /**
     * Verify if browser support Web Serial API
     */
    isSupported() {
        return 'serial' in navigator;
    }

    /**
     * Callback for new data received
     */
    onData(callback) {
        this.onDataCallback = callback;
    }

    /**
     * Callback for connection status change
     */
    onStatusChange(callback) {
        this.onStatusChangeCallback = callback;
    }

    /**
     * Connect to serial port
     */
    async connect() {
        if (!this.isSupported()) {
            throw new Error('Web Serial API not supported in this browser');
        }

        try {
            // Request port from user
            this.port = await navigator.serial.requestPort();

            // Standard parameters for Arduino
            await this.port.open({
                baudRate: 9600,
                dataBits: 8,
                stopBits: 1,
                parity: 'none'
            });

            this.isConnected = true;
            this.notifyStatusChange(true);

            this.startReading();

        } catch (error) {
            console.error('Error during connection:', error);
            throw error;
        }
    }

    /**
     * Disconnect from serial port
     */
    async disconnect() {
        if (this.reader) {
            await this.reader.cancel();
            this.reader = null;
        }

        if (this.port) {
            await this.port.close();
            this.port = null;
        }

        this.isConnected = false;
        this.notifyStatusChange(false);
    }

    /**
     * Read from serial port
     */
    async startReading() {
        if (!this.port) return;

        try {
            const textDecoder = new TextDecoderStream();
            const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
            this.reader = textDecoder.readable.getReader();

            let buffer = '';

            while (true) {
                const { value, done } = await this.reader.read();

                if (done) {
                    break;
                }

                buffer += value;

                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep last incomplete line in buffer

                for (const line of lines) {
                    this.processLine(line.trim());
                }
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Errore durante la lettura:', error);
            }
        } finally {
            this.reader = null;
        }
    }

    /**
     * Expected format: "angle,distance" es: "90,245"
     */
    processLine(line) {
        if (!line) return;

        try {
            const parts = line.split(',');

            if (parts.length === 2) {
                const angle = parseInt(parts[0].trim());
                const distance = parseInt(parts[1].trim());

                if (!isNaN(angle) && !isNaN(distance)) {
                    if (angle >= 0 && angle <= 180 && distance >= 0) {
                        this.notifyData(angle, distance);
                    }
                }
            }
        } catch (error) {
            console.error('Error parsing line:', line, error);
        }
    }

    notifyData(angle, distance) {
        if (this.onDataCallback) {
            this.onDataCallback(angle, distance);
        }
    }

    notifyStatusChange(connected) {
        if (this.onStatusChangeCallback) {
            this.onStatusChangeCallback(connected);
        }
    }

    getConnectionStatus() {
        return this.isConnected;
    }
}
