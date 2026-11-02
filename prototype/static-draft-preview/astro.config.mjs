import { defineConfig } from 'astro/config';
import { storyblok } from '@storyblok/astro';

const PREVIEW = !!process.env.PREVIEW;

export default defineConfig({
  output: 'static',
  outDir: PREVIEW ? 'dist-preview' : 'dist-prod',
  integrations: [
    storyblok({
      accessToken: process.env.STORYBLOK_TOKEN,
      bridge: PREVIEW, // Kernfrage 3: false muss im Prod-Build null Storyblok-Code/-Requests bedeuten
      apiOptions: { region: 'eu' },
      components: {
        page: 'storyblok/Page',
        teaser: 'storyblok/Teaser',
        grid: 'storyblok/Grid',
        feature: 'storyblok/Feature',
      },
      enableFallbackComponent: true,
    }),
  ],
  vite: {
    define: {
      __PREVIEW__: JSON.stringify(PREVIEW),
      __BUILD_ID__: JSON.stringify(String(Date.now())),
    },
  },
});
