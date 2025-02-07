// Las clases Particle y Laser se mantienen igual...
class Particle {
    constructor(x, y, size) {
        this.speed = .8;
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * this.speed * 5;
        this.vy = (Math.random() - 0.5) * this.speed * 5;
        this.opacity = 1;
        this.size = size * (0.5 + Math.random());
    }

    draw(context) {
        this.opacity -= this.speed / 30; // Hacemos que las partículas desaparezcan más rápido
        context.fillStyle = `rgba(255, 100, 0, ${this.opacity})`;
        context.fillRect(this.x, this.y, this.size, this.size);
    }

    move() {
        this.x += this.vx;
        this.y += this.vy;
    }
}

class Laser {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    drawTo(x, y, ctx) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
        ctx.lineWidth = 2;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
}

class LaserWriter {
    constructor(canvasId, canvasId2) {
        let canvas = document.getElementById(canvasId);
        let canvas2 = document.getElementById(canvasId2);
        this.ctx = canvas.getContext("2d", { alpha: true });
        this.ctx2 = canvas2.getContext("2d", { alpha: true });

        this.w = canvas.width = canvas2.width = 900;
        this.h = canvas.height = canvas2.height = 200;

        this.pointsIndex = 0;
        this.points = [];
        this.particles = [];
        this.drawnPoints = [];
        this.size = 2;
        this.startX = 0;
        this.startY = 80;
        this.laserStart = { x: this.w / 2, y: 0 }; // Cambiamos el punto de inicio del láser a la izquierda
    }

    init(text, size) {
        this.ctx.clearRect(0, 0, this.w, this.h);
        this.ctx.font = `bold ${size}px 'Verdana'`;
        this.ctx.textBaseline = "top";
        this.ctx.fillStyle = "rgba(255, 255, 255, 1)";
        
        let textWidth = this.ctx.measureText(text).width;
        this.startX = (this.w - textWidth) / 2;
        
        this.ctx.fillText(text, this.startX, this.startY);
        
        let imageData = this.ctx.getImageData(0, 0, this.w, this.h);
        let pixels = imageData.data;
        
        // Recolectamos los puntos
        let tempPoints = [];
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                let index = (y * this.w + x) * 4;
                if (pixels[index + 3] > 0) {
                    tempPoints.push([x, y]);
                }
            }
        }

        // Ordenamos los puntos de izquierda a derecha y por proximidad
        this.points = tempPoints.sort((a, b) => {
            // Primero ordenamos por x
            let xDiff = a[0] - b[0];
            if (xDiff !== 0) return xDiff;
            // Si están en la misma x, ordenamos por y
            return a[1] - b[1];
        });
        
        this.ctx.clearRect(0, 0, this.w, this.h);
        this.laser = new Laser(this.laserStart.x, this.laserStart.y);
        
        this.pointsIndex = 0;
        this.drawnPoints = [];
        this.particles = [];
    }

    draw() {
        this.ctx2.clearRect(0, 0, this.w, this.h);
        
        // Dibujamos varios puntos por frame para aumentar la velocidad
        for(let i = 0; i < 15; i++) { // Aumentamos el número de puntos por frame
            if (this.pointsIndex < this.points.length) {
                let p = this.points[this.pointsIndex];
                let x = p[0];
                let y = p[1];
                
                this.laser.drawTo(x, y, this.ctx2);
                this.drawnPoints.push([x, y]);
                
                if (this.pointsIndex % 3 === 0) { // Reducimos la cantidad de partículas
                    let particle = new Particle(x, y, this.size);
                    this.particles.push(particle);
                }
                
                this.pointsIndex++;
            }
        }

        // Dibujamos todos los puntos acumulados
        this.ctx2.fillStyle = "rgba(255, 255, 255, 0.9)";
        this.drawnPoints.forEach(point => {
            this.ctx2.fillRect(point[0], point[1], this.size, this.size);
        });
        
        // Actualizamos las partículas
        this.particles = this.particles.filter(p => {
            p.move();
            if (p.opacity > 0) {
                p.draw(this.ctx2);
                return true;
            }
            return false;
        });
        
        if (this.pointsIndex < this.points.length) {
            requestAnimationFrame(() => this.draw());
        } else {
            // Final cleanup y continuación de partículas
            requestAnimationFrame(() => this.draw());
        }
    }
}

// El código de inicialización se mantiene igual
document.addEventListener("DOMContentLoaded", () => {
    const section = document.getElementById("laser-section");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                section.classList.add("visible");
                if (!window.laserWriterStarted) {
                    window.laserWriter = new LaserWriter("canvas", "canvas2");
                    window.laserWriter.init("Grabado Láser", 60);
                    window.laserWriter.draw();
                    window.laserWriterStarted = true;
                }
            }
        });
    }, { threshold: 0.5 });

    observer.observe(section);
});