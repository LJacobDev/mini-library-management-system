# Implementation Agent Workflow Guide

This guide describes the required workflow for implementation agents working in this repository. Follow every step in order—consistency keeps our multi-agent collaboration predictable and auditable.

## 1. Prepare

1. Review the locked spec (`docs/dev/spec/spec-final.md`), the OpenAPI contract (`docs/api/openapi.yaml`), and any relevant context files for your track (`agents/agent-*-context.md` once published).
2. Enumerate edge cases with the checklist in `docs/dev/edge-case-checklist.md`. Capture them in the GitHub issue you are about to create.

## 2. Create a GitHub issue with the CLI

All work begins with a tracked issue using the `Implementation Task` template.

```bash
# Example command – replace placeholders appropriately
gh issue create --title "[Feature] Implement member loan renewal flow" --label implementation --template implementation-task.md
```

- The CLI will open an editor populated with the template; so provide text for the user to paste in order to fill in every section (summary, acceptance criteria, edge cases, test plan, dependencies) before submitting.
- If the work is a bug fix, it is planned that all bug reports will be intiated by user, then you can open a follow-up implementation issue describing the remedial work.

## 3. Create a dedicated branch

Name branches using your agent identifier and the GitHub issue number.

```bash
# Suppose your agent name is agent1 and the issue number is 123
git checkout -b agent1/issue-123-loan-renewal
```

- Keep branch names lowercase with hyphenated slugs after the issue number.
- Use `git push --set-upstream origin agent1/issue-123-loan-renewal` on the first push.

## 4. Drive development edge-case first

1. Translate the edge cases from the issue, or if not provided, any edge cases that can be accurately understood by the nature of the issue, into failing tests **before** changing production code.
2. Write or update unit/integration tests (`npm test -- --watch` is helpful locally). Include accessibility or manual checks when the edge-case checklist demands it.
3. Implement the feature/function/handler until all new tests pass.
4. Update documentation artifacts that serve as contracts (`docs/api/openapi.yaml`, adapters, README, etc.) if your change affects them.

## 5. Run the full test suite

Before committing, run the standard quality gates:

```bash
npm run lint
npm run typecheck
npm test
```

Add any additional project-specific checks the issue calls out (e.g., `npm run build`, Playwright smoke tests).

## 6. Commit with an issue-referenced message

When you are ready to commit, stage only the relevant files and craft a subject line that references the issue number:

```bash
git commit -m "feat(#123): add loan renewal edge-case coverage"
```

- The agent should suggest a concise subject; developers may extend the body with further context.
- Keep commits focused—split work if unrelated changes emerge.

## 7. Open a pull request via GitHub CLI

After tests pass locally:

```bash
gh pr create --title "feat: implement loan renewal edge cases" --body-file .github/pull_request_template.md --fill --head agent1/issue-123-loan-renewal --base main
```

- Ensure the PR body links to the issue (e.g., `Closes #123`) and checks off completed tasks in the template.
- Mention any manual test evidence, screenshots, or logs.
- PRs should only be opened when automated and relevant manual tests are green.

## 8. Handoff

- Request review from the manager or designated reviewer.
- Remain available to address feedback promptly.
- Once approved and merged, close any lingering tasks in the issue and update context files as needed.

## Quick Reference

1. Draft issue (`gh issue create` using template)
2. Create branch `agentname/issue-###-slug`
3. Outline edge cases → write failing tests
4. Implement until tests pass
5. Run `npm run lint`, `npm run typecheck`, `npm test`
6. Commit with `feat(#issue): ...` or `fix(#issue): ...`
7. Open PR (`gh pr create`), link issue, complete template
8. Address reviews and land the change

Adhering to this flow keeps the team aligned with our TDD, documentation, and CI expectations. Deviations should be agreed upon with the manager agent ahead of time.
