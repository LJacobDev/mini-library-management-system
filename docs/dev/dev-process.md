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

I was a little conflicted between the advantages and tradeoffs of using Vue 3 SPA with Github Pages vs Nuxt with Vercel, but for speed and simplicity I'll go with Vue 3 SPA that uses Github Pages unless I encounter a good enough reason to change course.


### Identifying any helpful MCP / Chat Extensions

Are there any Vue.js or Nuxt etc MCP / chat extensions that can improve the quality and accuracy of the agents code?

Nothing applicable appears to be readily available for this, but it isn't necessary



### Building out the spec file


It is currently asking me some questions about preferences like exactly what metadata might be good for the books to have

I'd like it to add pages but it's not a huge wow factor to do so.

There are a lot of potential metadata that could apply to books like this but I will just pick a few that matter the most here.



Make sure to be completely thorough with preparing the spec so that you don't run in to odd points where something isn't figured out when you're building it

I think it might not be fully asking all the right questions to get everything done, for example, nothing has been said about UI or styles, and I'd like to be giving it input there, like to use shadCN UI components instead of making them itself

use tailwindcss probably

use single file components


## Final Outcome and Insights


