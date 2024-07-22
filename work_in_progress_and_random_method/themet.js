//this program can take random images generated from picsum url and feed them into my particle function



const imgg ="https://picsum.photos/200/300?random=1"
//const lu = "40007/168566/"
// "https://collectionapi.metmuseum.org/api/collection/v1/iiif/" + lu +"main-image";

const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = 1000;
canvas.height = 1000;

ctx.fillStyle = 'white';
ctx.strokeStyle = 'white';
ctx.lineWidth = 1;

class Particle {
    constructor(effect){
        this.effect = effect;
        this.x = Math.floor(Math.random() * this.effect.width);
        this.y = Math.floor(Math.random() * this.effect.height);
        this.speedX;
        this.speedY;
        this.speedModifier = Math.floor(Math.random() * 2 + 1);
        this.history = [{x: this.x, y: this.y}];
        this.maxLength = Math.floor(Math.random() * 60 + 50);
        this.angle = 0;
        this.newAngle = 0;
        this.angleCorrector = Math.random() * 0.5 + 0.01;
        this.timer = this.maxLength * 2;
        this.red = 0;
        this.green = 0;
        this.blue = 0;
        this.color = 'rgb(' + this.red + ',' + this.green + ',' + this.blue + ')';
        this.path = []; // Array to store the path
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
    update(){
        this.timer--;
        if (this.timer >= 1){
            let x = Math.floor(this.x / this.effect.cellSize);
            let y = Math.floor(this.y / this.effect.cellSize);
            let index = y * this.effect.cols + x;

            let flowFieldIndex = this.effect.flowField[index];
            if (flowFieldIndex){
                // motion
                this.newAngle = flowFieldIndex.colorAngle;
                if (this.angle > this.newAngle){
                    this.angle -= this.angleCorrector;
                } else if (this.angle < this.newAngle){
                    this.angle += this.angleCorrector;
                } else {
                    this.angle = this.newAngle;
                }
                // color
                if (flowFieldIndex.alpha > 0){
                    this.red === flowFieldIndex.red ? this.red : this.red += (flowFieldIndex.red - this.red) * 0.1;
                    this.green === flowFieldIndex.green ? this.green : this.green += (flowFieldIndex.green - this.green) * 0.1;
                    this.blue === flowFieldIndex.blue ? this.blue : this.blue += (flowFieldIndex.blue - this.blue) * 0.1;
                    this.color = 'rgb(' + this.red + ',' + this.green + ',' + this.blue + ')';
                }

            }
    
            this.speedX = Math.cos(this.angle);
            this.speedY = Math.sin(this.angle);
            this.x += this.speedX * this.speedModifier;
            this.y += this.speedY * this.speedModifier;
    
            this.history.push({x: this.x, y: this.y});
            if (this.history.length > this.maxLength){
                this.history.shift();
            }
        } else if (this.history.length > 1){
            this.history.shift();
        } else {
            this.reset();
        }
        this.path.push({x: this.x, y: this.y});
        if (this.path.length > this.maxLength){
            this.path.shift();
        }

    }
    reset(){
        let attempts = 0;
        let resetSuccess = false;

        while (attempts < 30 && !resetSuccess){
            attempts++
            let testIndex = Math.floor(Math.random() * this.effect.flowField.length);
            if (this.effect.flowField[testIndex].alpha > 0){
                this.x = this.effect.flowField[testIndex].x;
                this.y = this.effect.flowField[testIndex].y;
                this.history = [{x: this.x, y: this.y}];
                this.timer = this.maxLength * 2;
                resetSuccess = true;
            }
        }
        if (!resetSuccess){
            this.x = Math.random() * this.effect.width;
            this.y = Math.random() * this.effect.height;
            this.history = [{x: this.x, y: this.y}];
            this.timer = this.maxLength * 2;
        }

this.path = [{x: this.x, y: this.y}];
    }
}

class Effect {
    constructor(canvas, ctx,imageUrl){
        this.canvas = canvas;
        this.context = ctx;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.particles = [];
        this.numberOfParticles = 3000;
        this.cellSize = 1;
        this.rows;
        this.cols;
        this.flowField = [];
        this.debug = false;
        this.imageUrl = imageUrl;
       
        this.loadImage(imageUrl);
      
       

        window.addEventListener('keydown', e => {
            if (e.key === 'd') this.debug = !this.debug;
        });

        window.addEventListener('resize', e => {
            //this.resize(e.target.innerWidth, e.target.innerHeight);
        });
    }
    loadImage(imageUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            this.image = img;
            this.init();
        };
        img.onerror = (e) => {
            console.error('Error loading image', e);
        };
        img.src = imageUrl;
    }
    drawFlowFieldImage(){
        let imageSize = this.width ;
        this.context.drawImage(this.image, this.width * 0.5 - imageSize * 0.5, this.height * 0.5 - imageSize * 0.5, imageSize, imageSize);
    }
    init(){
        // create flow field
         // draw image
         this.drawFlowFieldImage();

         //text
         
        this.rows = Math.floor(this.height / this.cellSize);
        this.cols = Math.floor(this.width / this.cellSize);
        this.flowField = [];

  


        // scan pixel data
        const pixels = this.context.getImageData(0, 0, this.width, this.height).data;
        console.log(pixels);
        for (let y = 0; y < this.height; y += this.cellSize){
            for (let x = 0; x < this.width; x += this.cellSize){
                const index = (y * this.width + x) * 4;
                const red = pixels[index];
                const green = pixels[index + 1];
                const blue = pixels[index + 2];
                const alpha = pixels[index + 3];
                const grayscale = (red + green + blue) / 3;
                const colorAngle = ((grayscale/256) * 6.28).toFixed(2);
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

        // create particles
        this.particles = [];
        for (let i = 0; i < this.numberOfParticles; i++){
            this.particles.push(new Particle(this));
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
            this.drawFlowFieldImage();
            this.drawText();
        }
        this.particles.forEach(particle => {
            particle.draw(this.context);
            particle.update();
        });
    }
    animate() {
        //this.context.clearRect(0, 0, this.width, this.height);
        this.render();
        requestAnimationFrame(this.animate.bind(this)); // Use bind to ensure 'this' refers to the Effect instance
    }
}

const effect = new Effect(canvas, ctx,imgg);


effect.animate();
