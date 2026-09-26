# BLOOM

A responsive, static editorial storefront for a botanical cosmetics brand. The pinned hero canvas scrubs through numbered WebP frames extracted from `hero.mp4`; the rest of the page uses the supplied still photography.

## Run locally

```sh
npm install
npm run extract:hero
npm run build
npm start
```

Open the URL printed by the server (default `http://127.0.0.1:4173`). Set `PORT` to use a different port. Replace `hero.mp4` and rerun `npm run extract:hero` to regenerate the scroll sequence. Frame rate and output quality are configured in `scripts/extract-hero.cjs`.