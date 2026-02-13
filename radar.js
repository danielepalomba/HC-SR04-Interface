export class RadarDisplay {
    constructor(canvasId, maxRange = 400) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.maxRange = maxRange;
        this.currentAngle = 0;
        this.detections = []; // {angle, distance, timestamp, alpha}
        this.fadeTime = 3000; // ms
        this.isAnimating = false;

        this.setupCanvas();
        this.startAnimation();
    }

    setupCanvas() {
        const size = Math.min(window.innerWidth * 0.6, 700);
        this.canvas.width = size;
        this.canvas.height = size;
        this.centerX = size / 2;
        this.centerY = size / 2;
        this.radius = size / 2 - 40;

        // Handle resize
        window.addEventListener('resize', () => {
            const newSize = Math.min(window.innerWidth * 0.6, 700);
            this.canvas.width = newSize;
            this.canvas.height = newSize;
            this.centerX = newSize / 2;
            this.centerY = newSize / 2;
            this.radius = newSize / 2 - 40;
        });
    }

    setMaxRange(range) {
        this.maxRange = range;
    }

    setFadeTime(time) {
        this.fadeTime = time;
    }

    addDetection(angle, distance) {
        if (distance > 0 && distance <= this.maxRange) {
            this.detections.push({
                angle: angle,
                distance: distance,
                timestamp: Date.now(),
                alpha: 1.0
            });

            // Remove old detections
            const now = Date.now();
            this.detections = this.detections.filter(d =>
                now - d.timestamp < this.fadeTime
            );
        }

        this.currentAngle = angle;
    }

    startAnimation() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.animate();
    }

    animate() {
        if (!this.isAnimating) return;

        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    draw() {
        const ctx = this.ctx;

        ctx.fillStyle = '#0a0e1a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background grid
        this.drawGrid();

        // Draw range circles
        this.drawRangeCircles();

        // Draw angle lines
        this.drawAngleLines();

        // Draw detections with fade
        this.drawDetections();

        // Draw scanning beam
        this.drawBeam();

        // Draw center point
        this.drawCenter();
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.05)';
        ctx.lineWidth = 1;

        for (let x = 0; x < this.canvas.width; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
    }

    drawRangeCircles() {
        const ctx = this.ctx;
        const ranges = [0.25, 0.5, 0.75, 1.0];

        ranges.forEach((range, index) => {
            const r = this.radius * range;

            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, r, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();

            const rangeValue = Math.round(this.maxRange * range);
            ctx.fillStyle = 'rgba(0, 255, 136, 0.6)';
            ctx.font = '12px Rajdhani';
            ctx.textAlign = 'center';
            ctx.fillText(`${rangeValue}cm`, this.centerX, this.centerY - r - 5);
        });
    }

    drawAngleLines() {
        const ctx = this.ctx;
        const angles = [0, 30, 60, 90, 120, 150, 180];

        angles.forEach(angle => {
            const rad = (angle - 90) * Math.PI / 180;
            const x = this.centerX + this.radius * Math.cos(rad);
            const y = this.centerY + this.radius * Math.sin(rad);

            ctx.beginPath();
            ctx.moveTo(this.centerX, this.centerY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();

            const labelX = this.centerX + (this.radius + 20) * Math.cos(rad);
            const labelY = this.centerY + (this.radius + 20) * Math.sin(rad);
            ctx.fillStyle = 'rgba(0, 255, 136, 0.8)';
            ctx.font = 'bold 14px Orbitron';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${angle}°`, labelX, labelY);
        });
    }

    drawDetections() {
        const ctx = this.ctx;
        const now = Date.now();

        this.detections.forEach(detection => {
            const age = now - detection.timestamp;
            const alpha = 1 - (age / this.fadeTime);
            detection.alpha = Math.max(0, alpha);

            if (detection.alpha > 0) {
                // Convert to canvas coordinates
                const rad = (detection.angle - 90) * Math.PI / 180;
                const distanceRatio = detection.distance / this.maxRange;
                const x = this.centerX + this.radius * distanceRatio * Math.cos(rad);
                const y = this.centerY + this.radius * distanceRatio * Math.sin(rad);

                const gradient = ctx.createRadialGradient(x, y, 0, x, y, 10);
                gradient.addColorStop(0, `rgba(255, 59, 92, ${detection.alpha})`);
                gradient.addColorStop(0.5, `rgba(255, 59, 92, ${detection.alpha * 0.5})`);
                gradient.addColorStop(1, `rgba(255, 59, 92, 0)`);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, 10, 0, Math.PI * 2);
                ctx.fill();

                // Draw inner point
                ctx.fillStyle = `rgba(255, 255, 255, ${detection.alpha})`;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        this.detections = this.detections.filter(d => d.alpha > 0);
    }

    drawBeam() {
        const ctx = this.ctx;
        const rad = (this.currentAngle - 90) * Math.PI / 180;

        const gradient = ctx.createLinearGradient(
            this.centerX,
            this.centerY,
            this.centerX + this.radius * Math.cos(rad),
            this.centerY + this.radius * Math.sin(rad)
        );
        gradient.addColorStop(0, 'rgba(0, 255, 136, 0.5)');
        gradient.addColorStop(0.7, 'rgba(0, 255, 136, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');

        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY);
        ctx.arc(this.centerX, this.centerY, this.radius, rad - 0.2, rad);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        const x = this.centerX + this.radius * Math.cos(rad);
        const y = this.centerY + this.radius * Math.sin(rad);

        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowColor = 'rgba(0, 255, 136, 0.8)';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawCenter() {
        const ctx = this.ctx;

        const gradient = ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, 15
        );
        gradient.addColorStop(0, 'rgba(0, 255, 136, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    stop() {
        this.isAnimating = false;
    }
}
