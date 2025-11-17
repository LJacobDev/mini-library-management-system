# Mini Library Management System

An example of a library management system for CRUD, search and filter, and check in / check out operations on a library's media catalog.  Extra features were added, such as making it a patron-facing web application in addition to the catalog management functions.

Built with Nuxt 4, TailwindCSS 4, with Auth and Postgres Database provided by Supabase, and hosted with Vercel.


### See it deployed at [mini-library-management-system.vercel.app](https://mini-library-management-system.vercel.app/)

**Note:** This app currently doesn't display certain details on mobile devices.  To help with this, a walkthrough of the views and user flows is available [in this demo video](https://youtu.be/1Q_yvrdJDmo).

### This project has been revised with a new [fast start approach](docs/dev/spec/spec-fast-start-5.md)

The goal of this project was to use agentic coding workflows to build a high quality app as quickly as possible.  It was first worked on with a spec-building approach that laid out detailed plans, schemas, api contracts, etc that began to balloon in complexity and got in the way of building things quickly.  These files remain in the repo as guidelines while the build process was reworked into something that connected simple parts quickly in order to achieve a working product faster.  Now, the original spec-final.md and openapi.yaml files can be gradually completed or reconciled / cleaned up with any new change in direction taken.

See [README.old.md](README.old.md) for a snapshot of the app state at the moment before deciding to rework the old approach to the fast start one.

## Current State Of The Application

Complete, regarding minimum objectives:
- Add, edit, delete books through the admin role's /dashboard/admin route (extened to videos, audiobooks, other)
- Check in and check out books through the librarian role at /dashboard/desk
- Search, filter books/media by title, author, description, type

Extra features added:
- Multi user, multi role sign in (library member, librarian desk, admin) with email and password, or email and magic link
- Route guarding to protect and RLS to enforce role based permissions
- Site is designed as a patron-facing library site to serve the members, but also has library staff dashboard
- Users can prompt a chat agent to recommend media from the library catalog that they would like (persisting sessions for follow up questions not yet enabled)
- Running in dev environment enables a 'view as' role impersonation switch in the header to test views and route guards

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
- SSO logins


## Running It Locally

```
npm install

npm run dev
```

**Note: In its current form it takes some setup to run with full features locally**

The env keys needed for database and AI integrations include OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_PUBLISHABLE_KEY (used 'publishable' instead of 'anon' to keep with new non-legacy key descriptions).  

You should be able to use your own OpenAI api key, and you can create a Supabase project with your own keys and use SQL files in docs/data to seed data.  

The site's images are live urls hosted in a Supabase bucket, so those are available to you online but I'm considering including them in /public in the future to make it easier.

When in dev mode, the app header will show a control to allow **changing session role** to view site as member, librarian, admin.

There is also a dev-mode /debug page with a control panel for testing endpoints.


