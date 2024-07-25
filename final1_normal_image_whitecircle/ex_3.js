document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    let moonImage = new Image();
    let showBackground = true;
    let animationId;

    canvas.width = 1050;
    canvas.height = 700;
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;

    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 0.1;

    class Particle_ex3 {
        constructor(effect){
            this.effect = effect;
            this.x = Math.floor(Math.random() * this.effect.width);
            this.y = Math.floor(Math.random() * this.effect.height);
            this.speedX;
            this.speedY;
            //this.size = Math.random() * 0.003 + 0.1; // Adjust the size range as needed
            this.speedModifier = Math.random()*9+1 ; //Math.floor(Math.random() * 2 + 1);
            this.history = [{x: this.x, y: this.y}];
            this.maxLength = 200
            this.angle = 0;
            this.newAngle = 0;
            this.angleCorrector = Math.random() * 0.5 + 0.01;
            this.timer = this.maxLength * 2;
            this.red = 0;
            this.green = 0;
            this.blue = 0;
            this.color = 'rgb(' + this.red + ',' + this.green + ',' + this.blue + ')';
            this.path = [];
        }
        draw(context){
            context.beginPath();
            context.moveTo(this.history[0].x, this.history[0].y);
            for (let i = 0; i < this.history.length; i++){
                context.lineTo(this.history[i].x, this.history[i].y);
            }
            context.strokeStyle = this.color;
            context.stroke();
            context.beginPath();
            context.moveTo(this.path[0].x, this.path[0].y);
            for (let i = 1; i < this.path.length; i++){
                context.lineTo(this.path[i].x, this.path[i].y);
            }
            context.strokeStyle = this.color;
            context.stroke();
        }
        update() {
            this.timer--;
            if (this.timer >= 1) {
                this.angle += (Math.random() - 0.5) * this.angleCorrector;
                this.speedX = Math.cos(this.angle) * 0.5;
                this.speedY = Math.sin(this.angle) * 0.5;
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
        
        /*
        reset() {
            let attempts = 0;
            let resetSuccess = false;
        
            while (attempts < 30 && !resetSuccess) {
                attempts++;
                let testIndex = Math.floor(Math.random() * this.effect.flowField.length);
                if (this.effect.flowField[testIndex].alpha > 0) {
                    this.x = this.effect.flowField[testIndex].x;
                    this.y = this.effect.flowField[testIndex].y;
                    this.history = [{ x: this.x, y: this.y }];
                    this.timer = this.maxLength * 2;
                    this.red = this.effect.flowField[testIndex].red;
                    this.green = this.effect.flowField[testIndex].green;
                    this.blue = this.effect.flowField[testIndex].blue;
                    this.color = `rgb(${this.red}, ${this.green}, ${this.blue})`;
                    resetSuccess = true;
                }
            }
            if (!resetSuccess) {
                this.x = Math.random() * this.effect.width;
                this.y = Math.random() * this.effect.height;
                this.history = [{ x: this.x, y: this.y }];
                this.timer = this.maxLength * 2;
            }
            this.path = [{ x: this.x, y: this.y }];
        }
            */
        reset() {
            let attempts = 0;
            let resetSuccess = false;

            while (attempts < 30 && !resetSuccess) {
                attempts++;
                let testIndex = Math.floor(Math.random() * this.effect.flowField.length);
                let flowFieldPixel = this.effect.flowField[testIndex];

                let brightness = (flowFieldPixel.red + flowFieldPixel.green + flowFieldPixel.blue) / 3;
                if (brightness < 180) {
                    this.x = flowFieldPixel.x;
                    this.y = flowFieldPixel.y;
                    this.history = [{ x: this.x, y: this.y }];
                    this.timer = this.maxLength * 2;
                    this.red = this.effect.flowField[testIndex].red;
                    this.green = this.effect.flowField[testIndex].green;
                    this.blue = this.effect.flowField[testIndex].blue;
                    this.color = `rgb(${this.red}, ${this.green}, ${this.blue})`;
                    resetSuccess = true;
                }
            }

            if (!resetSuccess) {
                this.x = Math.random() * this.effect.width;
                this.y = Math.random() * this.effect.height;
                this.history = [{ x: this.x, y: this.y }];
                this.timer = this.maxLength * 2;
            } else {
                this.path = [{ x: this.x, y: this.y }];
            }
        }
        
        
    }

    class Effect_ex3 {
        constructor(canvas, ctx){
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
            this.image = moonImage;
            this.init();
    
            window.addEventListener('keydown', e => {
                if (e.key === 'd') this.debug = !this.debug;
            });
    
            window.addEventListener('resize', e => {
                //this.resize(e.target.innerWidth, e.target.innerHeight);
            });
        }
        drawFlowFieldImage() {
            let imageSize = this.width * 1;
            this.context.drawImage(this.image, this.width * 0.5 - imageSize * 0.5, this.height * 0.5 - imageSize * 0.5, imageSize, imageSize);
        }
        
        
        
        init() {
            // Draw image to get pixel data
            this.drawFlowFieldImage();
            this.rows = Math.floor(this.height / this.cellSize);
            this.cols = Math.floor(this.width / this.cellSize);
            this.flowField = [];
        
            // Scan pixel data
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
        
            // Clear the visible canvas if the background should be hidden
            if (!showBackground) {
                this.context.clearRect(0, 0, this.width, this.height);
            }
        
            // Create particles
            this.particles = [];
            for (let i = 0; i < this.numberOfParticles; i++) {
                this.particles.push(new Particle_ex3(this));
            }
            this.particles.forEach(particle => particle.reset());
        }
        
        

        
        drawGrid(){
            this.context.save();
            this.context.strokeStyle = 'black';
            this.context.lineWidth = 0.3;
            for (let c = 0; c < this.cols; c++){
                this.context.beginPath();
                this.context.moveTo(this.cellSize * c, 0);
                this.context.lineTo(this.cellSize * c, this.height);
                this.context.stroke();
            }
            for (let r = 0; r < this.rows; r++){
                this.context.beginPath();
                this.context.moveTo(0, this.cellSize * r);
                this.context.lineTo(this.width, this.cellSize * r);
                this.context.stroke();
            }
            this.context.restore();
        }
        resize(width, height){
            this.canvas.width = width;
            this.canvas.height = height;
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            this.init();
        }
        render(){
            if (this.debug) {
                this.drawGrid();
            }
            this.particles.forEach(particle => {
                particle.draw(this.context);
                particle.update();
            });
        }
    }

    const effect = new Effect_ex3(canvas, ctx);

    function animate() {
        if (showBackground) {
            effect.render(offscreenCtx);
        } else {
            offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
            effect.particles.forEach(particle => {
                particle.draw(offscreenCtx);
                particle.update();
            });
        }
        ctx.drawImage(offscreenCanvas, 0, 0);
        animationId = requestAnimationFrame(animate);
    }

    document.getElementById('pauseButton').addEventListener('click', function () {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;

            const screenshotCanvas = document.createElement('canvas');
            const screenshotCtx = screenshotCanvas.getContext('2d');
            screenshotCanvas.width = canvas.width;
            screenshotCanvas.height = canvas.height;

            screenshotCtx.drawImage(canvas, 0, 0);

            const dataURL = screenshotCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = 'particle_trace.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
    document.getElementById('toggleBackgroundButton').addEventListener('click', function () {
        showBackground = !showBackground;
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before re-rendering
        if (showBackground) {
            effect.drawFlowFieldImage(); // Redraw the background image if the flag is set
        }
    });
    
    
    

    document.getElementById('startPerson').addEventListener('click', function () {
        if (!animationId) {
            animate();
        }
    });

    document.getElementById('uploadButton').addEventListener('click', function () {
        document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                moonImage.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('submitButton').addEventListener('click', function () {
        effect.init();
    });

    effect.init();

    function resizeBackground() {
        //document.body.style.backgroundImage = 'url("../work_in_progress_and_random_method/image/myart_layer1.png")';
        document.body.style.backgroundSize = `${canvas.width}px ${canvas.height}px`;
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
    }

    resizeBackground();
    window.addEventListener('resize', resizeBackground);
});
