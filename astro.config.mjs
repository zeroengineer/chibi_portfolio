// @ts-check
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Set SITE_URL in the deploy environment to get absolute canonical/OG URLs.
  site: process.env.SITE_URL,
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
