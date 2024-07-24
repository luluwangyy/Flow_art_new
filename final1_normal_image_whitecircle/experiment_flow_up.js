//success to make particle follow upward, and match to the color in the starting point
//also success to make certain color to be the starting point
//next step -- 1. make the particles flowy wave but ultimately is going up;2. explore how to let ai decide where and which direction to flow
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('startPerson').addEventListener('click', function() {
        const canvas = document.getElementById('canvas1');
        const ctx = canvas.getContext('2d');

        const offscreenCanvas = document.createElement('canvas');
        const offscreenCtx = offscreenCanvas.getContext('2d');

        canvas.width = 1050;
        canvas.height = 700;

        offscreenCanvas.width = canvas.width / 50;
        offscreenCanvas.height = canvas.height / 2;

        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 0.1;

        class Particle_person {
            constructor(effect) {
                this.effect = effect;
                this.size = Math.random() * 0.3 + 1; // Adjust the size range as needed
                this.speedModifier = Math.random() * 0.1 + 1;
                this.history = [];
                this.maxLength = 500;
                //this.angle = 0; set to right horizontal
                this.angle = Math.PI * 1.5; // Initially set to upwards
                this.angleCorrector = Math.random() * 0.1 + 0.00; // Smaller angle correction for smoother movement
                this.timer = this.maxLength * 2;//this controll how long disappear: 0.9 is quite weird
                this.path = [];
                this.reset();
            }
            draw(context) {
                context.beginPath();
                context.moveTo(this.history[0].x, this.history[0].y);
                for (let i = 0; i < this.history.length; i++) {
                    context.lineTo(this.history[i].x, this.history[i].y);
                }
                context.strokeStyle = this.color;
                context.stroke();

                context.beginPath();
                context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                context.fillStyle = this.color;
                context.fill();
            }
            update() {
                this.timer--;
                if (this.timer >= 1) {
                    // Adjust angle slightly for randomness while keeping it generally upwards
                    this.angle += (Math.random() - 0.5) * this.angleCorrector;

                    this.speedX = Math.cos(this.angle) * 0.04; // Change the speed of the particle
                    this.speedY = Math.sin(this.angle) * 0.04; // Change the speed of the particle
                    this.x += this.speedX * this.speedModifier;
                    this.y += this.speedY * this.speedModifier;

                    this.history.push({ x: this.x, y: this.y });
                    if (this.history.length > this.maxLength) {
                        this.history.shift();
                    }
                } else if (this.history.length > 1) {
                    this.history.shift();
                } else {
                    this.reset();
                }
                this.path.push({ x: this.x, y: this.y });
                if (this.path.length > this.maxLength) {
                    this.path.shift();
                }
            }
            reset() {
                let attempts = 0;
                let resetSuccess = false;

                while (attempts < 30 && !resetSuccess) {
                    attempts++;
                    let testIndex = Math.floor(Math.random() * this.effect.flowField.length);
                    let flowFieldPixel = this.effect.flowField[testIndex];
                    /*
                    let brightness = (flowFieldPixel.red + flowFieldPixel.green + flowFieldPixel.blue) / 3;
                    if (brightness >= 235) {
                        this.x = flowFieldPixel.x;
                        this.y = flowFieldPixel.y;
                        this.history = [{ x: this.x, y: this.y }];
                        this.timer = this.maxLength * 2;
                        resetSuccess = true;
                    }
                    
                   only reddish color:
                    if (flowFieldPixel.red > 150 && flowFieldPixel.red > flowFieldPixel.green * 1.5 && flowFieldPixel.red > flowFieldPixel.blue * 1.5) {
                        this.x = flowFieldPixel.x;
                        this.y = flowFieldPixel.y;
                        this.history = [{ x: this.x, y: this.y }];
                        this.timer = this.maxLength * 2;
                        this.red = flowFieldPixel.red;
                        this.green = flowFieldPixel.green;
                        this.blue = flowFieldPixel.blue;
                        this.color = `rgb(${this.red}, ${this.green}, ${this.blue})`;
                        resetSuccess = true;
                    }
                        */

                    // Only greenish color:
                    if (
                        (flowFieldPixel.green > 50 && flowFieldPixel.green > flowFieldPixel.red * 1.1 && flowFieldPixel.green > flowFieldPixel.blue * 1.1) || 
                        (flowFieldPixel.green > 50 && flowFieldPixel.red > 50 && flowFieldPixel.green > flowFieldPixel.blue * 1.1)
                    ) {
                        this.x = flowFieldPixel.x;
                        this.y = flowFieldPixel.y;
                        this.history = [{ x: this.x, y: this.y }];
                        this.timer = this.maxLength * 2;
                        this.red = flowFieldPixel.red;
                        this.green = flowFieldPixel.green;
                        this.blue = flowFieldPixel.blue;
                        this.color = `rgb(${this.red}, ${this.green}, ${this.blue})`;
                        resetSuccess = true;
                    }
                }

                if (!resetSuccess) {
                    this.reset(); // Try resetting again if no valid position found
                } else {
                    this.path = [{ x: this.x, y: this.y }];
                }
            }
        }

        class Effect_person {
            constructor(canvas, ctx) {
                this.canvas = canvas;
                this.context = ctx;
                this.width = this.canvas.width;
                this.height = this.canvas.height;
                this.particles = [];
                this.numberOfParticles = 10000;
                this.cellSize = 1;
                this.rows;
                this.cols;
                this.flowField = [];
                this.debug = false;
                this.image = document.getElementById('moon');
                this.init();

                window.addEventListener('keydown', e => {
                    if (e.key === 'd') this.debug = !this.debug;
                });

                window.addEventListener('resize', e => {});
            }

            drawFlowFieldImage() {
                let imageSize = this.width * 1;
                this.context.drawImage(this.image, this.width * 0.5 - imageSize * 0.5, this.height * 0.5 - imageSize * 0.5, imageSize, imageSize);
            }
            init() {
                this.drawFlowFieldImage();
                this.rows = Math.floor(this.height / this.cellSize);
                this.cols = Math.floor(this.width / this.cellSize);
                this.flowField = [];

                const pixels = this.context.getImageData(0, 0, this.width, this.height).data;
                for (let y = 0; y < this.height; y += this.cellSize) {
                    for (let x = 0; x < this.width; x += this.cellSize) {
                        const index = (y * this.width + x) * 4;
                        const red = pixels[index];
                        const green = pixels[index + 1];
                        const blue = pixels[index + 2];
                        const alpha = pixels[index + 3];
                        const grayscale = (red + green + blue) / 3;
                        const colorAngle = ((grayscale / 256) * 6.28).toFixed(2);
                        this.flowField.push({
                            x: x,
                            y: y,
                            red: red,
                            green: green,
                            blue: blue,
                            alpha: alpha,
                            colorAngle: colorAngle
                        });
                    }
                }

                this.particles = [];
                for (let i = 0; i < this.numberOfParticles; i++) {
                    this.particles.push(new Particle_person(this));
                }
                this.particles.forEach(particle => particle.reset());
            }
            drawGrid() {
                this.context.save();
                this.context.strokeStyle = 'black';
                this.context.lineWidth = 0.1;
                for (let c = 0; c < this.cols; c++) {
                    this.context.beginPath();
                    this.context.moveTo(this.cellSize * c, 0);
                    this.context.lineTo(this.cellSize * c, this.height);
                    this.context.stroke();
                }
                for (let r = 0; r < this.rows; r++) {
                    this.context.beginPath();
                    this.context.moveTo(0, this.cellSize * r);
                    this.context.lineTo(this.width, this.cellSize * r);
                    this.context.stroke();
                }
                this.context.restore();
            }
            resize(width, height) {
                this.canvas.width = width;
                this.canvas.height = height;
                this.width = this.canvas.width;
                this.height = this.canvas.height;
                this.init();
            }
            render() {
                if (this.debug) {
                    this.drawGrid();
                    this.drawFlowFieldImage();
                }
                this.particles.forEach(particle => {
                    particle.draw(this.context);
                    particle.update();
                });
            }
        }

        const effect = new Effect_person(canvas, ctx);

        function animate() {
            effect.render(offscreenCtx);
            ctx.drawImage(offscreenCanvas, 0, 0);
            requestAnimationFrame(animate);
        }

        animate();
    });
});
