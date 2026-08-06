# Flow

A live, minimalist reimagining of my generative flow-field study, [Night Cafe](https://github.com/luluwangyy/Flow_art_new/tree/main/final3). Drag up to three Impressionist paintings — pulled live from [The Met's Open Access API](https://www.metmuseum.org/art/collection/search) — onto the canvas and watch each one seed a field of particles that trace flowing, painterly brushstrokes in its colors.

**Live demo:** https://luluwangyy.github.io/Flow_art_new/

Built with p5.js, vanilla JS, and the Met Collection API — fully static, no backend or API key required.

## How it works
Each dropped painting is sampled pixel-by-pixel into a grayscale "flow field": brightness maps to a direction, and thousands of particles are steered along it, picking up the painting's colors as they go. It's a direct port of the original raw-Canvas2D technique on the [`main`](https://github.com/luluwangyy/Flow_art_new/tree/main) branch, rebuilt in p5.js to support multiple simultaneous layers, live-tunable parameters, and dynamically loaded (rather than hardcoded) source images.

## Original project
The unrevised source project — including experimental layers, an AI edge-detection upload pipeline (Replicate API), and earlier iterations — lives on the [`main`](https://github.com/luluwangyy/Flow_art_new/tree/main) branch.
