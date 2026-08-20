# Flow

## Overview

I built Flow to turn a static painting into something that moves the way its brushwork always suggested it could. Impressionist and Post-Impressionist paintings are full of directional brushstrokes, texture, and implied motion, but they stay still on the canvas. This project reads that stillness as a flow field and animates it, so the movement the artist was already pointing toward becomes visible.

Flow is a live, browser-based redesign of an earlier generative art study of mine, Night Cafe (preserved on the `main` branch of this repository). The original used a fixed set of local images. This version pulls real paintings live from The Met's Open Access API, lets the visitor choose which one to animate, and renders the result entirely client-side with no backend.

Key features:
- Drag-and-drop or tap-to-select interaction, with a curated set of landscape and still-life Impressionist paintings from The Met
- A generative particle system that traces each painting's actual brushwork and contours, not a generic overlay
- Live-adjustable speed, density, and trail-length controls
- Fully static site: no server, no build step, no API key

## Key Techniques

**Flow field driven by image gradient, not raw brightness.** Each painting is sampled into a grayscale grid, then box-blurred to suppress fine brush-texture noise before computing a brightness gradient at every cell. The particle direction follows that gradient rotated ninety degrees, so particles travel along the painting's actual contours and shapes instead of an arbitrary angle derived from absolute brightness. This is what makes the animation trace a recognizable figure or composition rather than generic scribble. Flat, low-detail regions (where the gradient is unreliable) fall back to a brightness-based angle.

**Perlin noise for organic turbulence.** On top of the gradient-driven direction, each particle's angle is perturbed by Perlin noise (p5.js's `noise()`), sampled at the particle's own position and evolving over time. Because nearby particles sample nearby noise values, they curl together coherently, like wind moving across the canvas, rather than jittering independently. A small deterministic sine wobble rides underneath the noise as a guarantee: pure noise can, in principle, flatten out over a long stretch by chance, and a sine wave never can, so particles never lock into an unnaturally long straight line.

**Particle system.** Thousands of particles are spawned across the canvas, each holding a short history of recent positions that gets drawn as a stroke. A particle's color is lerped toward the painting's actual sampled RGB as it moves, so the strokes pick up the source painting's palette. Particles are continuously retired and respawned to keep the field alive indefinitely. Long particle trails skip points when stroked (rendering every second or third position instead of every one) to keep frame rate smooth at high particle density.

**Resilient, fast image loading.** Each painting's display copy and its pixel-sampling copy are loaded in parallel rather than sequentially, so the painting appears almost immediately while the flow field attaches moments later. Loading is deliberately split this way because the Met's CDN sits behind bot-mitigation that can occasionally slow down or block `fetch()`-based requests inconsistently, while a plain image load is unaffected — so the two paths are decoupled and the reliable one is never blocked waiting on the flakier one.

**Static, serverless architecture.** Vanilla JavaScript and p5.js, no framework or build tool. Artwork metadata and images come directly from The Met's public Collection API at request time. Hosted on GitHub Pages with no backend of any kind.

## Play It

https://luluwangyy.github.io/Flow_art_new/
