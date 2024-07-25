import dotenv from 'dotenv';
import Replicate from 'replicate';
import express from 'express';
import bodyParser from 'body-parser';

dotenv.config();

const app = express();
const port = 3000;

app.use(bodyParser.json());

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

app.post('/canny_api', async (req, res) => {
  const { imageUrl } = req.body;

  try {
    const output = await replicate.run(
      "fofr/latent-consistency-model:683d19dc312f7a9f0428b04429a9ccefd28dbf7785fef083ad5cf991b65f406f",
      {
        input: {
          width: 768,
          height: 768,
          prompt: "A Canny edge-detected image of the input image",
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

    console.log('API Output:', output);

    const cannyImageUrl = output[0]; // Assuming the output contains the Canny edge-detected image URL
    res.json({ cannyImageUrl });
  } catch (error) {
    console.error('Error running API:', error);
    res.status(500).json({ error: 'Error processing image' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

runModel();
