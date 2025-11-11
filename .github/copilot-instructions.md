# Goals

We are building a 'library management system' as a part of a technical assessment designed to test not just the quality of the developer's output but their ability to use agentic coding tools to speed up development as fast as possible

It is important that we break ground immediately and build the front end, as ui first, using time-saving mocks for things like the back end API and database can be a sqlite file

ignore guidelines about test driven development for now - our goal is to get something working as fast as possible, so focus on building the front end ui first using nuxt 4, tailwindcss v4, and vue 3 components to get something working quickly but helping me manually test it to at least check that our work is functional.

when the ui is in a first draft simple version, we can then pivot to building out the back end by connecting it to nuxt api routes which will themselves call supabase for a postgres db, and the front end initially won't need auth to work but we'll be later on adding supabase auth to the front end.

and then create a back end for the ui


The developer is expected to implement the core features of the library management system as well as some bonus features that demonstrate creativity and technical skill.

Refer to /docs/dev/dev-process.md for the developer's notes on their thinking and process from start to finish on this work.

Your role the is pre-spec ground breaking agent, helping me the developer to set up a minimum front and and backend and supabase and openai connection.  

Our job is to build the front end ui as fast as possible using nuxt 4, tailwindcss v4, and vue 3 components to get something working in less than a day that can then be used to build out a fuller app that is speced in /docs/dev/spec/spec-final.md.

Speed of development is paramount in this, so use the /docs/dev/spec/spec-final.md as a loose reference for what a future version of this app will be about, and BUT DO NOT FOLLOW THE OPENAPI DOCUMENTS OR THE SPEC GUIDE'S REQUIREMENTS WHILE WE DEVELOP THIS APP NOW - build the front end as fast as possible using mocks where needed to get something working quickly.


## How to handle agent training cutoff date causing issues with not knowing about nuxt 4, tailwindcss v4, supabase latest best practices, openai latest best practices

It is likely that your training data cutoff is from back when nuxt 3 was the latest version of nuxt, so before every design or implementation suggestion you make, please check https://nuxt.com/docs as the source of truth about how to do things in nuxt 4.  This is very important to avoid nuxt 3 vs nuxt 4 confusion.  

This also applies to tailwindcss v4 which has some differences from tailwindcss v3 so please check https://tailwindcss.com/docs/ for the most current information about tailwindcss v4 before making any suggestions or implementations involving tailwindcss.  

Also please check https://supabase.com/docs to make sure that any supabase code or design you suggest is aligned with the most current supabase best practices.  

Also check https://openai.com/docs/ for anything involving openai api usage.


Any new changes noticed about the current versions that is different than what we expected needs to be written into a running collection of /docs/dev/llm-training-cutoff-updates.md so that all agents working on this project can refer to it and be aligned on what the most current best practices are for the various tech stack pieces being used here.


for more information please check /docs/dev/ for any docs about tailwind or nuxt



# UI considerations

This project aims to leverage nuxt ui components wherever they're helpful, but any new components made by agents here are to prefer using tailwindcss wherever it facilitates rapid UI development toward having a prototype that also looks excellent.  However when it is more helpful to use Vue 3 Single File Components `<style>` blocks, use them instead (for things like animations or other things they help facilitate where TailwindCSS is not as helpful)

For further information about considerations, the text at docs/dev/tailwindcss-and-style-block-hybrid-approach.md
