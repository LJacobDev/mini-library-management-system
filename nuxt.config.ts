import { defineNuxtConfig } from "nuxt/config";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: ["@nuxt/eslint", "@nuxt/image", "@nuxt/test-utils", "@nuxt/ui"],

  css: ["~/assets/css/main.css"],

  ui: {
    prefix: "Nuxt",
  },

  runtimeConfig: {
    server: {
      openaiApiKey: process.env.OPENAI_API_KEY,
    },
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_PUBLISHABLE_KE,
    },
  },
});
