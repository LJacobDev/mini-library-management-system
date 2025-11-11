# Mini Library Management System by Lee Jacob (LJacobDev)

The following is a flow of my plans, thoughts, and decisions made from start to end

- [Initial Plan](#initial-plan)
- [Development Process](#development-process)
- [Final Outcome and Insights](#final-outcome-and-insights)

## Initial Plan

### Goal

Create an application that demonstrates a form of multi agent code generation.


### What to use to build it

There are IDEs such as Cursor that now facilitate running agents in parallel, but in order to complete this faster, I wanted to try using what I'm already familiar with (at least this time), which means I'll be using VSCode over Cursor.

I'm using VSCode over Bolt.new for this, only because I've run into frequent issues with Bolt, even in V2, and so I know I will have more control and flexibility with this setup for what I'm looking to achieve.

For live deployment I'd like to use Supabase for the back end and hosting on either Github Pages with Github Actions CI/CD or Vercel.


### Multi agent workflow setup

This is experimental and through it I will find out a better way to do this the next time.

I've decided to run one agent in a root directory as a manager, and three interior workspace directories each representing a separate clone of the repo and its own separate IDE instance with an agent whose purpose is to implement instruction steps on a separate branch, using pull requests to merge.

The agents will work on orthogonal sections of the code base whenever possible, and will be able to communicate with each other if needed through the manager or a shared context file, whichever seems to fit the need best.

Currently I don't see any reason why all four agents can't be given access to the same repo so it seems at the moment that there isn't any need for a complex setup in that regard.

I should be able to use a git-ignored file that specifies which agent is which.  This means that these files have to be managed and backed up outside of the repository.  I'm currently keeping examples of what these files hold in /.agent-info.example

I'm hoping to get a chance to experiment with adding in a code review agent to review PRs at the repo level such as GPT-5-Codex if I can get to that.

The Manager agent will be able to see the state of the implementation agents work in progress because their workspaces will be in git-ignored subfolders at /implementation-agent/1..n/



## Development Process

This is a chronological flow of steps taken as I go along

### I'm going to be using a spec-driven workflow

I initially favoured using a github project board with issues and pull requests for this, but I decided I might not, as the spec driven workflow is itself a way to show the flow of work and decisions made such that adding the overhead of the github project would slow things down unnecessarily for this specific case.

I was interested in using spec kit for this, but chose to run the process myself to get started sooner and learn spec kit afterwards.

The process and discrete steps that each agent is responsible for will be held by the files named /agents/agent{#}-responsibility.md, and their context histories of what they're doing and their understanding of the state of the application in /agents/agent{#}-context.md.

These contexts might potentially get combined into a master story by the Manager agent at the end.




### Building up copilot-instructions.md for the project

I wanted to give copilot instructions a checklist of edge case considerations to start with, then build unit tests, then implement code to pass the tests.

I wanted to make sure I covered all edge cases in applicable situations, and retrieved quite a large list of things to track.  I'll see if it might need to be dialed back a bit but I'll start with it like this for now.

The process up to here has largely been setting up workspace plans and context management plans, building prompts.

Future applications are better off using reusable prompt library text for this so that this goes more quickly



### Initial requirements gathering

Reason through the requrements with the manager agent and get started with thinking through the spec.


#### Details of Minimum Requirements

Book management: Add, edit, delete books

Their properties include title, author, and whatever other metadata I see fit

Check in / Check out feature:  mark a book as checked out (borrowed) or checked in (returned)

    for this, the usage context makes it seem like the application is being used by a librarian
    while helping a person at a desk check out a book, so they'll want to search the for book and mark it checked out
    consider other ways to use it like library members checking this out online or reserving it online etc

Search books:  find books by title, author, or any other fields (genre, etc etc)  (also add filtering, pagination)

Data structure: a single table in Supabase will work for this, keep in mind whether extra features will call for more than this one table

Complete a working product

#### Bonuses / recommended extras

deploy app and provide url for live testing

add authentication system with SSO, preferably with different user roles and permissions

    I'll use supabase for auth and would like to do librarian user role that can edit metadata, and library member user role that can't edit metadata, think of other things

implement any AI features you can think of

    have AI suggest a book for the member to sign out based on them providing a description of what they like reading

    what other AI features would be helpful here?


add extra features as you see fit, to demonstrate your creativity

    - come back to this and think of about 5 things to try adding



#### Evaluation Criteria

Completeness - does the product work, and cover the core features?

Creativity: are extra features and creative ideas incorporated?

Product Quality: Is the product clean and organized?

Usability: Is the app intuitive (not just intuitive to use, but I want a11y and things like keyboard navigation audits done)




### Planning the solution specifications


Favour Test Driven Development and Code Quality Guard Rails while still optimizing development speed.


### Chosing the tech stack

I plan to use Vue 3 Composition API for front end

for back end, either

Github Pages with Github Actions for CI/CD and Supabase for database and edge functions,

or Nuxt full stack that is hosted on Vercel, still using a Supabase database

#### Discovered a workflow speed boost at this point

I was a little conflicted between the advantages and tradeoffs of using Vue 3 SPA with Github Pages vs Nuxt with Vercel. I found that working out the tradeoffs was taking lots of time and cognitive load.  I realized I could break through this faster by prompting a new agent to answer iterative questions in as few words as possible in order to reduce reading fatigue and allow more cognitive effort to go toward reaching a sound design quickly.


### Identifying any helpful MCP / Chat Extensions

Are there any Vue.js or Nuxt etc MCP / chat extensions that can improve the quality and accuracy of the agents code?

Nothing applicable appears to be readily available for this, but it isn't necessary



### Building out the spec file



Things like the data schema don't care which back end I use, and deciding on the data model is helping to form the way the app will work, so I'm taking a moment on that right now.


#### Data schema - book / media structure

It is currently asking me some questions about preferences like exactly what metadata might be good for the books to have

I'd like it to add a few extra fields like 'pages' but it's not a huge wow factor to do so.

There are a lot of potential metadata that could apply to books like this but I will just pick a few that matter the most here.

I'm interested in adding other media types besides books, since libraries can also loan out videos and other things.  It would be an 'extra features' thing, but is helpful to design into the data schema now




#### Taking a moment to plan for a FastAPI back end in Vercel and having effective CI/CD for that setup







#### Data schema - check in check out history

Think of whether the media_loans table can include all checkouts, all returns as a total table or whether it should be a table per user.  I'm thinking one table of all checkouts that map to user IDs, I suppose a 'media_loan' row would consist of media_loan_id, media_id, checked out by userID, checked out at, due date, returned on (if empty then it's not returned yet).

It likely requires each checkout to have its own ID.  I think if the user it's associated with is deleted, the checkout information in this table relating to them should remain, but still point to a user ID number that is known as a user who requested to be deleted from records - but the media usage records stay preserved for other analytics


check what 'metadata GIN' refers to in database indexes


I would possibly want this to be a vector database especially if large dataset, for now keeping it as postgres while developing it





#### Making some starter files that are tech-agnostic while working out the spec

##### Data schema

Made the data schema in /docs/data/schema.sql

**I have noticed that the schema plan in the chat changed slightly each time I ask the agent to restate it**, so I've quickly reviewed the final version and think it looks ok, but I'm not certain that the schema is totally sound yet and I'd like to review it closer soon.

##### Other starter files

What other files can help set up a smart framework / skeleton of the app that are agnostic of the spec tech details?  

(no longer needed, I am going to start up a nuxt application now)




#### Discrete tech stack choice

While there is a lot that I like about FastAPI and I was leaning on using it, I want to use Nuxt for better stack cohesion even though there is a lot about FastAPI that I like.

I was considering still using an adapter pattern for the API between front end and back end just because I like the idea of making it able to swap back ends without having to change anything in the front end, but for the goals at hand it is overengineering and could be done later.


#### Get github spec kit installed and try its code review

I can use @workspace code review questions to get by but prefer spec kit.

Spec kit appears to be able to be installed for code review without requiring deviation from the other spec driven workflow plans I had.

Spec kit appears to also be able to take over where I currently am in a fairly seamless looking way as far as I can currently tell, and should likely help me arrive at much better task list files, and it seems that it is able to not break my current plan of agent responsibilities and instructions.


#### I investigated the experimental Nuxt MCP in the GitHub Registry again now that I'm using Nuxt

The manager agent checked its github README, and is warning me that it is opinionated and might not entirely help our goals or workflow choices.  It says to try making an experimental project in another folder to test it out before applying it here.

I'll hold off on using it for now but I want to follow it in case it helps me work better in Nuxt.



#### Initializing Nuxt App (in order to test spec kit but also because it's chosen as tech)

Nuxt modules to use: eslint, icon, image, test-utils, ui (component library)

    ui module will constrain visual choices but will be better and faster for my goals here

    find out how to make good use of icon and image modules in including them

    run dev server

    Running the dev server made me see their default page which drew my attention to their modules link

    I notice that github copilot was not able to enumerate the categories of modules from the vscode chat but a web browser search engine running same model was able to do it.  Continuing to investigate other modules, perhaps there's something else that can help this project...

    Some possibly useful modules identified by having a search engine llm check for me and doing some back and forth between the two chat sessions, like the tailwindcss integration and devtools.


#### Installing spec kit

I want to install spec kit and try the code review cli feature on here

I want to test its output in the console

Then I want to add a github workflow that makes it comment on pull requests

Then I want to make a test branch and PR it to main to see what it does

Then all I have to do is work down to the final spec and get this made

**Unexpected change:**

I was told by gpt-5 mini in both vscode and web search engines that @github/spec-kit would be an npm package that I could use to do CLI based code review and automatic github actions code review like Codex can do, but it seems based on the actual github repo for spec-kit along with linking copilot to that page to check it, that there is no npm package like this at all and that spec-kit works very differently.

I'll discontinue working with it because it might have been a hallucination or a misunderstanding somehow.  It won't help things get done faster, abandoning it until there's time to see what it really works like.

I can still use @workspace and ask Codex in Copilot for code reviews which seem to help in the meantime.


#### Performing a @workspace code review

Codex told me the following, when I did the review on a simply empty / initialized Nuxt application scaffold:

"Generated build artifacts are committed under .nuxt/; add the folder to .gitignore and clean the history to avoid churn and repo bloat."

-- the above statement is false, it was already in .gitignore

"There are no automated tests or scripts in package.json to enforce the edge-case-first/TDD workflow described in dev-process.md; add unit/integration test scaffolding before feature work continues."

"The Nuxt scaffold lacks type-safe runtime config typings and module setup in nuxt.config.ts; align it with the documented Supabase/AI plans so future agents have a stable contract."

"Documentation is thorough, but consolidate duplicated planning content across dev-process.md and agent-manager-context.md to reduce drift and keep a single source of truth."



#### I want to install tailwind 3 and possibly a nuxt tailwind module also

I've worked out that tailwindcss should coexist well with nuxt ui components but tailwindcss, especiall v3, seems to be friendly to LLMs for fast development.

I've installed tailwindcss and the nuxt tailwind module, but I notice that when I asked copilot to help set config files for it, it was doing strange things like getting the paths a little wrong.  I restored a checkpoint and tried again with Codex as the model, thinking it was because the number of files I had being changed all at once would be tough for GPT-5 mini to get right.

Needs a little debugging, had to resolve css path other than the alias that the model wrote it as

Adding @types/node so some linter complaints clear out

LLM said that using the path module to get dirname was not optimal for Nuxt, so I attempted setting up the aliases according to its instructions but it consistently failed, and the LLM began to seem to not have a grasp on it.  I'm going to try codex to see if it can handle the multi file question better... 

The LLMs seemed to circle around the problem and keep telling me to make fixes and changes by installing vitest and changing vitest.config.ts files, but none of that worked, and it seemed to keep coming back to using the path and url packages to solve this and find the main.css file, and I'm moving on with the rest.

I have a little more to go with making sure tailwindcss is configured right because it's not displaying yet.

LLM missed importing the Tailwind Test component, writing that part in solved the hydration mismatch

Tailwind config is elusive and suggestions are conflicting between LLMs and tailwind docs.  Tailwind docs are missing info about postcss option that seems important.  Would almost abandon using tailwind to save time getting started, but learning what to fix to get the config working would be worth personally understanding in general.

Lots of conflicts in documentation sources from tailwind to nuxt docs, LLMs disagree - finally found in [stackoverflow](https://stackoverflow.com/questions/79733577/how-to-use-install-tailwind-css-in-nuxt-4) someone who explained that it seems to need @nuxt/ui to also be imported in main.css for it to make tailwind v4 work.  Regarding tailwind v4, it seemed difficult to get the intended v3 config set up, and it's currently unclear why it was so different with Nuxt than with other frameworks.

**Strange issue with Tailwind content scanning**.  Documentation and LLMs statements also seem to be conflicted about why tailwind content scanning is picking up my /app/app.vue classes but not the ones in /components/TailwindStatus.vue, even when tailwind.config.ts is trying to target it.  In order to overcome this now and understand it later, I moved /components into /app/components and the content scanning is picking it up, though other than that I would have preferred to keep /components where it was.




#### Do a test deployment on vercel

Deployed current branch directly onto vercel

This is not the same as having vercel take updated versions of main through CICD and that's what I'd like it to end up like, but at least I can say that the Nuxt app runs and renders in prod deployment.





#### still take a moment to look into what those other tech agnostic files could be, because some of them look potentially useful like adding docs about the tests or having a ux/wireframes file


It told me about /docs/api/openapi.yaml that could be made for an HTTP contract, and helps decide what response codes to send and a lot of helpful things.

I like this, and want this done


The idea of a wireframe.md that has the pages views and sections represented as headers and bullet points is interesting but I might not need it here.

There are some interesting test guide files and test tracking plans that I might use.






#### Any other features

Having a contact form that can be used by unauthenticated would be good, and I'd like it to include a measure to detect and reduce bot misuse.






#### Creating a 'spec-preparation-list'

I'm asking the agent to go over every possible easy to miss but good to include feature or bit of polish or security or UX that it can think of.

I'm going to use this list as a way to drill down to a final and locked spec

I'm taking the total list of ideas left to cover and dividing them into groups, with ones that have high impact to quality but low amount of time or risk to add come first, and then another group for enhancements, and then another group for nice things to add if the first two groups are done.




#### Collapsing Agent Chat Sessions


When I had one agent do a context update, I began to see it make context updates to outdated prior information since it was an agent that had been used earlier and was being revisited.  I've filtered out a proper context state file and spec-preparation-list file and closed all chat histories to pick up again with cleared out sessions.

The next step is to have a manager agent work through all the remaining spec questions and then implementations can start.






#### Spec Preparation List


I'm arranging all the outstanding things left to do before a spec can be locked into two files

spec-preparation-list.md is the 'everything that we could ever have to think about listed in order of what can be done fastest with the most impact' and then spec-preparation-list-essential.md is the same information but arranged where the most important things that have to be in the prototype are highlighted in a case where time is short.


While building the spec, I want you to create have you start a spec-1.md file that has a full spec that matches our current understanding of the application and plan, and then has a second section below where it lists all of the considerations in /docs/dev/spec-preparation-essential.md.

It has grouped things into essential buckets like what to do early on to make sure the prototype works, and things to do later on.  It included optimistic UI and empty states as something to deal with later, even though I'd almost want that as a minimum.

I'm about to go through spec-preparation-list-essential's questions on at a time and resolve them while converting the decisions into a spec-1.md file, leading to a spec-final.md file.



#### agent-actions.json

I've extended the prompt library to include prompts I think are reusable as well as ones I'm planing to use next.  It seems to be really helping the work more forward more easily.

I'm noticing that I could either use it like [{"action":"action-name", "prompt":"prompt-text"},...] which is fine for now for human use in a editor, but it would be useful to have it like {"action-name" : "prompt-text"} for faster lookups from a chat session.

The manager agent is seeing this file as an agents onboarding file and wanted to add a prompt to it that was more like a context / instruction more than a prompt that would be getting used.  I find that sort of helpful but it would be better to put those in actual instruction files and not mix them in with prompts that are meant to be selected at specific times by the user.









#### USER STORIES:

ask the agent to help you determine user experience stories / flows at this point so that they inform the spec


##### unauthenticated

They see the library main page and can view and search and filter books/media.  They can click on media to see its modal that contains it cover image and public metadata.

The grid of media is also able to be navigated with keyboard navigation of pressing tab to advance along and shift tab to go move back.  The item will have a border to indicate that it is selected.  Pressing space while it is selected brings up its modal as well.

If the unauthenticated attempts to click the 'reserve' button on the media item, they will be directed to a sign up / log in view.

##### authenticated member

they have the same abilites as unauthenticated, except that member can click the reserve button and have it mark the book as reserved by them if it is available.

The member also has an area they can navigate to that shows 'my checked out items' or something with similar name, that shows them a grid or column stack of cards that show the media items currently checked out by them, and currently reserved by them, with 'due date' showing under each or to the right of each, which can also be clicked on to open that media's cover image and metadata modal.  in this example, the modal shows extra information, like 'due date'

##### authenticated desk-librarian

the authenticated desk-librarian works at the customer service desk and helps identify members in person and takes books / media in hand and looks them up in order to bring up their modal and enter (or look up with search assist features) a user id to act as though they are writing the id in from reading a library card in hand

can see the media and their metadata, except they can also see who the book is checked out by if they open the media modal they are able to press a 'check out' button and provide a member user's id to it so that the book can be marked as checked out by that person and sets a due date for 2 weeks out from the current date,

they also the ability to press a check in button that changes the media's state back and clears out the due date and the checked_out_by fields


##### authenticated admin-librarian

this user is the superuser who is able to add a new book or media item to the collection.  This means that on the main view, they see the collection and can filter it, but they also have an Add New Media button that brings up a media modal that lets them fill in the fields for what it is.

on the modal, they can press save or cancel

when loading media in a modal that has already been saved previously, there is a button to edit/update which brings it back to the modal that can modify the fields

there is also a delete media item button, which if clicked, has a confirmation popup (one that can either be approved by pressing the space bar, or be silenced for the next 10 minutes to help do batches of work)

the admin librarian can also press the delete key

Their view of the media modal shows everything about its metadata, including other user IDs that have signed it out and what its due date is.  



#### Nuxt 4 vs Nuxt 3

Codex says its model training cutoff date was about Oct 2023, so Nuxt 3 was the main version back then.  I've quickly investigated the possibility that the LLMs will struggle to build in nuxt 4 and might want to downgrade, but Codex seems to think it will be worth using 4 and referring to docs frequently.  Made a new file in /docs/dev/ about it as a reference.



#### Checking for any remaining undiscussed areas to get right to avoid having to rebuild later

Investigate whether there is anything else undiscussed at this stage as useful as sure user flow stories.

For each topic considered, if it's important but I decide not to include it for the purposes of scope or time constraints, I want to document the reasons why so that it's known that it was not forgotten about.



#### Note: agent is asking lots of questions at once and I'm concerned it's dilluting context

Agent might ask a question about a ux consideration backlog question but it comes as four sections with 2 bullet points each.  It looks efficient to address it all at once but I worry that it's dilluting context or potential quality of the results, so I might like to have it ask me fewer details at a time to keep it focused.


#### Review the data schema to check for errors or mistakes

Double check everything before making any hard details for the agents to build out

By just having an llm check it, these things were identified but I know that this might be partly flawed statements, I want to check closer still.

This has been done in backlog questions 8.1 but I have yet to test run it and check how it will work.  I would not be surprised if it needs more help getting things right.

It has been reviewed and seems ok now







##### Verify this, modify schema to fix anything that needs it:

**Review findings**

- `CREATE TYPE` lacks an `IF NOT EXISTS` safeguard; rerunning the migration will fail once enums already exist.  
- `gen_random_uuid()` requires the `pgcrypto` extension; document or enable it.  
- `users.email` and `role` are nullable/unconstrained; consider `NOT NULL`, unique index on email, or an enum for roles.  
- `media.format` (free-text) and `book_format` enums can drift; enforce one source of truth or validate values.  
- `media.checked_out` duplicates the active-loan state; introduce triggers or a view to avoid divergence.  
- `updated_at` columns never auto-refresh; add triggers/defaults if the timestamp is meant to track changes.  
- Sample inserts accept NULL `creator`/`title` etc. only via schema constraints; ensure future data respects NOT NULLs.










#### Make the spec file

Might save iterative versions along the way for reference or as checkpoints.


While working on the 'backlog of spec questions' I was really wanting to see if I could start just building some things while continuing to talk about spec questions, but the agent suggested finishing up to backlog item 11 before starting any implementation.


Spec building agent has been almost exclusively GPT-5-Codex

Implementation agents will probably be gpt-5 mini unless complex operations have to happen

Remember to get an AI feature in there, there are lots that are easy to do.


Made sure that a recommendation from AI about which books you might like based on your stated interests gets included as part of the MVP and in the API contracts



#### spec-final.md created

ready to break down into workspace files and agent responsibility files to begin implementation





#### make sure to do /docs/api/openapi.yaml and make HTTP contracts for the API, Schema once spec is done

the agent remembered as soon as the spec was locked that we needed to do this, as well as to do test guide files and possibly test-plan files once spec is done.

I just want to check their contents 

The openapi.yaml file was 700 lines and Copilot says it's just a stub file that is not consistent with the spec.  I have it making it consistent with the spec, and then that should be the last thing needed before breaking this into implementation agent responsibilities.






### Making the agent responsibilities file

Make a manager responsibilities file as well?  

Or is that just me working with it and tracking each implementation agent?

Think about if it helps.  

Maybe the main spec.md that it generates can also have checkboxes that it completes 

(or its own manager responsibilities file that is just the full spec with check boxes to keep the files cleaner)

Remember that some agent tasks might be best set to only be allowed to start when another agent has achieved a certain point on theirs, so have the manager mark instructions on 'requires agent step # to be complete before starting' on each agent step

The manager can perhaps then check off that file to show the requirement is ready now.






#### Setting up github issue templates and instructions for how to use Issues and PRs

I like the way it looks, can't wait to see how it runs though



#### Creating the separated responsibilities implementation agent files

Some first draft has been made, but it needs to be reworked until it has well organized, well co-ordinated, and well broken down substeps.



#### The repsonsibility files are made now

They appear to be in an order where even if any of their steps are exploded into sub-steps, the order in which they occur won't radically change, so these can be turned into task list files now, and then the task list files can be exploded into sub-steps as needed.





#### I still want to hook up and test supabase auth and image storage as early on as possible so I know it's working while I build


#### My edge case checklist is quite large so I want to remember to tone it down if it gets excessively in the way of development



``` Temporary notes

I have a few priorities to juggle at the same time:



A thing I need to watch out for:

Verify .env.example

Compare keys with spec-final.md §12–13 and openapi.yaml (Supabase, OpenAI settings, feature flags).

Cross-check against Supabase dashboard and Vercel project to make sure the variable names match exactly.

Run npm run lint && npm run build locally after copying .env.example to .env with placeholder values; Nitro should warn if any required variable is missing.







- I'd like to make a test connection to supabase and set up its keys (and openai as well) as soon as possible so it's working from the start - will likely need keys set up in github and vercel and test that everything works in local, in any github actions and in vercel

- I still want to get book cover art, maybe other media cover art.  Check stock photo sites and free photo sites like pexels, using image gen to get a few examples, etc.







- I still need to link the github repo to vercel, I assume at least, in order to help do CI/CD








Remember that you have something set up in main.css that helps with adding css variables if I want any (like a colour scheme palette)

- remember that tailwindcss forms and tailwindcss typography is available if you want it





- something is strange with path aliases.  Nuxt is supposed to use ~ for src folder and @ for root folder, but in mine it seems like ~ and @ both point to /app/ and so I seem to need to move my components directory into app if I want to use aliases.

I think that if I keep my intentional use of ~/ as meaning app folder, and @ as to mean the root, then if I keep using @/components then I should be able to fix the @ targeting and move components back if I want to.  For now I just want the prototype to work and make sure it doesn't break when CICD happens so I'll keep components in /app/ to get moving on making the functionality, UI, etc.

--- is the above about path aliases related to the fact that this is Nuxt4 and not 3?



- add that I want some kind of logging, but the media_loans database is almost like one, but having actual log files for other things would be a nice thing to also have


```


run formatter on all ts files

- fix the dev-process rendered markdown readability especially in 'insights'

I'm aware that having truly complete docs might not be happening, but get the readme well polished especially with any walkthroughs or ways to help a tester check the app out.


## Final Outcome




### Insights


These are discoveries as I went along that helped improve things like speed of productivity or quality of the final product.

They are presented in the order in which they occurred while I worked from planning to implementation and finalizing.


#### Workflow speed boost: Encountering development pain points and thinking of ways to overcome them

While working on this, I found that it was useful to ask GPT-5 mini to reply in as few words as possible for asking quick iterative exploratory questions.  The rapid short answers were more helpful to navigate ideas and unpack information in less time without feeling reading fatigue.

#### Model choices: Codex was good for making updates to Manager context files that needed to be well thought and well stated

When updating the Manager agent's context file of its understanding of the state of the project, I found it was useful to switch the active chat session's model to GPT-5-Codex so that it would more effectively translate chat session context into a well stated, well thought out out context file that GPT-5 mini could then be switched back to for continuing spec building plans.


#### Product maintainability: The agent suggested abstracting the API so that it could be swapped out without rewriting the UI

I didn't originally plan to do this, but I like the idea in that it's something I'd like to have as a way to make the app more flexible at seemingly little cost

#### Workflow speed boost:  Several agents working from one context file

Discovered a way to boost a specific agent's capacity without extra friction or overhead.

The initial plan was to enable a multi agent workflow using separate VSCode instances where each one had a separate copy of the repo and a separate instructions file describing their agent role, such as a manager or implementation agent.

But I noticed that using two or three chat sessions within one VSCode instance facilitated scaling a manager or implementation agent's capacity in an elastic but very simple way.

Example: 

One chat session could discuss the agent's workflow and needs, and another chat session for performing tasks that take time for the agent to perform.  They carry their own chat session context so they can specialize into areas to cover more ground, but they can keep their work cohesive by reading and writing to their common role's context file.


#### Workflow speed and product quality boost: Github Projects API and Codex code reviews

I felt like it was probably overengineering for the goal of this application, but I entertained doing the workflow through Github Projects where the agents could use GH CLI to create Issues and do PRs that get automatically reviewed by Codex at the repo level (a newly announced capability).

I think this would massively improve the speed of development and quality of final product but it had just a little too much overhead for this project to justify using it right now.

Update: I found it to be helpful without losing any time to use a basic issue / pr process with GH CLI

I nearly began to use Codex CLI to do code reviews locally but I decided to move forward with getting the prototype done.  Now I know that I can add in Codex if I find it's helpful to do so or use it from the start in future projects.


#### Workflow speed boost:  The time spent upfront on planning this project will make future projects complete much faster

A lot of the time spent on this project was upfront work of planning things out so that it could be built quickly but also avoid having to rework it part way through due to not being foresighted enough.

A lot of new ideas and ways to do things better were discovered along the way at a small time cost, but it will pay off in that all future projects will be much faster to build because of this.


#### Workflow effectiveness boost: Making use of GH Copilot @workspace Chat Extension

I noticed that if I used the @workspace extension I could get far better agent conversations about the project to take place.

I investigated whether @workspace would help me do repo-wide code reviews, and it led me to find out that GitHub Spec Kit is useful for this.  It caused me to take another quick look at it to see if I could get it included in this project without taking too long to prepare it.



#### Taking a moment to re-explore using spec kit

My plan has been to do my own spec driven workflow even though I was recently told about GitHub Spec Kit.  I thought it would take too much time spent upfront to get to it for this project, but wanted to learn it for my next project.

Later on, I discovered that it could do repo wide code review, which is what I wanted Codex for.

Due to that it now it is worthwhile to investigate using spec kit at least for that purpose, which will also get me closer to using its workflows for development, as I see that they are more robust versions of the workflow tools that I've been doing here from scratch.

**It turned out to not be helpful for the things I expected.**  It's possible the llms hallucinated that it could do code review and be installed as a node package.  I'll figure this out after I get the main objectives of this project done.

Github Copilot with Codex model appears to do decent but imperfect code reivews using @workspace chat extension at least for now as well.


#### Taking a moment to explore if any more nuxt modules exist that could help

I noticed when I saw the Nuxt 'Welcome' page in the dev server, it mentions a modules link.  I saw that there are around 300 modules.  I found that VCCode Github Copilot didn't seem to be able to search the site for module names, but using a web browser search engine was able to get me a list of the modules categories.

Then I gave those categories to copilot, and it was able to narrow down ones that might have modules that facilitate this project's success.

Then I gave that list back to the web browser chat instance, and it retrieved a list of modules that might actually help by name and category.

From this, copilot was able to identify that nuxt has a tailwind v3 integration, and pointed out their devtools module, and addressed some auth modules that might help if I need something beyond what I can get with the supabase module.


#### Prompt library upgrade

I found it far more useful to create a single prompt file in JSON format, even just to use as something to have in a side panel as I work along.  It made it much easier to think about what I want to do and when and how I want to do it.  It caused me to think of other prompts that would be useful and resuable.  It also greatly reduced cognitive load in that instead of thinking of future steps as things I had to still work out when I got there, the prompts being pre-written took that off my mind and put the process on a set of rails that allowed it to gain momentum.


#### Agent understanding checks are working and helping

I notice that when I start a new chat session and ask the agent what its understanding of the project, its goals, what has been done, its current state, and what we need to do next, it is correctly looking at the context files and instructions sets to produce a reply that is either fully accurate, or is very close but that has some outdated pieces of information that I can catch and correct.

It appears that keeping this running dev-process.md file, as well as writing a prompt-libart/agent-actions.json file with all the prompts ahead of time, is causing the agent to keep a very good handle on what the workflow and plans are going to go like, even without me having to directly tell it in the chat session.  These files are helping me to think and track progress but it's also helping to inform the agent in a similar way without having to directly draw attention to the files in conversation.


#### Interesting effect from using agent-actions.json

I only wanted the JSON file to store some reusable prompts for myself, but GPT-5 Codex has interpreted the file as an agents onboarding file and has been adding some prompts or guard rails into the library that aren't necessarily prompts I would use, but it thinks that agents are going to read these things and be informed by them, likely because it somehow automatically was.  I'll be interested in seeing if the implementation agents actually default to treating it like this as well.


#### Taking time to explore potential UX improvements was a time cost but is profoundly helpful

Given its goals, it would have been best for this project to have pushed faster toward a working prototype in the shortest possible amount of time.

However while investigating ways to improve product quality quickly, many important considerations were surfaced, discussed, decided upon, and the takeaways from it will make my next similar app trivial to create in far less time after what I've discovered making this one.


#### Linking the agent to urls of current docs seems to overcome information defaulting to outdated things.

Copilot keeps talking about v3 TailwindCSS patterns, but when it proposed an idea to me that used tailwind.config.ts, I noticed that v4 doesn't use that file anymore.  So I pointed it to tailwind docs, and it seemed to correct its plan.  I will probably need to rely on this for all tailwind and all nuxt code because of using later version than these models are used to.

Significant differences are seeming to emerge by having the agent check its plans for Nuxt, Tailwind against docs.  Am doing the same for Supabase now.  There seem to be large differences between what agents are trained on so I should use older versions or find out how to feed them docs efficiently.

It appears that it is possible for it to get in long periods of checking documentation without seeming to find what it wants.  I'd like to understand what's going on when this happens.



#### Managing context / truth sources

I found that there was a lot of value in converging on a spec and then at the point of locking it in, making sure to check the docs of each related technology in order to make sure the plan wasn't broken by recent updates.  This often resulted in what at the least looks like the LLM being confident that we're catching important changes.  We'll find out what happens when implementation starts.

It seems like the training cutoff date and where to find recent docs is a massive part of getting good results with this.




#### The agent can help accomplish large tasks but it comes with a risk of having to verify that large thing

Codex made openapi.yaml which sounded like a great idea as a reference that implementation agents could use to build their work from.  However when it created it, it created it as a stub that isn't consistent with the spec.  Then it took many edits to pass through it and make it consistent.

This is a file that is meant to facilitate development, but it's also a liability because if it has any subtle errors in it, it could be difficult to trace and resolve, so I might want to avoid this kind of approach unless I can find a way to ensure the quality of the statements being included in the file.