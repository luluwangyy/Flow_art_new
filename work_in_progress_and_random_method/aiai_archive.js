//old version (have bugs -- can only generate AI image but not the diffusive effect)
//this program take user input and generate image through stable diffusion API
document.getElementById('imageForm').addEventListener('submit', function (event) {
    event.preventDefault();
  
    const textInput = document.getElementById('textInput').value;
  
    fetch(
        "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
        {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ inputs: textInput }),
        }
    )
        .then((res) => res.blob())
        .then((blob) => {
          const imageContainer = document.getElementById('imageContainer');
          imageContainer.innerHTML = ''; // Clear previous image
          const img = document.createElement('img');
          const imageUrl = window.URL.createObjectURL(blob); // Create a URL for the blob
          img.src = imageUrl;
          imageContainer.appendChild(img);
      
          console.log(imageUrl); // Log the image URL to the console
  
  
  const canvas = document.getElementById('canvas1');
  const ctx = canvas.getContext('2d');
  
  const offscreenCanvas = document.createElement('canvas');
  const offscreenCtx = offscreenCanvas.getContext('2d');
  
  canvas.width = 1050;
  canvas.height = 700;
  
  offscreenCanvas.width = canvas.width;
  offscreenCanvas.height = canvas.height;
  /*
  document.getElementById('imagePathInput').addEventListener('input', function() {
      const userInput = this.value;
  
      // Set the user input as the src attribute of the img tag
      document.getElementById('dynamicImage').src = userInput;
  });
  */
  // canvas settings
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 0.2;// change the width of the stroke!!!
  
  class Particle {
      constructor(effect){
          this.effect = effect;
          this.x = Math.floor(Math.random() * this.effect.width);
          this.y = Math.floor(Math.random() * this.effect.height);
          this.speedX;
          this.speedY;
          this.speedModifier = Math.random()*3+1 ; //Math.floor(Math.random() * 2 + 1);
          this.history = [{x: this.x, y: this.y}];
          this.maxLength = 400//Math.floor(Math.random() * 60+50);//can change (Math.random() * 60+50)
          //this varible will change the length of each line
          //set it larger so the trace can be preserved
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
      constructor(canvas, ctx){
          this.canvas = canvas;
          this.context = ctx;
          this.width = this.canvas.width;
          this.height = this.canvas.height;
          this.particles = [];
          this.numberOfParticles = 5000;
          this.cellSize = 1;//if change larger, the row and columm will have larger gap
          this.rows;
          this.cols;
          this.flowField = [];
          this.debug = false;
          this.image = img.src;
          this.init();
  
          window.addEventListener('keydown', e => {
              if (e.key === 'd') this.debug = !this.debug;
          });
  
          window.addEventListener('resize', e => {
              //this.resize(e.target.innerWidth, e.target.innerHeight);
          });
      }
      drawText(){
          this.context.font = '450px Impact';
          this.context.textAlign = 'center';
          this.context.textBaseline = 'middle';
  
          const gradient1 = this.context.createLinearGradient(0, 0, this.width, this.height);
          gradient1.addColorStop(0.2, 'rgb(255,0,0)');
          gradient1.addColorStop(0.4, 'rgb(0,255,0)');
          gradient1.addColorStop(0.6, 'rgb(150,100,100)');
          gradient1.addColorStop(0.8, 'rgb(0,255,255)');
  
          const gradient2 = this.context.createLinearGradient(0, 0, this.width, this.height);
          gradient2.addColorStop(0.2, 'rgb(255,255,0)');
          gradient2.addColorStop(0.4, 'rgb(200,5,50)');
          gradient2.addColorStop(0.6, 'rgb(150,255,255)');
          gradient2.addColorStop(0.8, 'rgb(255,255,150)');
  
          const gradient3 = this.context.createRadialGradient(this.width * 0.5, this.height * 0.5, 10, this.width * 0.5, this.height * 0.5, this.width);
          gradient3.addColorStop(0.2, 'rgb(0,0,255)');
          gradient3.addColorStop(0.4, 'rgb(200,255,0)');
          gradient3.addColorStop(0.6, 'rgb(0,0,255)');
          gradient3.addColorStop(0.8, 'rgb(0,0,0)');
  
          //this.context.fillStyle = gradient1;
          this.context.fillStyle = gradient3;
          var x = document.getElementById('a').value;
          this.context.fillText(x, this.width * 0.5, this.height * 0.5, this.width * 0.8);
      
  
          //this.context.fillText('JS', this.width * 0.5, this.height * 0.5, this.width);
      }
      drawFlowFieldImage(){
          let imageSize = this.width * 1;
          this.context.drawImage(this.image, this.width * 0.5 - imageSize * 0.5, this.height * 0.5 - imageSize * 0.5, imageSize, imageSize);
      }
      init(){
          // create flow field
           // draw image
           this.drawFlowFieldImage();
  
           //text
           //this.drawText();
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
  }
  
  const effect = new Effect(canvas, ctx);
  
  function animate(){
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      effect.render(offscreenCtx);
      ctx.drawImage(offscreenCanvas, 0, 0);
  
      //effect.render();
      requestAnimationFrame(animate);
  
  
  
  }
  animate();
  
        });
  
  
  
  });
  
  
  