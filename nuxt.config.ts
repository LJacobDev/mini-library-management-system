import { defineNuxtConfig } from "nuxt/config";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: ["@nuxt/eslint", "@nuxt/image", "@nuxt/test-utils", "@nuxt/ui"],

  css: ["~/assets/css/main.css"],

  runtimeConfig: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
    public: {},
  },

  ui: {
    prefix: "Nuxt",
  },
});
