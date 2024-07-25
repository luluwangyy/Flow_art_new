let uploadedImageUrl = "https://replicate.delivery/yhqm/5ZRaKEEVj74eTq2mu07TJ6Q7U71eu2CkQ10flQGhVtqylzXmA/out-0.jpg"; // Define this variable in the correct scope
let processedImageUrl = null; // Define this variable in the correct scope
let originalImage = new Image(); // Image object to hold the original uploaded image

document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    let moonImage = new Image();
    let showBackground = true;
    let animationId;
  
    canvas.width = 1619/1.4;
    canvas.height = 1199/1.4;
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
  
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 0.1;
  
    class Particle_ex4_up {
      constructor(effect){
        this.effect = effect;
        this.x = Math.floor(Math.random() * this.effect.width);
        this.y = Math.floor(Math.random() * this.effect.height);
        this.speedX;
        this.speedY;
        this.size = Math.random() * 0.03 + 0.1;
        this.speedModifier = Math.random() * 0.9 + 1;
        this.history = [{ x: this.x, y: this.y }];
        this.maxLength = 200;
        this.angle = Math.PI * 1.5; // Initially set to upwards
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
        if (this.history.length === 0) return;
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
           // if want straight line:this.angle += (Math.random() - 0.5) * (this.angleCorrector * 0.001);
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
      reset() {
        let attempts = 0;
        let resetSuccess = false;
      
        while (attempts < 30 && !resetSuccess) {
          attempts++;
          let testIndex = Math.floor(Math.random() * this.effect.flowField.length);
          let flowFieldPixel = this.effect.flowField[testIndex];
      
          let brightness = (flowFieldPixel.red + flowFieldPixel.green + flowFieldPixel.blue) / 3;
          if (brightness >= 230) {
            this.x = flowFieldPixel.x;
            this.y = flowFieldPixel.y;
            this.history = [{ x: this.x, y: this.y }];
            this.timer = this.maxLength * 2;
            this.red = this.effect.flowField[testIndex].red;
            this.green = this.effect.flowField[testIndex].green;
            this.blue = this.effect.flowField[testIndex].blue;
            this.color = `rgb(31, 141, 97)`;
            resetSuccess = true;
          }
        }
      
        if (!resetSuccess) {
          this.x = Math.random() * this.effect.width;
          this.y = Math.random() * this.effect.height;
          this.history = [{ x: this.x, y: this.y }];
          this.timer = this.maxLength * 2;
          this.red = Math.random() * 255;
          this.green = Math.random() * 255;
          this.blue = Math.random() * 255;
          this.color = `rgb(${this.red}, ${this.green}, ${this.blue},0)`;
        }
      
        if (this.history.length === 0) {
          this.history = [{ x: this.x, y: this.y }];
        }
        
        this.path = [{ x: this.x, y: this.y }];
      }
    }
  
    class Effect_ex4_up {
      constructor(canvas, ctx){
        this.canvas = canvas;
        this.context = ctx;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.particles = [];
        this.numberOfParticles = 100000;
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
        if (processedImageUrl) {
          this.image.src = processedImageUrl;
          this.image.onload = () => {
            this.drawFlowFieldImage();
            this.setupParticles();
          };
        } else {
          this.setupParticles();
        }
      }
      
      setupParticles() {
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
  
        if (!showBackground) {
          //this.context.clearRect(0, 0, this.width, this.height);
        }
  
        this.particles = [];
        for (let i = 0; i < this.numberOfParticles; i++) {
          this.particles.push(new Particle_ex4_up(this));
        }
        this.particles.forEach(particle => particle.reset());
      }
      
      drawGrid() {
        this.context.save();
        this.context.strokeStyle = 'black';
        this.context.lineWidth = 0.3;
        for (let c = 0; c < this.cols; c++) {
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
        }
        this.particles.forEach(particle => {
          particle.draw(this.context);
          particle.update();
        });
      }
    }
  
    const effect = new Effect_ex4_up(canvas, ctx);
  
    function animate() {
      //ctx.clearRect(0, 0, canvas.width, canvas.height);
      effect.render(offscreenCtx);
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
  
  
    document.getElementById('startPerson_up').addEventListener('click', function () {
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
          uploadedImageUrl = e.target.result;
          originalImage.src = uploadedImageUrl; // Set the original image src
          //moonImage.src = uploadedImageUrl;
        }
        reader.readAsDataURL(file);
      }
    });
  
    async function processImageWithAPI(imageUrl) {
      try {
        const response = await fetch('/canny_api', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl: imageUrl }),
        });
    
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const data = await response.json();
        const { cannyImageUrl } = data;
        processedImageUrl = cannyImageUrl;
        moonImage.crossOrigin = "Anonymous"; // Allow cross-origin images to be used
        moonImage.src = `/proxy?url=${encodeURIComponent(processedImageUrl)}`; // Use the proxy to load the image
        moonImage.onload = function () {
          effect.init(); // Re-initialize the effect with the new image
        };
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }
      
    document.getElementById('submitButton').addEventListener('click', async function () {
      if (uploadedImageUrl) {
        drawOriginalImage(uploadedImageUrl);
        await processImageWithAPI(uploadedImageUrl);
      }
    });

    document.getElementById('toggleBackgroundButton').addEventListener('click', function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      //drawOriginalImage(uploadedImageUrl);
      effect.init();
    });

    function drawOriginalImage(uploadedImageUrl) {
      const canvas = document.getElementById('canvas1');
      const ctx = canvas.getContext('2d');
      originalImage.src = uploadedImageUrl; // Ensure the original image is loaded
      originalImage.onload = function () {
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
        //effect.init(); // Draw the original image as the background
      };
      
    }
    
    effect.init();
  
    function resizeBackground() {
      document.body.style.backgroundSize = `${canvas.width}px ${canvas.height}px`;
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
    }
  
    resizeBackground();
    window.addEventListener('resize', resizeBackground);
});
