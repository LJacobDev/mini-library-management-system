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

#### Discovered a worfklow speed boost at this point

I was a little conflicted between the advantages and tradeoffs of using Vue 3 SPA with Github Pages vs Nuxt with Vercel. I found that working out the tradeoffs was taking lots of time and cognitive load.  I realized I could break through this faster by prompting a new agent to answer iterative questions in as few words as possible in order to reduce reading fatigue and allow more cognitive effort to go toward reaching a sound design quickly.


### Identifying any helpful MCP / Chat Extensions

Are there any Vue.js or Nuxt etc MCP / chat extensions that can improve the quality and accuracy of the agents code?

Nothing applicable appears to be readily available for this, but it isn't necessary



### Building out the spec file


#### Data schema - book / media structure

It is currently asking me some questions about preferences like exactly what metadata might be good for the books to have

I'd like it to add a few extra fields like 'pages' but it's not a huge wow factor to do so.

There are a lot of potential metadata that could apply to books like this but I will just pick a few that matter the most here.

I'm interested in adding other media types besides books, since libraries can also loan out videos and other things.  It would be an 'extra features' thing, but is helpful to design into the data schema now



#### Data schema - check in check out history

Think of whether the media_loans table can include all users, all checkouts, all returns as a total table or whether it should be a table per user.  I'm thinking one table of all checkouts that map to user IDs, I suppose a 'checkout' row would consist of checked out by, checked out at, due date, returned on (if empty then it's not returned yet).  It likely requires each checkout to have its own ID.  I think if the user it's associated with is deleted, the checkout information in this table relating to them should remain, but still point to a user ID number that is known as a user who requested to be deleted from records - but the media usage records stay preserved for other analytics


check what 'metadata GIN' refers to in database indexes


I would possibly want this to be a vector database especially if large dataset, for now keeping it as postgres while developing it





#### Making some starter files that are tech-agnostic while working out the spec

Things like the data schema don't care which back end I use, and deciding on the data model is helping to form the way the app will work, so I'm taking a moment on that right now.




ask the agent to help you determine user experience stories / flows at this point so that they inform the spec

ask the agent if there is anything else at this stage as useful as something like how we just addressed that also could be addressed now





#### USER STORIES:


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




## Final Outcome




### Insights


#### Workflow speed boost: Encountering development pain points and thinking of ways to overcome them

While working on this, I found that it was useful to ask GPT-5 mini to reply in as few words as possible for asking quick iterative exploratory questions.  The rapid short answers were more helpful to navigate ideas and unpack information in less time without feeling reading fatigue.

#### Model choices: Codex was good for making updates to Manager context files that needed to be well thought and well stated

When updating the Manager agent's context file of its understanding of the state of the project, I found it was useful to switch the active chat session's model to GPT-5-Codex so that it would more effectively translate chat session context into a well stated, well thought out out context file that GPT-5 mini could then be switched back to for continuing spec building plans.

