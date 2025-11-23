# PulsePoint

The backend-agnostic reactive engine. Keep your HTML, add fine-grained reactivity with a tiny runtime.

- **Official site:** [https://pulsepoint.tsnc.tech/](https://pulsepoint.tsnc.tech/)
- **Documentation:** [https://pulsepoint.tsnc.tech/docs](https://pulsepoint.tsnc.tech/docs)

---

## Why PulsePoint?

Modern web development often forces a choice: either ship a full SPA with a heavy build pipeline, or sprinkle imperative JavaScript on top of server-rendered pages as your UI grows more complex.

PulsePoint sits in the middle:

- **Zero build step** – Just drop in a `<script type="module">` tag, no bundlers or JSX compilation required.
- **Backend-agnostic** – Works with any stack that can render HTML: PHP, Node, Python, Go, C#, Rust, and more.
- **Browser-resident state** – State and effects live entirely in the browser (`pp.state`, `pp.effect`), with no hydration dance.
- **Template-first syntax** – Use `pp-for`, `pp-ref`, `pp-spread` and mustache-style `{jsExpression}` bindings directly in your markup.
- **Surgical DOM updates** – Only the exact text nodes and attributes that change are updated. No virtual DOM overhead.
- **TypeScript runtime** – A tiny, strongly-typed client runtime designed for predictable, debuggable reactivity.
- **Drop-in ready** – Keep your existing routing, auth, and ORM. Add PulsePoint only where you need interactivity.

---

## Getting Started (CDN)

The fastest way to try PulsePoint is via the official CDN. Create an `index.html` file and paste the following:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PulsePoint App</title>
    <!-- 1. Import PulsePoint -->
    <script type="module">
      import { PP } from "https://cdn.tsnc.tech/pp-reactive-v1.js";

      // 2. Initialize
      window.pp = new PP();

      // 3. Handle Hydration (Prevents FOUC)
      document.addEventListener("pp:hydrated", () => {
        document.body.style.display = "block";
      });
    </script>
  </head>

  <!-- Hidden by default until hydrated -->
  <body style="display: none;">
    <h1>Hello World</h1>
    <p>PulsePoint is ready.</p>
  </body>
</html>
```

Open this file in your browser and you are ready to start adding reactive behavior.

---

## Example: Counter

Here is a minimal counter example that shows how PulsePoint binds browser state to your HTML:

```html
<h1>Count is: {count}</h1>

<button onclick="setCount(count + 1)" disabled="{count >= 10}">
  Increment
</button>

<button onclick="setCount(count - 1)" disabled="{count <= 0}">Decrement</button>

<script type="text/pp">
  const [count, setCount] = pp.state(0);
</script>
```

- State is declared in standard JavaScript via `pp.state`.
- The `{count}` binding and `disabled="{count >= 10}"` expressions are kept in sync automatically.
- No compile step or framework-specific templating is required.

---

## Core Concepts

PulsePoint gives you a React-style mental model while staying as close as possible to plain HTML and JavaScript.

### State & Effects

- `pp.state(initialValue)` – declare reactive state in plain JS.
- `pp.effect(fn)` – run reactive effects whenever the values inside change.

These are the building blocks for browser-resident state, pagination, infinite scroll, quick filters, and more.

### Template & Mustache Bindings

Use curly braces to bind expressions directly in your HTML:

- **Text interpolation** – `Hello {name}!`
- **Attribute binding** – `disabled="{isSubmitting}"`, `class="{isActive ? 'btn-primary' : 'btn'}"`
- **Event handling** – `onclick="handleClick()"`, `oninput="setName(event.target.value)"`
- **Two-way data binding** – `value="{name}"` + `oninput="setName(event.target.value)"`
- **Conditional rendering** – show/hide sections based on boolean expressions.

### Directives

Core structural directives:

- `pp-for` – list rendering (`<template pp-for="todo in todos">…`)
- `pp-ref` – capture DOM references into JS.
- `pp-spread` – spread attribute bags into an element.
- `pp-ignore` – opt out of reactive parsing for a subtree.

### Components & Composition

- Define components with `pp-component`.
- Pass props using standard HTML attributes (e.g. `is-active="{isActive}"`).
- Compose components, share context, and use Portals to render overlays, modals, and toasts outside the main DOM tree.

---

## Works with Any Backend

Because PulsePoint is just HTML plus a small JS runtime, it fits naturally in almost any backend stack:

- **Node.js / Express** – use it in EJS, Pug, or Handlebars layouts.
- **Python (Django / FastAPI)** – add it to Jinja2 or Django templates.
- **PHP (Laravel / Symfony / custom)** – include it in Blade layouts or shared header/footer files.
- **C# / .NET** – drop it into Razor (`_Layout.cshtml`) pages.
- **Go (Gin / Echo)** – use it with the standard `html/template` library.
- **Rust (Actix / Axum)** – integrate with Askama, Tera, Maud, and similar template engines.

If a backend can render HTML, it can host a PulsePoint application.

---

## Documentation Structure

The full documentation is available on the official site. Key sections include:

- **Getting Started**
  - Introduction
  - Installation
- **Core**
  - State
  - Effect
  - Ref
  - Loop
  - Spread
- **Template & Mustache**
  - Text Interpolation
  - Attribute Binding
  - Event Handling
  - Two-Way Data Binding
  - Conditional Rendering
- **Components**
  - Components
  - Component Props
  - Component Children
  - Context Management
- **Examples**
  - Count
  - Todo List
  - Infinite Scroll
  - Paginate

For details and live examples, see the official docs:

- [https://pulsepoint.tsnc.tech/docs](https://pulsepoint.tsnc.tech/docs)

---

## Roadmap & Status

- ✅ v1.0 – Production ready core runtime.
- ✅ Browser-resident state and effects (`pp.state`, `pp.effect`).
- ✅ Template directives (`pp-for`, `pp-ref`, `pp-spread`, `pp-ignore`).
- ✅ Component model with props, children, context, and portals.
- ✅ Backend-agnostic integrations for PHP, Node, Python, Go, C#, Rust, and more.
- 🚧 Ecosystem tooling, helpers, and framework-specific examples.

Track progress and updates on the official site:

- [https://pulsepoint.tsnc.tech/](https://pulsepoint.tsnc.tech/)

---

## Contributing

PulsePoint is open source and maintained by **The Steel Ninja Code**.

### Community contributions

If you are reading this on GitHub and the repository is public:

- Open an issue for bugs, questions, or feature requests.
- Submit pull requests for documentation improvements or small fixes.
- Share examples of how you are using PulsePoint in your own stack.

Please check the contribution guidelines (if present in the repository) before opening large PRs.

### Professional support & JSX-style integrations

If you want The Steel Ninja Code to help you implement a **PulsePoint + JSX-style experience** in your backend of choice (PHP, Node/Express, Laravel, Django/FastAPI, ASP.NET, Go, Rust, etc.), we can:

- Design a JSX-like authoring layer on top of your existing templating engine.
- Define component patterns, state/effect helpers, and reusable abstractions.
- Review architecture and give concrete feedback to push your DX to the next level.
- Help you integrate PulsePoint with your current tooling (CLIs, editors, build pipeline).

For consulting, implementation support, or tailored feedback, reach out via:

- **Email:** [thesteelninjacode@gmail.com](mailto:thesteelninjacode@gmail.com)

---

## License

PulsePoint is open source software. License details will be provided in the repository’s `LICENSE` file.
