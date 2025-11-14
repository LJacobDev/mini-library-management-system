# Mini Library Management System

An example of a library management system for CRUD, search and filter, and check in / check out operations on a library's media catalog.  Extra features were added, such as making it a patron-facing web application in addition to the catalog management functions.


### See it [deployed](https://mini-library-management-system.vercel.app/)

**Note:** There's an issue where in some browsers/systems it appears as the intended dark theme, but in others it is showing in a light theme that has yet to be finished, making it hard to view.  If this is happening to you, you can try viewing it in dark mode for now - but there is also a proper view of this app [in this demo video](https://youtu.be/1Q_yvrdJDmo).

### This project has been revised with a new [fast start approach](docs/dev/spec/spec-fast-start-5.md)

The goal of this project was to use agentic coding workflows to build a high quality app as quickly as possible.  It was first worked on with a spec-building approach that laid out detailed plans, schemas, api contracts, etc that began to balloon in complexity and got in the way of building things quickly.  These files remain in the repo as guidelines while the build process was reworked into something that connected simple parts quickly in order to achieve a working product faster.  Now, the original spec-final.md and openapi.yaml files can be gradually completed or reconciled / cleaned up with any new change in direction taken.

### Current state of the application

Complete, regarding minimum objectives:
- Add, edit, delete books (extened to videos, audiobooks, other)
- Check in and check out books (performed via librarian role through /dashboard)
- Search, filter books/media by title, author, description, type

Extra features added:
- Multi user, multi role sign in (library member, librarian desk, admin)
- Site is designed as a patron-facing library site to serve the members, but also has library staff dashboard
- Users can prompt a chat agent to recommend media from the library catalog that they would like (persisting sessions for follow up questions not yet enabled)

Documentation / files of interest:
- [agent-fast-start-context.md](agents/agent-fast-start-context.md) is a living document where the agent keeps working notes and a history of all actions taken
- [spec-fast-start*.md](docs/dev/spec/spec-fast-start-5.md) is a series of spec files used to capture the goals and tasks to accomplish - may be slightly outdated

Still requires / working on:
- Allowing chat agent to carry a session context for followup prompts
- Adding markdown rendering in the agent chat
- Chat stream is terminating early in some cases
- UI, UX, polish, a11y audit, dark/light mode appearance
- Code refactoring, removing obsolete routes and endpoints
- Documentation / README clean up and presentation
- Unit Tests are planned, but not yet added as the focus was on building a starting point fast with manual testing first

Additional features planned / considered:
- Allow members to put a reservation / hold on available media
- Allow members to renew their existing loans online if no upcoming revervations are in queue for it
- Allow admin to use AI agent to help gather insights about patterns in catalog contents and member loans
- Setting up historical logging of librarian desk transactions




Built with Nuxt 4, TailwindCSS 4, hosted with Vercel.  Auth and Postgres database provided by Supabase.


### Running locally

```
npm install

npm run dev
```

**Note: In its current form it's difficult to run with full features locally**

The env keys needed for database and AI integrations include OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_PUBLISHABLE_KEY (used 'publishable' instead of 'anon' to keep with new non-legacy key descriptions).  

You should be able to use your own OpenAI api key, and you can create a Supabase project with your own keys and use SQL files in docs/data to seed data.  

The site's images are live urls hosted in a Supabase bucket, so those should load.

When in dev mode, the app header will show a control to allow **changing session role** to view site as member, librarian, admin.

There is also a dev-mode /debug page with a control panel for testing endpoints.





## Everything Below Here is the Final State of the Initial Documentation-First TDD Approach Before Switching To Fast Start Approach


This application was meant to be a demonstration of rapidly making a high quality demo application in a very short amount of time by leveraging modern Agentic Coding workflows, involving spec-driven and multi-agent aspects.

It appeared to be getting off to an excellent start in terms of working out a seemingly robust plan and specification, but the specification began to balloon in size and scope as an unintended side effect of trying to make sure that the MVP would include several high-impact but low-difficulty improvements for UI components, UX, performance, AI app features and test coverage.  However, while the purpose of striving for a robust high quality spec was to make implementation extremely simple and straightforward and prevent reworking the app part way through, the spec instead took on too much scope for the goals of the project and complicated making quick progress.

In its current state, some of the more impressive files in the repo are mainly docs that look positioned to help build a highly well put together app, but it has deviated from its goal of making a working app in a very short amount of time.

Some files of interest include the following:

- Those in the [agents directory](agents), where a manager agent and three implementation agents kept track of their individual context, instructions, and a history of their progress.  Example: [Agent-manager-context.md](agents/agent-manager-context.md).
- [A prompt library that was built up while working](agents/prompt-library/agent-actions.json) turned out to be extremely helpful not just for tracking my goals and progress through them, but helping the agent to notice the text in the file and through that gain an idea of what the current and future goals of the work would be, which helped it align with it with less manual explanation needed from me.
- The [Implementation Guide](agents/implementation-guide.md) shows the process through which the agents were intended to perform a rigorous edge case checking, test driven development style approach to lock in a solid result.
- My favourite part of this repo is [spec-final.md](docs/dev/spec/spec-final.md), which turned out to be a time sink and overengineering, but it was a fascinating experience to work out such full details for the application's intended success, including route and API contract and user experience stories and roles.  This file was actually very exciting to build up and watch it take form.  I would have liked only to be able to perform as quick of an implementation of it as I was intending to.

A great amount of value was gained by me as a developer during this process due to the intensive learning from the continuous exposure to extremely wide ranging and thoughtful aspects of application architecture and development, user experience, deployment options, freely available timesaving tools I can use for future projects and more.




To view the thinking and process from start to finish on this work, please see [my dev process notes](/docs/dev/dev-process.md).



## Setup

Make sure to install dependencies:

```bash
# npm
npm install

```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

```

## Production

Build the application for production:

```bash
# npm
npm run build

```

Locally preview production build:

```bash
# npm
npm run preview

```
