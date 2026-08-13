# PulsePoint

**The backend-agnostic reactive engine.** Keep your HTML, add fine-grained reactivity with
a tiny runtime — no build step, no virtual DOM, no JSX.

- **Official site:** [https://pulsepoint.tsnc.tech/](https://pulsepoint.tsnc.tech/)
- **Documentation:** [https://pulsepoint.tsnc.tech/docs](https://pulsepoint.tsnc.tech/docs)
- **License:** [MIT](./LICENSE) · **Contributing:** [CONTRIBUTING.md](./CONTRIBUTING.md)

This repository ships **two independent versions** of the runtime. This page is the
version-neutral overview; each version documents itself in its own folder.

---

## 📚 Pick your version

<table>
<tr>
<th width="50%" align="center">

### 🚀 v2 — Current

</th>
<th width="50%" align="center">

### 📦 v1 — Stable

</th>
</tr>
<tr>
<td valign="top">

Component model with `pp-component`, a full React-style hooks surface, and a documented
server wire contract (RPC, streaming, CSRF, WebSockets, SPA navigation).

**Use it for new projects.**

```html
<script type="module">
  import { ComponentInit as PP }
    from "/js/pp-reactive-v2.min.js";

  PP.bootstrap();
</script>
```

📖 **[Read the v2 documentation →](./v2/README.md)**

</td>
<td valign="top">

The original runtime: browser-resident state and effects, template directives, and a
lightweight component model. Supported, but feature-frozen.

**Use it for existing applications.**

```html
<script type="module">
  import { PP } from "https://cdn.tsnc.tech/pp-reactive-v1.js";
  window.pp = new PP();
</script>
```

📖 **[Read the v1 documentation →](./v1/README.md)**

</td>
</tr>
</table>

<details>
<summary><b>👀 Prefer a quick side-by-side peek? Expand a version below.</b></summary>

<br />

<details>
<summary><b>🚀 PulsePoint v2 at a glance</b></summary>

```html
<template pp-component="counter_1">
  <div pp-component="counter_1">
    <p>Count: {count}</p>
    <button onclick="setCount(count + 1)">Increment</button>

    <script>
      const [count, setCount] = pp.state(0);
    </script>
  </div>
</template>
```

- Reactivity is scoped to a component boundary (`pp-component="unique_id"`).
- Regions are authored inside an inert `<template pp-component>` that `PP.bootstrap()` materializes, so nothing flashes or runs early.
- The component's own `<script>` lives inside its root and is evaluated in component scope.
- Hooks: `state`, `effect`, `layoutEffect`, `ref`, `memo`, `callback`, `reducer`, `context`,
  `portal`, `id`, `syncExternalStore`, `imperativeHandle`, `transition`, `deferredValue`,
  `optimistic`, `errorBoundary`.
- Server calls: `pp.rpc(...)`, `pp.socket(...)`, `pp.redirect(...)`.

→ [Full v2 documentation](./v2/README.md)

</details>

<details>
<summary><b>📦 PulsePoint v1 at a glance</b></summary>

```html
<h1>Count is: {count}</h1>
<button onclick="setCount(count + 1)">Increment</button>

<script type="text/pp">
  const [count, setCount] = pp.state(0);
</script>
```

- The `PP` class is imported and instantiated by your page (`window.pp = new PP()`).
- Scripts are authored as `<script type="text/pp">`.
- Core API: `pp.state`, `pp.effect`, `pp.ref`.
- Directives: `pp-for`, `pp-ref`, `pp-spread`, `pp-ignore`.

→ [Full v1 documentation](./v1/README.md)

</details>

</details>

---

## What PulsePoint is

Modern web development often forces a choice: either ship a full SPA with a heavy build
pipeline, or sprinkle imperative JavaScript on top of server-rendered pages as your UI
grows more complex.

PulsePoint sits in the middle. Both versions share the same philosophy:

- **Zero build step** – drop in a `<script>` tag; no bundlers, no JSX compilation.
- **Backend-agnostic** – works with any stack that can render HTML: PHP, Node, Python, Go, C#, Rust, and more.
- **Browser-resident state** – state and effects live in the browser, with no hydration dance.
- **Template-first syntax** – `{jsExpression}` bindings and a small set of `pp-*` directives directly in your markup.
- **Surgical DOM updates** – only the exact text nodes and attributes that change are updated.
- **Drop-in ready** – keep your existing routing, auth, and ORM. Add PulsePoint only where you need interactivity.

If a backend can render HTML, it can host a PulsePoint application.

---

## Which version should I use?

| Your situation | Use |
|---|---|
| Starting a new project | **v2** |
| You need components with props, children, and composition | **v2** |
| You need server RPC, streaming, WebSockets, or SPA navigation | **v2** |
| You want the full React-style hooks surface | **v2** |
| You have a running v1 application | **v1** (migrate when convenient) |
| You only need state, effects, refs, and loops on a server-rendered page | Either — v1 is smaller in surface area, v2 is actively developed |

New capabilities land in v2 only. v1 receives fixes.

---

## Differences between v1 and v2

| | **v1** | **v2** |
|---|---|---|
| **Status** | Stable, feature-frozen | Current, actively developed |
| **Runtime file** | [`pp-reactive-v1.js`](./v1/pp-reactive-v1.js) (~305 KB) | [`pp-reactive-v2.min.js`](./v2/pp-reactive-v2.min.js) (~287 KB, minified) |
| **Setup** | `import { PP }` then `window.pp = new PP()` | `import { ComponentInit as PP }` then `PP.bootstrap()` once — the import also exposes the global `pp` |
| **Component script** | `<script type="text/pp">` | A plain `<script>` inside the component root |
| **Authoring shape** | Markup plus one script block per page | Each region wrapped in an inert `<template pp-component>` boundary, materialized at bootstrap |
| **Component model** | Lightweight — `pp-component` with props, context, portals | Full — component boundaries, composition roots (`display: contents`), multi-root fragments (`<!--pp:id-->`), slot content via `<template pp-owner>` |
| **Hooks** | `pp.state`, `pp.effect`, `pp.ref` | The v1 three plus `layoutEffect`, `memo`, `callback`, `reducer`, `context`, `portal`, `id`, `syncExternalStore`, `imperativeHandle`, `transition`, `deferredValue`, `optimistic`, `errorBoundary` |
| **Directives** | `pp-for`, `pp-ref`, `pp-spread`, `pp-ignore` | `pp-for`, `pp-ref`, `pp-spread`, `pp-style`, `pp-owner`, `pp-ref-forward`, `defaultvalue` / `defaultchecked`, plus SPA attributes (`pp-spa`, `pp-scroll-key`, `pp-reset-scroll`, `pp-loading-content`, `pp-loading-url`) |
| **Server communication** | Not part of the runtime — use `fetch` yourself | Built-in wire contract: `pp.rpc` over POST, SSE streaming, CSRF handling, named WebSockets (`pp.socket`), `X-PP-Redirect` |
| **SPA navigation** | ✗ | ✓ Optional same-origin link interception with scroll and history management |
| **Form controls** | Manual two-way binding | Explicit controlled / uncontrolled policy, focus and attribute sync managers |
| **Rendering** | Direct binding managers | DOM morpher with keyed row reconciliation and boundary content caching |
| **Types** | [`v1/types/`](./v1/types) | [`v2/types/`](./v2/types) — one `.d.ts` per runtime module |
| **AI guidance** | [`pulse-point-ai-aware-rules.md`](./v1/pulse-point-ai-aware-rules.md) | [`pulsepoint.md`](./v2/pulsepoint.md) |

Common to both: no `pp-if` / `pp-show` / `pp-model` / `pp-class` / `pp-text` — conditionals
are `hidden="{...}"`, two-way binding is `value="{state}"` plus an `oninput` handler, brace
attributes are **always quoted**, and `pp-for` lives only on `<template>`.

---

## Migrating from v1 to v2

v2 is not a drop-in replacement. The moving parts, roughly in the order you will hit them:

1. **Loading** – replace the `import { PP }` + `new PP()` block with
   `import { ComponentInit as PP } from ".../pp-reactive-v2.min.js"` followed by a single
   `PP.bootstrap()` call. That import is what exposes the global `pp`; module scripts are
   deferred, so your templates already exist when bootstrap runs.
2. **Component boundaries** – v2 requires an explicit `pp-component="unique_id"` around
   each interactive region, generated server-side and unique per page, with the outermost
   root wrapped in an inert `<template pp-component="unique_id">`.
3. **Scripts** – `<script type="text/pp">` becomes a plain `<script>` placed **inside**
   the component root. Top-level `const`/`let`/`function` declarations are exported to
   template scope.
4. **State, effects, refs, loops, spreads** – unchanged in shape. `pp.state`, `pp.effect`,
   `pp.ref`, `pp-for` with stable `key="{...}"`, and `pp-spread` all carry over.
5. **Data fetching** – hand-rolled `fetch` calls can move to `pp.rpc(name, data)` once your
   server implements the wire contract. This is optional; plain `fetch` keeps working.
6. **Escaping** – server-rendered user content must be HTML-escaped **and** must not leak
   live `{`/`}` into the DOM (encode them as `&#123;`/`&#125;`). Stored input like
   `{fetch(...)}` would otherwise execute as a template expression.

Full details in the [v2 documentation](./v2/README.md).

---

## Repository layout

```
.
├── README.md          ← you are here (project overview, version comparison)
├── CONTRIBUTING.md    ← how to propose changes
├── LICENSE            ← MIT
├── v1/
│   ├── README.md                        ← v1 documentation
│   ├── pp-reactive-v1.js                ← v1 runtime
│   ├── pulse-point-ai-aware-rules.md    ← v1 AI execution rules
│   └── types/                           ← v1 TypeScript definitions
└── v2/
    ├── README.md              ← v2 documentation
    ├── pp-reactive-v2.min.js  ← v2 runtime
    ├── pulsepoint.md          ← v2 AI implementation context
    └── types/                 ← v2 TypeScript definitions
```

Each version is self-contained: its runtime, its types, its AI guidance, and its own
README. Version-specific documentation belongs inside the version folder — this root page
stays general.

---

## Contributing

PulsePoint is open source and maintained by **The Steel Ninja Code**.

- Open an issue for bugs, questions, or feature requests — mention which version you are on.
- Submit pull requests for documentation improvements or small fixes.
- Share examples of how you are using PulsePoint in your own stack.

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening large PRs.

### Professional support & JSX-style integrations

If you want The Steel Ninja Code to help you implement a **PulsePoint + JSX-style
experience** in your backend of choice (PHP, Node/Express, Laravel, Django/FastAPI,
ASP.NET, Go, Rust, etc.), reach out:

- **Email:** [thesteelninjacode@gmail.com](mailto:thesteelninjacode@gmail.com)

---

## License

PulsePoint is released under the MIT License. See [LICENSE](./LICENSE).
