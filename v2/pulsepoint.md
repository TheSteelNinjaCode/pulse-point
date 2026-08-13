# PulsePoint v2 — AI Implementation Context

> This file is the complete, self-contained context an AI coding assistant needs to
> implement PulsePoint v2 in ANY backend. PulsePoint is a backend-agnostic reactive
> engine for the browser: the server renders plain HTML, and a single minified
> runtime (`pp-reactive-v2.min.js`) adds fine-grained reactivity on top of it.
> There is no build step, no virtual DOM, and no JSX.

## What PulsePoint is

- One JavaScript ES module. For a standalone page, import `ComponentInit` and
  call `PP.bootstrap()` exactly once after importing it. The import exposes the
  global `pp` object used inside component scripts.
- Components are regions of server-rendered HTML marked with a
  `pp-component="unique_id"` attribute. Each component may own one plain
  `<script>` inside its root; the runtime captures that script and evaluates it
  in component scope, giving it React-style hooks through `pp.*`.
- Templates are **plain HTML**. Reactivity comes from `{expression}`
  interpolation in text and quoted attributes, native `on*` event attributes,
  and a small closed set of `pp-*` directives.
- The backend stays the source of truth: routing, data, auth and rendering all
  live server-side. The runtime talks back to the server over a small, fully
  documented wire contract (RPC over POST, optional SSE streaming, optional
  WebSockets).

## Install

```html
<!-- Self-hosted (recommended): copy pp-reactive-v2.min.js into your static dir -->
<script type="module">
  import { ComponentInit as PP } from "/js/pp-reactive-v2.min.js";

  PP.bootstrap();
</script>
```

Serve the file from any static path. The runtime has zero dependencies. Place
the module script in `<head>` or at the end of `<body>`. Module scripts are
deferred, so the component templates exist when `PP.bootstrap()` runs.

Put each hand-authored reactive region inside a `<template pp-component>`
boundary (below). Its content stays inert until `PP.bootstrap()` materializes
it, preventing raw bindings from flashing and component scripts from running
before PulsePoint starts.

## Component model

A component is an element with `pp-component`:

```html
<div pp-component="counter_1">
  <p>Count: {count}</p>
  <button onclick="setCount(count + 1)">Increment</button>

  <script>
    const [count, setCount] = pp.state(0);
  </script>
</div>
```

Rules:

- The `pp-component` id must be unique per page. The server generates it (any
  scheme works: `counter_1`, `page_products`, a hash…).
- One root element per component is the DEFAULT shape; the `<script>` lives
  inside that root. Two more root shapes exist (both detailed below): a
  **composition root** (the component's root is another component) and a
  **multi-root fragment** (siblings framed by `<!--pp:id-->…<!--/pp-->`
  comment markers).
- Top-level `const`/`let`/`function` declarations in the script are exported to
  template scope: `{count}` in markup reads the `count` binding, `onclick="setCount(...)"`
  calls the exported setter. Top-level destructuring (array/object patterns) is
  exported too.
- Nested components are just nested `pp-component` elements. Attributes on a
  nested component's root become `pp.props` in its script (kebab-case attribute
  names arrive camelCased: `on-select` → `pp.props.onSelect`). A brace attribute
  (`items="{visible}"`) is evaluated in the parent's scope and keeps its real
  type; a literal server-rendered value arrives as a string.

### Children (slot content)

Markup a parent passes INTO a child component is rendered inside the child's
boundary, wrapped in `<template pp-owner="parent_id">`. Everything inside the
wrapper — `{expressions}`, `on*` handlers, `pp-ref` — resolves in the
**owner's** scope, not the child's (React-children semantics). The runtime
replaces the template in place with the rendered content, so the child decides
where children appear by where the server emits the wrapper. The alias
`pp-owner="app"` refers to the page's root component instance. When the owner
re-renders, its slot content re-renders with it.

```html
<div pp-component="page_1">
  <div pp-component="card_1" title="Team">
    <template pp-owner="page_1">
      <p>{memberCount} members</p>
      <button onclick="{invite()}">Invite</button>
    </template>
  </div>
  <script>
    const [memberCount, setMemberCount] = pp.state(3);
    const invite = () => setMemberCount(memberCount + 1);
  </script>
</div>
```

### Composition roots (a component whose root is another component)

The React pattern of a wrapper component returning `<Card>…</Card>` as its
root. Rendered shape, three parts:

1. A **host element** carrying the composition component's `pp-component` id
   and `style="display: contents"` (it adds nothing to layout). Attributes on
   the host become the composition component's `pp.props`.
2. The child component's boundary as the host's **only element child**.
   Attributes on it become the child's `pp.props`.
3. The composition component's own `<script>` authored as **slot content**:
   it lands inside the child wrapped in `<template pp-owner="composition_id">`.
   The runtime recovers it and evaluates it in the composition component's
   scope (a plain `<script>` in slot content is always the owner's component
   script, never rendered markup).

```html
<div pp-component="confirm_button_1" style="display: contents"
     label="Delete account">
  <button pp-component="button_1" variant="destructive" onclick="{confirm()}">
    <template pp-owner="confirm_button_1">
      <script>
        const { label = "Confirm" } = pp.props;
        const [armed, setArmed] = pp.state(false);
        const confirm = () => setArmed(!armed);
      </script>
      {armed ? "Are you sure?" : label}
    </template>
  </button>
</div>
```

**Ref forwarding**: a host carrying `pp-ref="{someRef}"` plus
`pp-ref-forward="true"` resolves the ref through the `display: contents`
chain to the first concrete component root (PulsePoint's `forwardRef`
equivalent). Each hop must present exactly one child component root.

### Fragments (multi-root components)

A component whose top level is a run of siblings is framed with a comment
pair instead of a wrapper element:

```html
<!--pp:quick_tally_1-->
<button onclick="setCount(count + 1)">Tally</button>
<p>Total: {count}</p>
<script>
  const [count, setCount] = pp.state(0);
</script>
<!--/pp-->
```

- At mount the runtime converts each pair into a live
  `<pp-fragment style="display: contents">` element carrying the id; identity,
  scope, events and re-renders anchor to it. Fragments nest (a close marker
  pairs with the nearest unclosed open).
- Comments are legal everywhere, so this shape survives `<tbody>`, `<tr>`,
  `<ul>`, `<select>` — contexts where a wrapper element would be
  foster-parented out by the HTML parser. Under table/select parents the pair
  STAYS as comments: the grouping renders but owns no identity there, so give
  a stateful fragment a context an element could also live in.
- A fragment has no root element, so it CANNOT receive props or a `pp-ref`.
  The id after `pp:` may be empty for grouping-only fragments.
- Never hand-write `<pp-fragment>`: it is runtime output, not authored input.

### Server-side deferral (recommended)

Raw `{...}` placeholders in `src`, SVG geometry, form values or table text can
be parsed/validated by the browser before the runtime mounts. To make first
paint flash-free, the server may wrap each **outermost** component root in an
inert template:

```html
<template pp-component="counter_1">
  <div pp-component="counter_1">…</div>
</template>
```

The runtime materializes `template[pp-component]` into live DOM during mount,
before scanning for components. This is optional but is what a first-class
integration does.

## Template syntax (closed list — nothing else exists)

| Syntax | Where | Purpose |
|---|---|---|
| `{expression}` | Text nodes and **quoted** attribute values | Interpolation |
| `on*` (`onclick`, `oninput`, `onchange`, `onsubmit`, any native DOM event) | Any element | Event binding |
| `pp-for="item in items"` / `"(item, index) in items"` | **`<template>` only** | Keyed list rendering |
| `key="{expr}"` | The repeated element inside a `pp-for` template | Keyed diffing identity |
| `pp-ref="name"` / `pp-ref="{expr}"` | Elements and component roots | Imperative element access |
| `hidden="{!cond}"` | Any element | Conditional rendering |
| `defaultvalue="{expr}"` (lowercase) | `<input>`, `<textarea>`, `<select>` | Seed an uncontrolled field once |
| `defaultchecked="{expr}"` (lowercase) | checkbox / radio | Seed an uncontrolled check once |
| `pp-style="{cssText}"` | Any element | Dynamic inline style as a CSS **string** |
| `pp-spread="{...obj}"` | Any element | Spread an object into attributes |
| `<token.provider value="{v}">` | Anywhere | Context provider element |
| `<template pp-owner="owner_id">` | Inside a child component's boundary | Slot content (children) — resolves in the owner's scope, rendered in place |
| `pp-ref-forward="true"` | A composition host (`display: contents` component root) | Forward a `pp-ref` through the host to the concrete root |
| `<!--pp:id-->` … `<!--/pp-->` | Around a run of sibling roots | Fragment (multi-root component) boundary markers |
| `pp-spa="false"` | An `<a>` | Opt one link out of SPA interception |
| `pp-reset-scroll="true"` | A scroll container or `<body>` | Reset scroll on navigation |
| `pp-scroll-key="name"` | A scroll container | Stable scroll restoration identity |
| `pp-loading-content="true"` | The region swapped during SPA navigation | Marks the navigation content region |
| `pp-loading-url="/route"` | A loading-state element | Route-specific loading lookup |

**There is NO** `pp-if`, `pp-show`, `pp-else`, `pp-model`, `pp-bind`,
`pp-class`, `pp-text`, `pp-html`, `pp-on` or `pp-key`. Conditionals are
`hidden="{...}"`. Two-way binding is `value="{state}"` plus an `oninput`
handler.

**Never generate JSX.** No `{cond && <div/>}`, no `{cond ? <A/> : <B/>}`, no
`{list.map(item => <li/>)}`, no `className`, no `htmlFor`, no camelCase
`onClick`, no `style={{...}}`, no JSX fragment syntax `<>…</>` (multi-root
components exist, but as `<!--pp:id-->` comment markers — see Fragments
above). Lists are
`<template pp-for>`; brace attributes are **always quoted**
(`class="{expr}"`, never `class={expr}` — the unquoted form is invalid HTML
and silently breaks the whole component). A valid PulsePoint template is still
valid HTML if you delete every `{}`.

Form controls are controlled (`value="{state}"` / `checked="{state}"`) or
uncontrolled (`defaultvalue` / `defaultchecked`) for their whole lifetime —
never both, and never switching. Bind `value` only to state with a defined
initial value.

### Event handlers

Inside an `on*` attribute the runtime injects `event`, plus aliases `e`,
`$event`, `target` (event.target), `currentTarget` and `el` (both
event.currentTarget). Standard form pattern:

```html
<form onsubmit="save(event)">…</form>
<script>
  const save = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const result = await pp.rpc("saveItem", data);
  };
</script>
```

## Component-script hooks (closed list)

`pp.state(initial)` → `[value, setValue]` (setter accepts a value or updater fn) ·
`pp.effect(cb, deps?)` (after render; may return sync cleanup) ·
`pp.layoutEffect(cb, deps?)` (before paint) ·
`pp.ref(initial?)` → `{ current }` ·
`pp.memo(factory, deps)` · `pp.callback(fn, deps)` ·
`pp.reducer(reducer, initialState)` → `[state, dispatch]` ·
`pp.context(token)` · `pp.portal(ref, target?)` (default target `document.body`) ·
`pp.id()` (stable DOM-safe id) ·
`pp.syncExternalStore(subscribe, getSnapshot)` ·
`pp.imperativeHandle(ref, createHandle, deps?)` ·
`pp.transition()` → `[isPending, startTransition]` ·
`pp.deferredValue(value, initial?)` ·
`pp.optimistic(passthrough, reducer?)` → `[optimisticState, addOptimistic]` ·
`pp.errorBoundary()` → `[error, reset]` ·
`pp.props` (props bag).

Runtime utilities: `pp.createContext(defaultValue)`, `pp.mount()`,
`pp.redirect(url)`, `pp.rpc(name, data?, options?)`,
`pp.socket(name, args?, handlers?)`, `pp.enablePerf()`, `pp.disablePerf()`,
`pp.getPerfStats()`, `pp.resetPerfStats()`.

There is no `forwardRef` function (ref forwarding exists as the
`pp-ref-forward="true"` attribute on a composition host — see Composition
roots above), no `Suspense`, `lazy`, `useInsertionEffect`, `useActionState`
or `memo()` wrapper. Do not generate them.

## The backend wire contract

This is what YOUR server must implement. Each piece is optional — a read-only
page needs none of it — but this is the complete contract.

### 1. RPC (`pp.rpc`)

`pp.rpc("functionName", data)` sends:

- **Method/URL**: `POST` to the **current route URL** (override with
  `options.url`).
- **Headers**:
  - `X-PP-RPC: true` — identifies a PulsePoint RPC request (route on this).
  - `X-PulsePoint-Wire: true`
  - `X-PP-Function: functionName` — the server-side function to invoke.
  - `X-CSRF-Token: <token>` — see CSRF below.
  - `X-Requested-With: XMLHttpRequest`
  - `Accept: application/json, text/event-stream`
- **Body**: `application/json` (the `data` object), OR `multipart/form-data`
  when any value is a `File`/`FileList` (files under their keys, other values
  as string fields; the client also sends per-file progress if the caller asks).

The server should:

1. Detect `X-PP-RPC: true` + `POST` before normal route handling.
2. Read `X-PP-Function`, look up the named function **registered for that
   route** (never `eval` arbitrary names — keep an explicit allow-list).
3. Filter the payload against the function's declared parameters (a key the
   function does not declare is dropped — this keeps parameters client-settable
   only when declared).
4. Return `application/json` with the function's return value.

**Streaming**: to stream, respond with `Content-Type: text/event-stream` and
send SSE frames; the client consumes chunks through `options.onStream(chunk)`,
then `onStreamComplete()`. Use this for LLM output and progress feeds.

**Redirects**: respond with header `X-PP-Redirect: /target` (or a `Location`
header). The client navigates (SPA-aware). Cross-origin targets are ignored.

**Errors**: non-2xx responses reject the `pp.rpc` promise; include a JSON body
`{"error": "message"}` for a useful message.

### 2. CSRF

The client reads the token from the `pp_csrf` cookie (on localhost it prefers a
port-scoped `pp_csrf_<port>` cookie so parallel dev servers don't clash). If
the cookie is missing it performs one GET to the route (or `options.csrfUrl`)
expecting the server to set it. Server duties:

- Set a `pp_csrf` cookie (random value) on page responses.
- Verify `X-CSRF-Token` equals the cookie value on every RPC POST.
- If you don't want CSRF yet, still set the cookie to any value and skip
  verification — the client requires the cookie to exist.

### 3. Named sockets (`pp.socket`) — optional

`pp.socket("chatRoom", args, handlers)` opens a WebSocket to:

```
ws(s)://<origin>/__pulsepoint/ws?name=chatRoom
```

Contract:

- Single endpoint `/__pulsepoint/ws` for all named sockets; the function name
  travels in the `name` query parameter.
- The **first frame** the client sends is one JSON object — the arguments
  (same payload shape an RPC would post). Filter it against the handler's
  declared parameters.
- Every subsequent frame in either direction is one JSON value.
- To signal failure, send one frame `{"error": "message"}` (that key alone)
  and close; the client routes it to `onError` — never to `onMessage`.
- Non-JSON text frames are handed to `onMessage` as plain strings rather than
  dropped.
- Production servers must check the `Origin` header against an allow-list, cap
  connections, and bound message size/rate.

Client API: `handlers` accepts `onOpen()`, `onMessage(value)`,
`onError(error)`, `onClose({ code, reason, wasClean })`, and an optional `url`
endpoint override. The returned handle exposes `send(value)` (buffers frames
sent before the connection opens; returns `false` once closing/closed),
`close(code?, reason?)`, and `readyState`. Component pattern: open the socket
in `pp.effect(..., [])`, keep the handle in `pp.ref(...)`, close it in the
effect cleanup. Use sockets only for genuinely bidirectional channels —
ordinary reads/writes stay on `pp.rpc`, one-way server push stays on RPC
streaming.

### 4. SPA navigation — optional

`pp.mount()` intercepts same-origin `<a>` clicks and fetches the next page over
`fetch`, swapping the region marked `pp-loading-content="true"` and managing
scroll/history. Server duties for full SPA support:

- Serve full HTML documents for every route (the client extracts what it
  needs).
- Optionally send an `X-PP-Root-Layout: <id>` response header (also emitted as
  `meta[name="pp-root-layout"]`) so the client can detect layout changes and
  fall back to a full load.
- No server work is required to *disable* it: per-link `pp-spa="false"` opts
  out, and normal full-page apps work fine.

## Backend implementation checklist

To integrate PulsePoint v2 into backend/framework X:

1. **Serve and start the runtime**: copy `pp-reactive-v2.min.js` to your static
   assets, then import `ComponentInit` from it in a module script and call
   `PP.bootstrap()` exactly once.
2. **Render deferred components**: in your template engine, wrap every
   interactive region in a `<template pp-component="unique_id">` boundary.
   Put exactly one root element and the component's `<script>` inside it. Your template engine's own
   interpolation must NOT collide with PulsePoint's braces — if it uses `{}`
   too (e.g. some formats), emit literal braces for PulsePoint or HTML-encode
   server data braces as `&#123;`/`&#125;`.
3. **Escape user data**: server-interpolated user content must be HTML-escaped
   AND must not leak live `{`/`}` into the DOM (encode them), or stored input
   like `{fetch(...)}` would execute as a template expression. This is the one
   security rule specific to PulsePoint.
4. **Set the CSRF cookie** on page responses.
5. **Handle RPC POSTs**: one middleware that catches `X-PP-RPC: true`,
   dispatches on `X-PP-Function` against an explicit per-route function
   registry, filters payload keys against the function signature, returns JSON.
6. **Optional**: SSE streaming for generator-style functions; a
   `/__pulsepoint/ws` WebSocket endpoint for named sockets; `X-PP-Redirect`
   for server-driven navigation.

## Minimal reference implementation (pseudo-code)

```
# Page render
GET /todos:
    set_cookie("pp_csrf", random_token, http_only=False)   # client JS must read it
    html = render("todos.html", todos=db.todos.all())      # contains pp-component regions
    return html

# RPC endpoint (same route, POST)
POST /todos with header X-PP-RPC == "true":
    assert header("X-CSRF-Token") == cookie("pp_csrf")
    fn_name = header("X-PP-Function")                      # e.g. "addTodo"
    fn = ROUTE_FUNCTIONS["/todos"].get(fn_name) or 404
    payload = json_body_filtered_to(fn.parameters)
    result = fn(**payload)
    return json(result)
```

And the template (`todos.html`):

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

## Performance notes AI should respect

- `pp.state` is for values whose change must produce a render. Timers, request
  generations, cursors and transient text belong in `pp.ref` (no render).
- Keyed `pp-for` rows are reconciled per row: a row whose markup is unchanged
  is reused, not re-parsed. Keep per-row work cheap and keys stable.
- A mounted nested component is reconciled by its **attributes**, not by
  re-parsing its markup — pass changing data as props instead of re-rendering
  parents wholesale.
- Discard stale RPC responses in search/filter flows (`abortPrevious: true` or
  a generation counter in a ref).
- Never "optimize" by replacing PulsePoint bindings with manual
  `querySelector`/`innerHTML` wiring — that defeats reconciliation and scope
  tracking.

## Debugging

- The runtime logs `[PP-ERROR]`/`[PP-WARN]` prefixed messages to the console.
- A blank component with no console error usually means invalid HTML in the
  template — most often an **unquoted** brace attribute.
- `pp.enablePerf()` / `pp.getPerfStats()` expose render timings.
