//success-- particles only start when color's darkness is less than 100 -- success with black circle
//next step -- control the direction of the particles after departing from the starting point -- all flowing upwards with a bit randomness flowy wave but ultimately is going up !
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
                this.speedModifier = Math.random() * 0.2 + 1;
                this.history = [];
                this.maxLength = 2000;
                this.angle = 0;
                this.newAngle = 0;
                this.angleCorrector = Math.random() * 0.5 + 0.01;
                this.timer = this.maxLength * 2;
                this.red = 0;
                this.green = 0;
                this.blue = 0;
                this.color = `rgb(${this.red}, ${this.green}, ${this.blue})`;
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
                context.moveTo(this.path[0].x, this.path[0].y);
                for (let i = 1; i < this.path.length; i++) {
                    context.lineTo(this.path[i].x, this.path[i].y);
                }
                context.strokeStyle = this.color;
                context.stroke();
            }
            update() {
                this.timer--;
                if (this.timer >= 1) {
                    let x = Math.floor(this.x / this.effect.cellSize);
                    let y = Math.floor(this.y / this.effect.cellSize);
                    let index = y * this.effect.cols + x;

                    let flowFieldIndex = this.effect.flowField[index];
                    if (flowFieldIndex) {
                        this.newAngle = flowFieldIndex.colorAngle;
                        if (this.angle > this.newAngle) {
                            this.angle -= this.angleCorrector;
                        } else if (this.angle < this.newAngle) {
                            this.angle += this.angleCorrector;
                        } else {
                            this.angle = this.newAngle;
                        }
                        if (flowFieldIndex.alpha > 0) {
                            this.red += (flowFieldIndex.red - this.red) * 0.1;
                            this.green += (flowFieldIndex.green - this.green) * 0.1;
                            this.blue += (flowFieldIndex.blue - this.blue) * 0.1;
                            this.color = `rgb(${this.red}, ${this.green}, ${this.blue})`;
                        }
                    }

                    this.speedX = Math.cos(this.angle);
                    this.speedY = Math.sin(this.angle);
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

                    let brightness = (flowFieldPixel.red + flowFieldPixel.green + flowFieldPixel.blue) / 3;
                    if (brightness < 100) {
                        this.x = flowFieldPixel.x;
                        this.y = flowFieldPixel.y;
                        this.history = [{ x: this.x, y: this.y }];
                        this.timer = this.maxLength * 2;
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
                this.context.strokeStyle = 'white';
                this.context.lineWidth = 0.3;
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
