# PulsePoint v2

> **You are reading the documentation for PulsePoint v2 (current).**
> [← Back to the project overview](../README.md) · [Switch to v1 →](../v1/README.md)

The backend-agnostic reactive engine. Keep your HTML, add fine-grained reactivity with a
tiny runtime — now with a full component model, a React-style hooks surface, and a
documented server wire contract.

- **Runtime file:** [`pp-reactive-v2.min.js`](./pp-reactive-v2.min.js)
- **Type definitions:** [`types/`](./types)
- **AI implementation context:** [`pulsepoint.md`](./pulsepoint.md)
- **Official site:** [https://pulsepoint.tsnc.tech/](https://pulsepoint.tsnc.tech/)
- **Documentation:** [https://pulsepoint.tsnc.tech/docs](https://pulsepoint.tsnc.tech/docs)

---

## Why PulsePoint v2?

Modern web development often forces a choice: either ship a full SPA with a heavy build
pipeline, or sprinkle imperative JavaScript on top of server-rendered pages as your UI
grows more complex.

PulsePoint sits in the middle, and v2 pushes that middle much further:

- **Zero build step** – One `<script type="module">` tag. No bundler, no JSX compilation.
- **Backend-agnostic** – Works with any stack that can render HTML: PHP, Node, Python, Go, C#, Rust, and more.
- **Real component model** – Regions of server-rendered HTML marked with `pp-component`, each owning its own `<script>` evaluated in component scope.
- **React-style hooks** – `pp.state`, `pp.effect`, `pp.memo`, `pp.reducer`, `pp.transition`, `pp.optimistic`, `pp.errorBoundary` and more, all on the `pp` object.
- **Server-connected** – A documented wire contract: RPC over POST, SSE streaming, CSRF, named WebSockets, and server-driven redirects.
- **Optional SPA navigation** – Same-origin link interception with scroll and history management, opt-out per link.
- **Surgical DOM updates** – A DOM morpher reconciles only what changed. No virtual DOM.
- **Strongly typed** – The runtime is authored in TypeScript; `.d.ts` files ship in [`types/`](./types).
- **Drop-in ready** – Keep your existing routing, auth, and ORM. Add PulsePoint only where you need interactivity.

---

## Getting Started (CDN)

The fastest way to try PulsePoint v2 is via the official CDN. Create an `index.html` file
and paste the following:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PulsePoint App</title>

    <!-- Import PulsePoint — it exposes a global `pp` and auto-mounts on DOMContentLoaded -->
    <script type="module" src="https://cdn.tsnc.tech/pp-reactive-v2.min.js"></script>
  </head>

  <!-- Hidden until hydrated; the runtime reveals the body and restores the inline style -->
  <body style="opacity: 0;">
    <div pp-component="hello_1">
      <h1>Hello {name}</h1>
      <input value="{name}" oninput="setName(event.target.value)" />

      <script>
        const [name, setName] = pp.state("World");
      </script>
    </div>
  </body>
</html>
```

### Self-hosted (recommended for production)

Copy [`pp-reactive-v2.min.js`](./pp-reactive-v2.min.js) into your static assets directory
and reference it from your base layout:

```html
<script type="module" src="/js/pp-reactive-v2.min.js"></script>
```

The runtime has zero dependencies. Place the tag in `<head>` with `type="module"`, or at
the end of `<body>`. `pp.mount()` is idempotent and safe to call manually.

---

## Example: Counter

```html
<div pp-component="counter_1">
  <h1>Count is: {count}</h1>

  <button onclick="setCount(count + 1)" disabled="{count >= 10}">Increment</button>
  <button onclick="setCount(count - 1)" disabled="{count <= 0}">Decrement</button>

  <script>
    const [count, setCount] = pp.state(0);
  </script>
</div>
```

- Top-level `const`/`let`/`function` declarations in the component script are exported to
  template scope, so `{count}` and `onclick="setCount(...)"` just work.
- `{count}` and `disabled="{count >= 10}"` stay in sync automatically.
- No compile step or framework-specific templating is required.

---

## Core Concepts

### Components

A component is any element carrying a unique `pp-component` id, with its `<script>`
inside that root:

```html
<div pp-component="counter_1">
  <p>Count: {count}</p>
  <button onclick="setCount(count + 1)">Increment</button>

  <script>
    const [count, setCount] = pp.state(0);
  </script>
</div>
```

The server generates the id (any scheme works: `counter_1`, `page_products`, a hash), and
it must be unique per page. Nested components are just nested `pp-component` elements;
attributes on a nested root become `pp.props` in its script (kebab-case arrives
camelCased: `on-select` → `pp.props.onSelect`). A brace attribute (`items="{visible}"`)
is evaluated in the parent's scope and keeps its real type; a literal server-rendered
value arrives as a string.

Three root shapes exist:

| Shape | What it looks like | When to use |
|---|---|---|
| **Single root** | `<div pp-component="id">…</div>` | The default |
| **Composition root** | A `display: contents` host whose only element child is another component root | A wrapper component that "returns" another component |
| **Fragment** | `<!--pp:id-->` siblings `<!--/pp-->` | Multi-root components, and contexts like `<tbody>`/`<tr>`/`<select>` where a wrapper element would be foster-parented out |

### Children (slot content)

Markup a parent passes **into** a child component is rendered inside the child's boundary,
wrapped in `<template pp-owner="parent_id">`. Everything inside the wrapper —
`{expressions}`, `on*` handlers, `pp-ref` — resolves in the **owner's** scope, not the
child's (React-children semantics):

```html
<div pp-component="page_1">
  <div pp-component="card_1" title="Team">
    <template pp-owner="page_1">
      <p>{memberCount} members</p>
      <button onclick="invite()">Invite</button>
    </template>
  </div>

  <script>
    const [memberCount, setMemberCount] = pp.state(3);
    const invite = () => setMemberCount(memberCount + 1);
  </script>
</div>
```

The alias `pp-owner="app"` refers to the page's root component instance. When the owner
re-renders, its slot content re-renders with it.

### State & Effects

- `pp.state(initialValue)` → `[value, setValue]` (the setter accepts a value or an updater function).
- `pp.effect(cb, deps?)` – runs after render; may return a synchronous cleanup.
- `pp.layoutEffect(cb, deps?)` – runs before paint.
- `pp.ref(initial?)` → `{ current }` – imperative handles and non-rendering values.

### Template & Mustache Bindings

Use curly braces to bind expressions directly in your HTML — **always inside quotes**:

- **Text interpolation** – `Hello {name}!`
- **Attribute binding** – `disabled="{isSubmitting}"`, `class="{isActive ? 'btn-primary' : 'btn'}"`
- **Event handling** – `onclick="handleClick()"`, `oninput="setName(event.target.value)"`
- **Two-way data binding** – `value="{name}"` + `oninput="setName(event.target.value)"`
- **Conditional rendering** – `hidden="{!isOpen}"`

Inside an `on*` attribute the runtime injects `event`, plus the aliases `e`, `$event`,
`target` (`event.target`), and `currentTarget` / `el` (both `event.currentTarget`).

### Directives (closed list)

| Syntax | Where | Purpose |
|---|---|---|
| `{expression}` | Text nodes and **quoted** attribute values | Interpolation |
| `on*` | Any element | Native DOM event binding |
| `pp-for="item in items"` / `"(item, index) in items"` | **`<template>` only** | Keyed list rendering |
| `key="{expr}"` | The repeated element inside `pp-for` | Keyed diffing identity |
| `pp-ref="name"` / `pp-ref="{expr}"` | Elements and component roots | Imperative element access |
| `hidden="{!cond}"` | Any element | Conditional rendering |
| `defaultvalue="{expr}"` (lowercase) | `<input>`, `<textarea>`, `<select>` | Seed an uncontrolled field once |
| `defaultchecked="{expr}"` (lowercase) | checkbox / radio | Seed an uncontrolled check once |
| `pp-style="{cssText}"` | Any element | Dynamic inline style as a CSS **string** |
| `pp-spread="{...obj}"` | Any element | Spread an object into attributes |
| `<token.provider value="{v}">` | Anywhere | Context provider element |
| `<template pp-owner="owner_id">` | Inside a child component's boundary | Slot content (children) |
| `pp-ref-forward="true"` | A composition host | Forward a `pp-ref` to the concrete root |
| `<!--pp:id-->` … `<!--/pp-->` | Around sibling roots | Fragment (multi-root component) markers |
| `pp-spa="false"` | An `<a>` | Opt one link out of SPA interception |
| `pp-reset-scroll="true"` | A scroll container or `<body>` | Reset scroll on navigation |
| `pp-scroll-key="name"` | A scroll container | Stable scroll restoration identity |
| `pp-loading-content="true"` | The region swapped during SPA navigation | Marks the navigation content region |
| `pp-loading-url="/route"` | A loading-state element | Route-specific loading lookup |

There is **no** `pp-if`, `pp-show`, `pp-else`, `pp-model`, `pp-bind`, `pp-class`,
`pp-text`, `pp-html`, `pp-on` or `pp-key`. Conditionals are `hidden="{...}"`; two-way
binding is `value="{state}"` plus an `oninput` handler. A valid PulsePoint template is
still valid HTML if you delete every `{}`.

Form controls are controlled (`value="{state}"` / `checked="{state}"`) **or** uncontrolled
(`defaultvalue` / `defaultchecked`) for their whole lifetime — never both, and never
switching.

### Lists

```html
<ul>
  <template pp-for="todo in todos">
    <li key="{todo.id}">
      {todo.title}
      <button onclick="removeTodo(todo.id)">Remove</button>
    </li>
  </template>
</ul>
```

Keys must be stable (an id, never a random value). Rows are reconciled per row: a row
whose markup is unchanged is reused, not re-parsed.

---

## Hooks Reference

All hooks live on the global `pp` object and are called from a component `<script>`:

| Hook | Returns | Purpose |
|---|---|---|
| `pp.state(initial)` | `[value, setValue]` | Reactive state |
| `pp.effect(cb, deps?)` | – | Side effect after render (optional cleanup) |
| `pp.layoutEffect(cb, deps?)` | – | Side effect before paint |
| `pp.ref(initial?)` | `{ current }` | Mutable, non-rendering value or DOM handle |
| `pp.memo(factory, deps)` | value | Memoized computation |
| `pp.callback(fn, deps)` | fn | Stable function identity |
| `pp.reducer(reducer, initialState)` | `[state, dispatch]` | Reducer state |
| `pp.context(token)` | value | Read a context value |
| `pp.portal(ref, target?)` | – | Render outside the tree (default target `document.body`) |
| `pp.id()` | string | Stable DOM-safe unique id |
| `pp.syncExternalStore(subscribe, getSnapshot)` | value | Subscribe to an external store |
| `pp.imperativeHandle(ref, createHandle, deps?)` | – | Expose an imperative API through a ref |
| `pp.transition()` | `[isPending, startTransition]` | Non-blocking updates |
| `pp.deferredValue(value, initial?)` | value | Deferred/low-priority value |
| `pp.optimistic(passthrough, reducer?)` | `[optimisticState, addOptimistic]` | Optimistic UI |
| `pp.errorBoundary()` | `[error, reset]` | Catch and recover from render errors |
| `pp.props` | object | The component's props bag |

Runtime utilities: `pp.createContext(defaultValue)`, `pp.mount()`, `pp.redirect(url)`,
`pp.rpc(name, data?, options?)`, `pp.socket(name, args?, handlers?)`, `pp.enablePerf()`,
`pp.disablePerf()`, `pp.getPerfStats()`, `pp.resetPerfStats()`.

There is no `forwardRef` function (ref forwarding is the `pp-ref-forward="true"` attribute
on a composition host), and no `Suspense`, `lazy`, `useInsertionEffect`, `useActionState`
or `memo()` wrapper.

---

## Talking to Your Backend

v2 adds a small, fully documented wire contract. Every piece is optional — a read-only
page needs none of it.

### RPC

```html
<script>
  const save = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const result = await pp.rpc("saveItem", data);
  };
</script>
```

`pp.rpc("functionName", data)` sends a `POST` to the **current route URL** (override with
`options.url`) carrying:

- `X-PP-RPC: true` — route on this header.
- `X-PP-Function: functionName` — the server-side function to invoke.
- `X-CSRF-Token: <token>` — read from the `pp_csrf` cookie.
- `X-PulsePoint-Wire: true`, `X-Requested-With: XMLHttpRequest`, `Accept: application/json, text/event-stream`.

The body is `application/json`, or `multipart/form-data` when any value is a
`File`/`FileList`. Your server should dispatch `X-PP-Function` against an **explicit
per-route allow-list** (never `eval` a name), filter the payload against the function's
declared parameters, and return JSON.

- **Streaming:** respond with `Content-Type: text/event-stream`; the client consumes chunks through `options.onStream(chunk)`, then `onStreamComplete()`.
- **Redirects:** respond with `X-PP-Redirect: /target` (or `Location`); the client navigates, SPA-aware. Cross-origin targets are ignored.
- **Errors:** non-2xx rejects the promise; include `{"error": "message"}` for a useful message.

### CSRF

The client reads the token from a `pp_csrf` cookie (on localhost it prefers a port-scoped
`pp_csrf_<port>` cookie so parallel dev servers don't clash). If the cookie is missing it
performs one GET to the route expecting the server to set it. Set the cookie on page
responses and verify `X-CSRF-Token` against it on every RPC POST.

### Named WebSockets

`pp.socket("chatRoom", args, handlers)` opens a socket to
`ws(s)://<origin>/__pulsepoint/ws?name=chatRoom`. The first frame the client sends is one
JSON object (the arguments); every subsequent frame in either direction is one JSON value.
A frame of exactly `{"error": "message"}` routes to `onError` and closes.

Handlers: `onOpen()`, `onMessage(value)`, `onError(error)`, `onClose({ code, reason, wasClean })`.
The returned handle exposes `send(value)` (buffers frames sent before open), `close(code?, reason?)`
and `readyState`. Open in `pp.effect(..., [])`, keep the handle in `pp.ref(...)`, close it
in the effect cleanup. Production servers must check `Origin` against an allow-list, cap
connections, and bound message size and rate.

### SPA navigation

`pp.mount()` intercepts same-origin `<a>` clicks, fetches the next page, swaps the region
marked `pp-loading-content="true"`, and manages scroll and history. Serve full HTML
documents for every route; optionally send `X-PP-Root-Layout: <id>` (also emitted as
`meta[name="pp-root-layout"]`) so the client can detect layout changes and fall back to a
full load. Per-link `pp-spa="false"` opts out.

---

## Works with Any Backend

Because PulsePoint is just HTML plus a small JS runtime, it fits naturally in almost any
backend stack:

- **Node.js / Express** – use it in EJS, Pug, or Handlebars layouts.
- **Python (Django / FastAPI)** – add it to Jinja2 or Django templates.
- **PHP (Laravel / Symfony / custom)** – include it in Blade layouts or shared header/footer files.
- **C# / .NET** – drop it into Razor (`_Layout.cshtml`) pages.
- **Go (Gin / Echo)** – use it with the standard `html/template` library.
- **Rust (Actix / Axum)** – integrate with Askama, Tera, Maud, and similar template engines.

### Integration checklist

1. **Serve the runtime** from your static assets and add the `<script type="module">` tag to your base layout.
2. **Render components**: wrap interactive regions in an element with a server-generated unique `pp-component` id, with the component `<script>` inside that root.
3. **Escape user data**: server-interpolated content must be HTML-escaped **and** must not leak live `{`/`}` into the DOM (encode them as `&#123;`/`&#125;`), or stored input like `{fetch(...)}` would execute as a template expression. This is the one security rule specific to PulsePoint. The same encoding avoids collisions with template engines that use braces.
4. **Set the CSRF cookie** on page responses.
5. **Handle RPC POSTs** with one middleware catching `X-PP-RPC: true`.
6. **Optional**: SSE streaming, a `/__pulsepoint/ws` endpoint, `X-PP-Redirect`, and `<template pp-component>` deferral for flash-free first paint.

### Server-side deferral (recommended)

Raw `{...}` placeholders in `src`, SVG geometry, form values or table text can be parsed
by the browser before the runtime mounts. To make first paint flash-free, wrap each
**outermost** component root in an inert template — the runtime materializes it during
mount:

```html
<template pp-component="counter_1">
  <div pp-component="counter_1">…</div>
</template>
```

---

## Full Example: Todos

```html
<section pp-component="todos_page">
  <form onsubmit="add(event)">
    <input name="title" />
    <button>Add</button>
  </form>

  <ul>
    <template pp-for="todo in todos">
      <li key="{todo.id}">{todo.title}</li>
    </template>
  </ul>

  <script>
    const [todos, setTodos] = pp.state([]);

    pp.effect(() => {
      pp.rpc("listTodos").then(setTodos);
    }, []);

    const add = async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      const created = await pp.rpc("addTodo", data);
      setTodos([...todos, created]);
      event.currentTarget.reset();
    };
  </script>
</section>
```

---

## Performance Notes

- `pp.state` is for values whose change must produce a render. Timers, request generations, cursors and transient text belong in `pp.ref`.
- Keyed `pp-for` rows are reconciled per row — keep per-row work cheap and keys stable.
- A mounted nested component is reconciled by its **attributes**, not by re-parsing its markup: pass changing data as props instead of re-rendering parents wholesale.
- Discard stale RPC responses in search/filter flows (`abortPrevious: true`, or a generation counter in a ref).
- Never "optimize" by replacing PulsePoint bindings with manual `querySelector`/`innerHTML` wiring — that defeats reconciliation and scope tracking.

---

## Debugging

- The runtime logs `[PP-ERROR]` / `[PP-WARN]` prefixed messages to the console.
- A blank component with no console error usually means invalid HTML in the template — most often an **unquoted** brace attribute (`class={expr}` instead of `class="{expr}"`).
- `pp.enablePerf()` / `pp.getPerfStats()` expose render timings.

---

## Documentation Structure

The full documentation is available on the official site. Key sections include:

- **Getting Started** – Introduction, Installation
- **Core** – State, Effect, Ref, Loop, Spread
- **Template & Mustache** – Text Interpolation, Attribute Binding, Event Handling, Two-Way Data Binding, Conditional Rendering
- **Components** – Components, Props, Children, Composition Roots, Fragments, Context Management, Portals
- **Server** – RPC, Streaming, CSRF, Sockets, SPA Navigation
- **Examples** – Count, Todo List, Infinite Scroll, Paginate

For details and live examples, see [https://pulsepoint.tsnc.tech/docs](https://pulsepoint.tsnc.tech/docs).

Working with an AI assistant? Point it at [`pulsepoint.md`](./pulsepoint.md) — a
self-contained implementation context for generating correct PulsePoint v2 code in any
backend.

---

## Roadmap & Status (v2)

- ✅ Component model with props, children, context, portals, composition roots, and fragments.
- ✅ Full hooks surface (state, effect, layoutEffect, ref, memo, callback, reducer, transition, deferredValue, optimistic, errorBoundary, imperativeHandle, syncExternalStore, id).
- ✅ Server wire contract: RPC, SSE streaming, CSRF, named WebSockets, server-driven redirects.
- ✅ Optional SPA navigation with scroll and history management.
- ✅ TypeScript-authored runtime with shipped `.d.ts` definitions.
- 🚧 Ecosystem tooling, helpers, and framework-specific examples.

---

## Migrating from v1

See the [migration notes in the project overview](../README.md#migrating-from-v1-to-v2).
The v1 documentation stays available at [`v1/README.md`](../v1/README.md).

---

## Contributing

PulsePoint is open source and maintained by **The Steel Ninja Code**.

- Open an issue for bugs, questions, or feature requests.
- Submit pull requests for documentation improvements or small fixes.
- Share examples of how you are using PulsePoint in your own stack.

Please read [CONTRIBUTING.md](../CONTRIBUTING.md) before opening large PRs.

### Professional support & JSX-style integrations

If you want The Steel Ninja Code to help you implement a **PulsePoint + JSX-style
experience** in your backend of choice (PHP, Node/Express, Laravel, Django/FastAPI,
ASP.NET, Go, Rust, etc.), we can:

- Design a JSX-like authoring layer on top of your existing templating engine.
- Define component patterns, state/effect helpers, and reusable abstractions.
- Review architecture and give concrete feedback to push your DX to the next level.
- Help you integrate PulsePoint with your current tooling (CLIs, editors, build pipeline).

For consulting, implementation support, or tailored feedback, reach out via:

- **Email:** [thesteelninjacode@gmail.com](mailto:thesteelninjacode@gmail.com)

---

## License

PulsePoint is released under the MIT License. See [LICENSE](../LICENSE) at the root of the
repository.
