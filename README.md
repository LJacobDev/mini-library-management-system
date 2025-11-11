# Mini Library Management System

Submitted by Lee Jacob (LJacobDev)


This application was meant to be a demonstration of rapidly making a high quality demo application in a very short amount of time by leveraging modern Agentic Coding workflows, involving spec-driven and multi-agent aspects.

It appeared to be getting off to an excellent start in terms of working out a seemingly robust plan and specification, but the specification began to balloon in size and scope as an unintended side effect of trying to make sure that the MVP would include several high-impact but low-difficulty additions to UX, performance, and AI app features like streaming agent chat.  However, while the purpose of striving for a robust high quality spec was to make implementation extremely simple and straightforward and prevent reworking the app part way through, the spec instead took on too much scope for the goals of the project and complicated making further progress.

In its current state, some of the more impressive files in the repo are mainly docs that look positioned to help build a highly well put together app, but it has deviated from its goal of making a working app in a very short amount of time.

Some files of interest include the following:

- Those in the [agents directory](agents), where a manager agent and three implementation agents kept track of their individual context, instructions, and a history of their progress.  Example: [Agent-manager-context.md](agents/agent-manager-context.md).
- [A prompt library that was built up while working](agents/prompt-library/agent-actions.json) turned out to be extremely helpful not just for tracking my goals and progress through them, but helping the agent to notice the text in the file and through that gain an idea of what the current and future goals of the work would be, which helped it align with it with less manual explanation needed from me.
- The [Implementation Guide](agents/implementation-guide.md) shows the process through which the agents were intended to perform a rigorous edge case checking, test driven development style approach to lock in a solid result.
 

A great amount of value was gained by myself as a developer during this process due to the intensive learning from the continuous exposure to extremely wide ranging and thoughtful aspects of application architecture and development, user experience, deployment options, freely available timesaving tools I can use for future projects and more.




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
