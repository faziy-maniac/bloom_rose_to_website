# BLOOM

A responsive, static editorial storefront for a botanical cosmetics brand. The pinned hero canvas scrubs through numbered WebP frames extracted from the source video; the rest of the page uses the supplied still photography.

## Run locally

```sh
npm install
npm run extract:hero
npm start
```

Open the URL printed by the server (default `http://127.0.0.1:4173`). Set `PORT` to use a different port. The default hero source is the MP4 in the project root; set `HERO_VIDEO` to select another file. Frame rate and output quality are configured in `scripts/extract-hero.cjs`.