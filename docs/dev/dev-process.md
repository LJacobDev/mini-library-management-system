# Mini Library Management System by Lee Jacob (LJacobDev)

- [Initial Plan](#initial-plan)
- [Development Process](#development-process)
- [Final Outcome and Insights](#final-outcome-and-insights)

## Initial Plan

### Goal

Create an application that demonstrates use of multi agent code generation.


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

The Manager agent will be able to see the state of the implementation agents work in progress because their workspaces will be in git-ignored subfolders at /implementation-agent/1..n



## Development Process

This is a chronological flow of steps taken, decisions made, and unexpected findings/changes as I go along

### I'm going to be using a spec-driven workflow

I initially favoured using a github project board with issues and pull requests for this, but I decided I might not, as the spec driven workflow is itself a way to show the flow of work and decisions made such that adding the overhead of the github project would slow things down unnecessarily for this specific case.

The plans, process and discrete steps will be contained by the /agents/agent{#}-responsibility.md files along with their context histories in /agents/agent{#}-context.md, and potentially combined into a master story by the Manager agent at the end.



#### Building up copilot-instructions.md for the project


    


#### Initial requirements gathering

Reason through the requrements with to the manager agent and get started with thinking through the spec.

##### Details of Minimum Requirements

##### Recommended extras

##### Additional Creative Extras 


#### Planning the solution

Favour Test Driven Development and Code Quality Guard Rails while still optimizing development speed.


#### Chosing the tech stack

I plan to use Vue 3 Composition API for front end

Still have to decide about back end - is Nuxt useful here for anything?  Just use Supabase edge functions?  Likely, as that is serverless.

Do I want this on Github Pages using Github Actions CI/CD or does that limit me in any way?  Is Vercel worth considering?


#### Identifying any helpful MCP Chat Extensions

Are there any Vue.js or Nuxt etc MCP extensions that can improve the quality and accuracy of the agents code?




## Final Outcome and Insights

