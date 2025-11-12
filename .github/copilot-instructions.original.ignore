# Goals

We are building a 'library management system' as a part of a technical assessment designed to test not just the quality of the developer's output but their ability to use agentic coding tools to speed up development while maintaining high quality code and product.

The developer is expected to implement the core features of the library management system as well as some bonus features that demonstrate creativity and technical skill.

Refer to /docs/dev/requirements.md for the full list of features and requirements.

Refer to /docs/dev/dev-process.md for the developer's notes on their thinking and process from start to finish on this work.

Building high quality software is a priority but so is speed of development, so aim to balance these two goals optimally.


# Workflow Instructions

This workflow is intended to be done in a multi agent way.  To determine which agent you are, please refer to the file /.agent-info in which you'll receive role-specific instructions on how to contribute to this project.

If any step that you're being prompted to do appears to be complex enough that it would be easier to break into smaller steps, suggest this before continuing

If there is any uncertainty about an important consideration, or about what to do next, ask for clarification before proceeding.

If you're doing something that you're not confident about, tell me that you have a low confidence in your ability to complete the task and ask for help so that I can do it.


# The application is being build using Nuxt

Please refer to https://nuxt.com/docs as the most valid source of current truth about Nuxt and anything relating to building with it, configuring it, testing, and when we're troubleshooting and debugging.


# Edge cases and Test Driven Development (TDD) Approach

This project is to be done in a way that prioritizes Test Driven Development (TDD) where all new development starts by thinking of what applicable edge cases are possible for any feature/function/endpoint/handler being built, and then writing tests to cover those edge cases before writing the actual feature code.

Please see /docs/dev/edge-case-first-checklist.md for the full edge-case-first checklist that should be used to guide test generation and feature implementation.


## Nuxt 4 project awareness

- before every design, implementation, troubleshoot or debug action taken relating to nuxt code, know that your training is mostly on nuxt 3, and we need to check https://nuxt.com/docs as the source of truth for what to do

- The active application targets Nuxt 4. Some patterns differ from Nuxt 3 (directory layout under `app/`, data fetching defaults, TypeScript contexts, Nitro behavior). Always assume Nuxt 4 behaviors unless documentation or code explicitly states otherwise.
- Before proposing implementation details, troubleshooting ideas, or refactors, open the current Nuxt documentation to confirm any APIs, defaults, or module compatibility. This reduces drift from Nuxt 3-era assumptions.
- Keep `~/` mapped to `/app` and `@/` to the project root in both `nuxt.config.ts` and `tsconfig.json`; update context notes if this changes so implementation agents stay aligned.

for more information please check /docs/dev/nuxt-4-vs-nuxt-3-llm-awareness.md



# UI considerations

This project aims to leverage nuxt ui components wherever they're helpful, but any new components made by agents here are to prefer using tailwindcss wherever it facilitates rapid UI development toward having a prototype that also looks excellent.  However when it is more helpful to use Vue 3 Single File Components `<style>` blocks, use them instead (for things like animations or other things they help facilitate where TailwindCSS is not as helpful)

For further information about considerations, the text at docs/dev/tailwindcss-and-style-block-hybrid-approach.md

MOST IMPORTANT NOTE ABOUT TAILWIND.  There seem to be lots of times where LLMs are speaking about it in a v3 sense - so any time tailwind classes or especially configs that use tailwind.config.ts, refer to the tailwindcss docs for truth about v4 which is what we're using: https://tailwindcss.com/docs/


# Supabase considerations

Since most other tech stack choices are benefiting from having docs checked directly, I want you to build your Supabase code and designs and plans only after checking https://supabase.com/docs to make sure of whether there is new information that changes how it has to be done.  This appears to have been helpful with Nuxt and Tailwind so far.