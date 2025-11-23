# Contributing to PulsePoint

First of all, thank you for your interest in contributing to PulsePoint!

This document describes how to propose changes, report issues, and collaborate on the project in a way that keeps the codebase healthy and the DX experience strong.

---

## Getting Started

1. **Fork** this repository to your own GitHub account.

2. **Clone** your fork locally:

   ```bash
   git clone https://github.com/<your-username>/<your-pulsepoint-fork>.git
   cd <your-pulsepoint-fork>
   ```

3. **Create a feature branch** from `main` (or the active development branch):

   ```bash
   git checkout -b feature/my-improvement
   ```

4. Install dependencies and set up the project as described in the `README.md`.

---

## Code Style & Principles

- Keep changes **focused and small** when possible.
- Match existing **naming conventions**, file organization, and patterns.
- Prefer **clear, explicit code** over clever but hard-to-read solutions.
- When changing runtime behavior, consider how it affects:
  - State and effect semantics (`pp.state`, `pp.effect`),
  - Template directives (`pp-for`, `pp-ref`, `pp-spread`, `pp-ignore`),
  - Component composition and context.

### Tests & Examples

- Add or update tests when you change existing behavior.
- When you introduce a new feature, consider adding a **minimal example** or updating documentation so others understand how to use it.
- If your change affects docs or code snippets on the site, please update the relevant markdown or example file.

---

## Issues & Bug Reports

When filing an issue:

- Describe the **environment** (browser, OS, backend stack if relevant).
- Provide a **minimal reproduction**: a small HTML snippet or example that shows the problem.
- Include logs or errors from the browser console when they help clarify the issue.

Well-scoped, reproducible issues are much easier to fix and review.

---

## Pull Requests

Before opening a pull request:

- Make sure your branch is **up to date** with `main`.
- Run any available checks/tests locally (linters, unit tests, etc.).
- Ensure there are **no obvious console errors** in the examples you touched.

When creating the PR:

- Use a **clear title** and a concise summary of what you changed.
- Explain the **motivation** (what problem it solves, or which issue it closes).
- If your change is user-facing (new APIs, new directives, breaking changes), note this explicitly.

For large or potentially breaking changes, please **open an issue or discussion first** to align on the approach.

Also, please check the contribution guidelines (this document) before opening large PRs.

---

## Documentation Contributions

Improvements to documentation, examples, and wording are highly welcome. Good documentation is a key part of PulsePoint’s DX.

Useful documentation contributions include:

- Clarifying an API or directive behavior.
- Adding small examples that demonstrate real-world use.
- Fixing typos, broken links, or outdated descriptions.

---

## Professional Support & JSX-Style Integrations

If you want The Steel Ninja Code to help you implement a **PulsePoint + JSX-style experience** in your backend of choice (PHP, Node/Express, Laravel, Django/FastAPI, ASP.NET, Go, Rust, etc.), we can:

- Design a JSX-like authoring layer on top of your existing templating engine.
- Define component patterns, state/effect helpers, and reusable abstractions.
- Review architecture and give concrete feedback to push your DX to the next level.
- Help you integrate PulsePoint with your current tooling (CLIs, editors, build pipeline).

For consulting, implementation support, or tailored feedback, reach out via:

- **Email:** [thesteelninjacode@gmail.com](mailto:thesteelninjacode@gmail.com)

---

## Code of Conduct

Please be respectful and constructive in all interactions. The goal is to build a welcoming and collaborative environment for everyone interested in PulsePoint.

If there is an official Code of Conduct file in this repository (e.g. `CODE_OF_CONDUCT.md`), please review and follow it as well.
