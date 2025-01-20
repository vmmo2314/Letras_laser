class Particle {
    constructor(x, y, size) {
        this.speed = 0.4;
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * this.speed;
        this.vy = (Math.random() - 0.5) * this.speed;
        this.opacity = 1;
        this.size = size;
    }

    draw(context) {
        this.opacity -= this.speed / 100;
        context.fillStyle = `rgba(255, 255, 255, ${this.opacity})`; // Cambiado a blanco
        context.fillRect(this.x, this.y, this.size, this.size);
    }

    move(){
        this.x += this.vx;
        this.y += this.vy + (1 - this.opacity) * this.speed;
    }
}

class Laser {
    constructor(x,y){
        this.x = x;
        this.y = y;
        this.steps = [];
        this.particles = [];
        
    }

    drawTo(x,y,ctx){
        ctx.beginPath();
        ctx.moveTo(this.x,this.y);
        ctx.lineTo(x,y);
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; // Cambiado a blanco con transparencia
        ctx.fillRect(x,y,0.5,0.5); // Reducido el tamaño del punto
    }

    drawEnd(ctx){
        var p = this.steps.shift();
        if (p != undefined){
            this.drawTo(p[0],p[1],ctx);
        } else {
            var index = this.particles.length;
            while(index--){
                var particle = this.particles[index];
                particle.move();
                if (particle.opacity < 0 || particle.x < 0 || particle.x > this.w || particle.y < 0 || particle.y > this.h){
                    this.particles.splice(index,1);
                } else {
                    particle.draw(ctx);
                }
            }
        }
    }

    endFrom(x0, y0){
        var nrOfSteps = 1000;
        var i = nrOfSteps;

        while (i--){
            var x = this.x + i * (x0 - this.x) / nrOfSteps + Math.cos(i / 10) * i / 4;
            var y = this.y + i * (y0 - this.y) / nrOfSteps + Math.sin(i / 10) * i / 4;
            this.steps.push([x,y]);

            if(i < 100){
                this.particles.push(new Particle(this.x, this.y, )); // Reducido el tamaño de las partículas
            }
        }
    }
}

class LaserWriter {
    constructor(canvasId, canvasId2){
        var canvas = document.getElementById(canvasId);
        var canvas2 = document.getElementById(canvasId2);
        this.ctx = canvas.getContext("2d"); 
        this.ctx2 = canvas2.getContext("2d");
        this.w = canvas.width = canvas2.width = 900;
        this.h = canvas.height = canvas2.height = 500;

        this.tick = 0;
        this.pointsIndex = 0;   
        this.points = [];
        this.particles = [];
        this.size = 1.5; // Reducido el tamaño base
        this.startX = 0;   
        this.laserStart = { x: 300, y:50};
        this.x = 0;
        this.y = 0;
    }

    init(text, size){
        // Configuración mejorada de la fuente
        this.ctx.font = size + "px 'Helvetica Neue'"; // Fuente más delgada
        this.ctx.textBaseline = "top";
        this.startX = (this.w - this.ctx.measureText(text).width * 2) * 0.5; // Ajustado el factor de escala
        this.ctx.fillText(text, 1, 100);
        
        var width = 500;
        var height = 300;
        var image = this.ctx.getImageData(0, 0, width, height);
        var buffer32 = new Uint32Array(image.data.buffer);

        // Aumentada la densidad de puntos
        for (var x = 0; x < width; x += 1){
            for (var y = 0; y < height; y += 1){
                if (buffer32[y * width + x]){
                    this.points.push([x, y]);
                }
            }
        }
        
        this.ctx.clearRect(0,0,this.w,this.h);
        this.ctx.fillStyle = "white";
        this.ctx2.strokeStyle = "rgba(255, 255, 255, 0.8)"; // Línea más suave
        this.ctx2.lineCap = "round";
        this.ctx2.lineWidth = 1.5; // Línea más delgada

        // Efecto de resplandor reducido
        this.ctx2.shadowBlur = 10;
        this.ctx2.shadowColor = "rgba(255, 255, 255, 0.5)";

        this.laser = new Laser(this.laserStart.x, this.laserStart.y);
    }
    
    draw(){
        this.ctx2.clearRect(0,0,this.w,this.h);
    
        if(this.pointsIndex < this.points.length){
            var p = this.points[this.pointsIndex];
            this.x = p[0] * this.size + this.startX;
            this.y = p[1] * this.size + 80;
    
            this.drawPointAt(this.x, this.y);
            this.laser.drawTo(this.x, this.y, this.ctx2);
    
            if (this.tick % 2 == 0){
                var particle = new Particle(this.x, this.y, this.size);
                this.particles.push(particle);
            }
    
            if(this.pointsIndex === this.points.length - 1){
                this.laser.endFrom(this.x, this.y);
            }else{
                this.laser.drawEnd(this.ctx2);
            }
            
            this.drawParticles();
            this.pointsIndex++;
            this.tick++;
    
            if(this.tick % 3 === 0) {
                requestAnimationFrame(() => this.draw());
            }else{
                this.draw();
            }
        }else {
            // Continuar dibujando partículas cada 3 veces
            this.drawParticles();
            this.tick++;
    
            if(this.tick % 3 === 0) {
                requestAnimationFrame(() => this.draw());
            }else{
                this.draw();
            }
        }
    }
    

    drawPointAt(x,y){
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.size, 0, Math.PI * 2, false);
        this.ctx.fill();
    }

    drawParticles(){
        var index = this.particles.length;
        while (index--){
            var p = this.particles[index];
            p.move();
            if(p.opacity < 0 || p.x < 0 || p.x > this.w || p.y < 0 || p.y > this.h){
                this.particles.splice(index, 1);
            }else{
                p.draw(this.ctx2);
            }
        }
    }
}

// Inicialización con tamaño de fuente más pequeño
var laserWriter = new LaserWriter("canvas", "canvas2");
laserWriter.init("Grabado láser", 30); // Reducido el tamaño de la fuente
laserWriter.draw();