const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const Replicate = require('replicate');

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increase the limit for JSON payload
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // Increase the limit for URL-encoded payload
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public'

// Replicate API client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Proxy route to handle CORS issues
app.get('/proxy', async (req, res) => {
  const url = req.query.url;
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    res.set('Content-Type', response.headers['content-type']);
    res.set('Access-Control-Allow-Origin', '*'); // Add CORS header
    res.send(buffer);
  } catch (error) {
    res.status(500).send('Error');
  }
});

// Route to handle image processing with Replicate API
app.post('/canny_api', async (req, res) => {
  const { imageUrl } = req.body;

  try {
    const output = await replicate.run(
      "fofr/latent-consistency-model:683d19dc312f7a9f0428b04429a9ccefd28dbf7785fef083ad5cf991b65f406f",
      {
        input: {
          width: 1619,
          height: 1199,
          prompt: "Self-portrait oil painting, a beautiful cyborg with golden hair, 8k",
          num_images: 1,
          control_image: imageUrl,
          guidance_scale: 8,
          archive_outputs: false,
          prompt_strength: 0.8,
          sizing_strategy: "width/height",
          lcm_origin_steps: 50,
          canny_low_threshold: 100,
          num_inference_steps: 8,
          canny_high_threshold: 200,
          control_guidance_end: 1,
          control_guidance_start: 0,
          controlnet_conditioning_scale: 2
        }
      }
    );

    console.log('API Output:', output); // Log the API output to the console

    // Assuming the Canny edge-detected image URL is the second URL in the output array
    const cannyImageUrl = output.find(url => url.includes('canny'));
    res.json({ cannyImageUrl });
  } catch (error) {
    console.error('Error running API:', error);
    res.status(500).json({ error: 'Error processing image' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
