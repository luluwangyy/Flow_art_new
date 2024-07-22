//this is the second layer of the flow (the moon!)
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('startSketch').addEventListener('click', function() {
        new p5(function (sketch) {
            let inc = 0.1;
            let scl = 10;
            let cols, rows;
            let zoff = 0;
            let particles = [];
            let flowfield;

            sketch.setup = function () {
                sketch.createCanvas(1350, 900);
                cols = sketch.floor(sketch.width / scl);
                rows = sketch.floor(sketch.height / scl);
                flowfield = new Array(cols * rows);

                let centerX = sketch.width / 2+300; // Center of the circle on the X axis
                let centerY = sketch.height / 2-200; // Center of the circle on the Y axis
                let radius = sketch.min(sketch.width, sketch.height) / 13; // Radius of the circle
                let totalParticles = 600; // Total number of particles to place along the circle's outline
                let angleStep = sketch.TWO_PI / totalParticles; // The step in angle between each particle
            
                for (let i = 0; i < totalParticles; i++) {
                    let angle = i * angleStep; // Current angle
            
                    // Calculate the x and y position based on the angle
                    let x = centerX + radius * sketch.cos(angle);
                    let y = centerY + radius * sketch.sin(angle);
            
                    // Create a new particle at the calculated position
                    particles.push(new Particle1(sketch, x, y, scl, cols));
                }
            };

            sketch.draw = function () {
                var yoff = 0;
                for (var y = 0; y < rows; y++) {
                    var xoff = 0;
                    for (var x = 0; x < cols; x++) {
                        var index = x + y * cols;
                        var angle = sketch.noise(xoff, yoff, zoff) * sketch.TWO_PI * 4;
                        var v = p5.Vector.fromAngle(angle);
                        v.setMag(1);
                        flowfield[index] = v;
                        xoff += inc;
                    }
                    yoff += inc;
                    zoff += 0.0003;
                }

                particles.forEach(particle => {
                    particle.follow(flowfield);
                    particle.update();
                    particle.edges();
                    particle.show();
                });
            };

            class Particle1 {
                constructor(sketch, x, y, scl, cols) {
                    this.sketch = sketch;
                    this.pos = sketch.createVector(x, y);
                    this.vel = sketch.createVector(0, 0);
                    this.acc = sketch.createVector(0, 0);
                    this.maxspeed = 30;
                    this.prevPos = this.pos.copy();
                    this.scl = scl;
                    this.cols = cols;
                }

                follow(vectors) {
                    let x = this.sketch.floor(this.pos.x / this.scl);
                    let y = this.sketch.floor(this.pos.y / this.scl);
                    let index = x + y * this.cols;
                    let force = vectors[index];
                    this.applyForce(force);
                }

                applyForce(force) {
                    this.acc.add(force);
                }

                update() {
                    this.vel.add(this.acc);
                    this.vel.limit(this.maxspeed);
                    this.pos.add(this.vel);
                    this.acc.mult(0);
                }

                show() {
                    this.sketch.stroke(255,100);
                    this.sketch.strokeWeight(1);
                    this.sketch.line(this.prevPos.x, this.prevPos.y, this.pos.x, this.pos.y);
                    this.updatePrev();
                }

                updatePrev() {
                    this.prevPos.x = this.pos.x;
                    this.prevPos.y = this.pos.y;
                }

                edges() {
                    if (this.pos.x > this.sketch.width) {
                        this.pos.x = 0;
                        this.updatePrev();
                    }
                    if (this.pos.x < 0) {
                        this.pos.x = this.sketch.width;
                        this.updatePrev();
                    }
                    if (this.pos.y > this.sketch.height) {
                        this.pos.y = 0;
                        this.updatePrev();
                    }
                    if (this.pos.y < 0) {
                        this.pos.y = this.sketch.height;
                        this.updatePrev();
                    }
                }
            }
        }, 'sketch-holder');
    });
});