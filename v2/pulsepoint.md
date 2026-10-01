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

Call exactly ONE of these per page:

- `PP.bootstrap()`: materializes deferred boundaries and mounts components. Use it for
  plain multi-page apps.
- `pp.mount()`: hides the body while it hydrates, runs `bootstrap()` itself, reveals the
  page on the next frame, then enables SPA navigation. It is idempotent. Never call it
  together with `PP.bootstrap()`.

```html
<script type="module">
  import "/js/pp-reactive-v2.min.js"; // registers the global `pp`
  pp.mount();
</script>
```

The bundle exports only `ComponentInit` and `PPUtilities`; everything else is reached
through `pp`.

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
  scheme works: `counter_1`, `page_products`, a hash…). Exception: sibling
  instances of the same component type under one parent may share an id. The
  runtime derives a distinct instance id for each later sibling.
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
- Root attributes are props, so a `{…}` binding on a component's OWN root is
  evaluated in the PARENT's scope and cannot read the component's state.
  Put such bindings on an inner element.

### Root event ownership (`pp-event-owner`)

Native `on*` handlers that a component authored on its own root are the
exception to the rule above. The server stamps `pp-event-owner="<own id>"` on
that root, and the runtime runs those handlers in the component's own scope:

```html
<form pp-component="signup_1" pp-event-owner="signup_1" onsubmit="handleSubmit(event)">
  <input name="email" />
  <button>Sign up</button>
  <script>
    const handleSubmit = (event) => {
      event.preventDefault();
      pp.rpc("signup", Object.fromEntries(new FormData(event.currentTarget)));
    };
  </script>
</form>
```

- Without `pp-event-owner`, an `on*` handler on a nested root runs in the
  parent's scope. This is how a parent passes `onclick` to a child.
- A component compiler that forwards call-site attributes onto a component root
  must stamp `pp-event-owner` only when the component's own file wrote the
  handler. Page and layout roots follow the same rule.
- Siblings that share an id each resolve `pp-event-owner` to their own
  instance.
- Similarly, a call-site `pp-ref` placed on a child's root gets
  `pp-ref-owner="<parent id>"`, so the ref is captured in the parent's refs.

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

During materialization, `src`, `srcset`, `sizes`, `imagesrcset`, `imagesizes`
and `poster` values that still contain `{…}` are parked under a `pp-inert-`
prefix until the first render writes the evaluated value. The browser never
fetches a placeholder URL. This only happens inside a deferred boundary, so
images with bound URLs need one. Never hand-write `pp-inert-*`.

## Template syntax (closed list — nothing else exists)

| Syntax | Where | Purpose |
|---|---|---|
| `{expression}` | Text nodes and **quoted** attribute values | Interpolation |
| `on*` (`onclick`, `oninput`, `onchange`, `onsubmit`, any native DOM event) | Any element | Event binding |
| `pp-for="item in items"` / `"(item, index) in items"` | **`<template>` only** | Keyed list rendering |
| `key="{expr}"` | The repeated element inside a `pp-for` template | Keyed diffing identity |
| `pp-ref="name"` / `pp-ref="{expr}"` | Elements and component roots | Imperative element access |
| `pp-ref-owner="owner_id"` | Child component root carrying a call-site `pp-ref` (server-stamped) | Capture the ref in the parent's refs |
| `pp-event-owner="own_id"` | Component/page/layout root (server-stamped) | Run the root's own `on*` handlers in the component's scope |
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
| `pp-loading-url="/route"` | A loading-state `div` inside `#loading-file-1B87E` | Route-specific loading lookup (longest prefix, then `/`) |
| `pp-loading-transition='{"fadeIn":"200ms","fadeOut":"150ms"}'` | A child of a loading-state element | Fade timing for that loading state (JSON) |
| `data-pp-meta` | `<head>` elements | Server-managed head tags replaced on SPA navigation |

`pp-for` works inside `<svg>` too, and keyed rows may contain nested
components.

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

`pp.state(initial | () => initial)` → `[value, setValue]` (setter accepts a value or updater fn; a function initial is a lazy initializer) ·
`pp.effect(cb, deps?)` (after render; may return sync cleanup) ·
`pp.layoutEffect(cb, deps?)` (before paint) ·
`pp.ref(initial?)` → `{ current }` ·
`pp.memo(factory, deps)` · `pp.callback(fn, deps)` ·
`pp.reducer(reducer, initialArg, init?)` → `[state, dispatch]` ·
`pp.context(token)` · `pp.portal(ref, target?)` (default target `document.body`) ·
`pp.id()` (stable DOM-safe id) ·
`pp.syncExternalStore(subscribe, getSnapshot)` ·
`pp.imperativeHandle(ref | callbackRef, createHandle, deps?)` ·
`pp.transition()` → `[isPending, startTransition]` (scope may be `async`;
`isPending` stays true until it settles; renders are synchronous, there is no
concurrent scheduler) ·
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
header on a 3xx). The client navigates (SPA-aware) and the call resolves to
`{ redirected: true, to }`. Cross-origin targets are ignored.

**Errors**: non-2xx responses reject the `pp.rpc` promise with an `RpcError`.
Send a JSON body:

```json
{"error": "Validation failed", "errors": {"email": ["Already taken"]}, "requestId": "req_8f2c"}
```

`RpcError` fields:

- `message`: the `error` text. A 401 becomes "Authentication required" and a
  403 becomes "Permission denied".
- `status`: the HTTP status.
- `errors`: the field-message map, or `{}`.
- `requestId`: a string, or `null`.
- `body`: the parsed JSON, or `null`.

The class is not exported, so test `err.name === "RpcError"`, never
`instanceof`:

```js
try {
  await pp.rpc("saveProfile", data);
} catch (err) {
  if (err.name === "RpcError" && err.status === 422) setFieldErrors(err.errors);
  else throw err;
}
```

**Client options** (third argument: `true` is shorthand for
`{ abortPrevious: true }`):

- `abortPrevious`: cancels the previous in-flight call, including its stream.
  The cancelled call resolves to `{ cancelled: true }`, not a rejection.
- `url`: the endpoint. Defaults to the current route.
- `csrfUrl`: where to GET the CSRF cookie when it is missing.
- `credentials`: defaults to `same-origin`, or `include` for a cross-origin
  `url`. `omit` also skips the CSRF fetch.
- `onStream(chunk)`, `onStreamComplete()`, `onStreamError(error)`: when
  `onStreamError` is set, failures go to it and the promise resolves instead
  of rejecting.
- `onUploadProgress({ loaded, total, percent })` and `onUploadComplete()`: for
  file payloads.

**Multipart ordering**: all non-file values are written before the first file,
so a server that streams the upload can read the arguments before the file
body. Key order is kept within each group, and a `FileList` is appended under
one name.

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
- **Heartbeat (REQUIRED server behavior)**: the client sends `{"__pp": "ping"}`
  every `heartbeatInterval` ms (default 25000). The server MUST answer
  `{"__pp": "pong"}`. If no frame arrives within `heartbeatTimeout` (default
  20000) of a ping, the client treats the connection as dead and reconnects.
  Control frames (objects whose only key is `__pp`) are never delivered to
  `onMessage`, and a server must not deliver them to the handler either.
- **Reconnect**: after an unexpected close the client reopens with exponential
  backoff and jitter, then re-sends the arguments frame. The server function
  therefore runs again from the top for each new connection. The client does
  NOT reconnect after `handle.close()`, after an `{"error": …}` frame, after a
  `1000` close (the function returned), or after a policy close (`1003`,
  `1007`, `1008`, `1009`, `1010`). Close with `1000` when the conversation is
  done, and send an error frame for failures that a retry would repeat. Missed
  frames are not replayed.
- Production servers must check the `Origin` header against an allow-list, cap
  connections, and bound message size/rate.

**Client API**: the third argument accepts these handlers and options:

- `onOpen({ reconnected })`: every successful open.
- `onMessage(value)`: each data frame.
- `onError(error)`: handshake refusals and error frames.
- `onClose({ code, reason, wasClean, willReconnect })`: every closed
  connection, including one about to be replaced.
- `onReconnecting({ attempt, delay })`: a reconnect is scheduled.
- `reconnect`: default `true`.
- `reconnectDelay` / `reconnectDelayMax`: defaults `1000` / `30000` ms.
- `maxReconnectAttempts`: default `Infinity`.
- `heartbeatInterval`: `0` disables the heartbeat.
- `heartbeatTimeout`.
- `url`: endpoint override.

The `online` event, or a hidden tab becoming visible, skips the backoff wait.

The returned handle exposes:

- `send(value)`: buffers while connecting or reconnecting, up to 256 frames.
  Returns `false` once closed for good or when the buffer is full.
- `close(code?, reason?)`: closes for good, with no reconnect.
- `readyState`: `CONNECTING` while waiting to reconnect.

**Component pattern**: open the socket in `pp.effect(..., [])`, keep the
handle in `pp.ref(...)`, and close it in the effect cleanup. Re-fetch state in
`onOpen` when `reconnected` is true. Use sockets only for genuinely
bidirectional channels: ordinary reads and writes stay on `pp.rpc`, and
one-way server push stays on RPC streaming.

```html
<script>
  const [messages, setMessages] = pp.state([]);
  const socketRef = pp.ref(null);

  pp.effect(() => {
    const socket = pp.socket("chatRoom", { room: "general" }, {
      onMessage: (msg) => setMessages((prev) => [...prev, msg]),
      onOpen: ({ reconnected }) => reconnected && pp.rpc("history").then(setMessages),
    });
    socketRef.current = socket;
    return () => socket.close();
  }, []);

  const send = (text) => socketRef.current?.send({ text });
</script>
```

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
- SPA navigation is on only after `pp.mount()`. `PP.bootstrap()` alone never
  intercepts links.
- Navigation requests are `GET`s carrying `X-PP-Navigation: true`,
  `X-PulsePoint-Wire: true`, `X-Requested-With: XMLHttpRequest` and
  `Accept: text/html`. They time out after 15 s. On a timeout, a non-2xx
  status, a cross-origin redirect or any other error, the client falls back to
  a full page load. Followed redirects and `X-PP-Redirect` are honoured.
- Mark per-page `<head>` tags (description, canonical, robots, Open Graph,
  Twitter) with `data-pp-meta`. On navigation they are replaced with the new
  page's set, `<title>` is updated, and the rest of `<head>` is untouched. New
  `<body>` attributes are copied (except `style`).
- The client dispatches `pp:navigation:start`, `pp:navigation:complete` and
  `pp:navigation:error` on `document`, with `detail = { url }` (plus `error`).
- `pp.redirect(url)` navigates through SPA when it is enabled. Otherwise, or
  for a cross-origin URL, it sets `location`.

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
6. **Return structured errors**: a non-2xx status with
   `{"error", "errors"?, "requestId"?}`.
7. **If you compile components** (forwarding call-site attributes onto a root):
   stamp `pp-event-owner="<own id>"` on roots whose own file wrote `on*`
   handlers, and `pp-ref-owner="<parent id>"` beside a call-site `pp-ref`.
   Reject `{…}` bindings a component writes on its own root, because they
   would be evaluated in the parent's scope.
8. **Optional**: SSE streaming for generator-style functions; a
   `/__pulsepoint/ws` WebSocket endpoint for named sockets (it must answer
   `{"__pp":"ping"}` with `{"__pp":"pong"}`); `X-PP-Redirect` for
   server-driven navigation; `data-pp-meta` on per-page head tags.

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
- A handler on a component root that "can't see" the component's own
  variables means the root lacks `pp-event-owner`, so it ran in the parent's
  scope.
- `pp.enablePerf()` / `pp.getPerfStats()` expose per-component render counts
  and per-phase timings; `pp.resetPerfStats()` clears them. To profile the
  initial mount, set `localStorage["pp-perf"] = "1"` and reload.
- Log `err.status`, `err.errors` and `err.requestId` from a failed `pp.rpc`.

## TypeScript

Declarations ship in `types/`. `pp-global.d.ts` types the global `pp` at page
level (utilities only). In a component script, type `pp` as
`ComponentRuntime<Props>` from `types/ComponentRuntime.d.ts`, which adds the
hooks and `props`. See `types/README.md`.
