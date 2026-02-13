export class DataSimulator {
    constructor() {
        this.isRunning = false;
        this.currentAngle = 0;
        this.direction = 1; // 1 = forward, -1 = backward
        this.intervalId = null;
        this.onDataCallback = null;
        this.scanSpeed = 50; // ms between steps
        this.angleStep = 1; // degrees per step

        // Virtual objects
        this.obstacles = this.generateObstacles();
    }

    /**
     * Random obstacles
     */
    generateObstacles() {
        const obstacles = [];
        const numObstacles = 5 + Math.floor(Math.random() * 5);

        for (let i = 0; i < numObstacles; i++) {
            obstacles.push({
                angle: Math.floor(Math.random() * 180),
                distance: 50 + Math.floor(Math.random() * 300),
                width: 10 + Math.floor(Math.random() * 20) // angular width
            });
        }

        return obstacles;
    }

    onData(callback) {
        this.onDataCallback = callback;
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.currentAngle = 0;
        this.direction = 1;
        this.obstacles = this.generateObstacles();

        this.intervalId = setInterval(() => {
            this.step();
        }, this.scanSpeed);
    }

    stop() {
        this.isRunning = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Single step of simulation
     */
    step() {
        this.currentAngle += this.angleStep * this.direction;

        // Invert direction at limits
        if (this.currentAngle >= 180) {
            this.currentAngle = 180;
            this.direction = -1;
        } else if (this.currentAngle <= 0) {
            this.currentAngle = 0;
            this.direction = 1;
        }

        const distance = this.calculateDistance(this.currentAngle);

        this.notifyData(this.currentAngle, distance);
    }

    /**
     * Calculate distance based on virtual obstacles
     */
    calculateDistance(angle) {
        let minDistance = 400; // Maximum distance (no obstacle)

        // Check if angle intersects any obstacle
        for (const obstacle of this.obstacles) {
            const angleDiff = Math.abs(angle - obstacle.angle);

            if (angleDiff <= obstacle.width) {
                // Calculate distance with some noise
                const noise = (Math.random() - 0.5) * 10;
                const distance = Math.max(0, obstacle.distance + noise);

                if (distance < minDistance) {
                    minDistance = distance;
                }
            }
        }

        // Add background noise even when there are no obstacles
        if (minDistance === 400 && Math.random() < 0.05) {
            // 5% probability of spurious readings
            minDistance = 100 + Math.floor(Math.random() * 300);
        }

        return Math.round(minDistance);
    }

    notifyData(angle, distance) {
        if (this.onDataCallback) {
            this.onDataCallback(angle, distance);
        }
    }

    setScanSpeed(speed) {
        this.scanSpeed = speed;

        if (this.isRunning) {
            this.stop();
            this.start();
        }
    }

    regenerateObstacles() {
        this.obstacles = this.generateObstacles();
    }

    getStatus() {
        return this.isRunning;
    }
}
