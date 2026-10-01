# PulsePoint v2

> **You are reading the documentation for PulsePoint v2 (current).**
> [← Back to the project overview](../README.md) · [Switch to v1 →](../v1/README.md)

The backend-agnostic reactive engine. Keep your HTML, add fine-grained reactivity with a
tiny runtime — now with a full component model, a React-style hooks surface, and a
documented server wire contract.

- **Runtime file:** [`pp-reactive-v2.min.js`](./pp-reactive-v2.min.js)
- **Type definitions:** [`types/`](./types) — see [`types/README.md`](./types/README.md) for entry points and usage
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
- **Native web APIs, no wrappers** – Component scripts are plain browser JavaScript, so WebGPU, Web Workers, WebAssembly, Web Audio, WebRTC and every other web API work directly, the day browsers ship them. See [Native JavaScript & Web APIs](#native-javascript--web-apis).
- **Strongly typed** – The runtime is authored in TypeScript; `.d.ts` files ship in [`types/`](./types).
- **Drop-in ready** – Keep your existing routing, auth, and ORM. Add PulsePoint only where you need interactivity.

---

## Getting Started

PulsePoint v2 ships as a single ES module. Import `ComponentInit` from it and call
`bootstrap()` **exactly once** — that import is also what exposes the global `pp` object
your component scripts use.

Copy [`pp-reactive-v2.min.js`](./pp-reactive-v2.min.js) into your static assets directory
(self-hosting is recommended for production), then:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PulsePoint App</title>

    <script type="module">
      import { ComponentInit as PP } from "/js/pp-reactive-v2.min.js";

      PP.bootstrap();
    </script>
  </head>

  <body>
    <template pp-component="hello_1">
      <div pp-component="hello_1">
        <h1>Hello {name}</h1>
        <input value="{name}" oninput="setName(event.target.value)" />

        <script>
          const [name, setName] = pp.state("World");
        </script>
      </div>
    </template>
  </body>
</html>
```

The runtime has zero dependencies. Place the module script in `<head>` or at the end of
`<body>` — module scripts are deferred, so your component templates already exist when
`PP.bootstrap()` runs.

To try it without downloading anything, point the import at the CDN instead:

```html
<script type="module">
  import { ComponentInit as PP } from "https://cdn.tsnc.tech/pp-reactive-v2.min.js";

  PP.bootstrap();
</script>
```

### `PP.bootstrap()` or `pp.mount()`

Call **one** of them, once per page:

| Call | What it does | Use it when |
|---|---|---|
| `PP.bootstrap()` | Materializes deferred boundaries and mounts every component | A plain multi-page app; every link is a full page load |
| `pp.mount()` | Hides the body while it hydrates (`opacity: 0`, `inert`, `aria-busy`), runs `bootstrap()`, reveals the page on the next frame, then turns on [SPA navigation](#spa-navigation) | You want same-origin links to navigate without a full reload |

`pp.mount()` runs `bootstrap()` itself and is idempotent, so don't call both:

```html
<script type="module">
  import "/js/pp-reactive-v2.min.js"; // registers the global `pp`

  pp.mount();
</script>
```

### Wrap reactive regions in a `<template pp-component>` boundary

Put each hand-authored reactive region inside a `<template pp-component="id">` whose
single root element carries the same id. The content stays inert until `PP.bootstrap()`
materializes it, which prevents raw `{...}` bindings from flashing and stops component
scripts from running before PulsePoint starts. See
[Deferred component boundaries](#deferred-component-boundaries) for why this matters.

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

The snippets in this README show component roots on their own for readability. When you
hand-author a page, wrap each **outermost** root in its
[`<template pp-component>` boundary](#deferred-component-boundaries).

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
it must be unique per page. A server that names boundaries per component **type**
rather than per instance may give sibling instances under one parent the same id; the
runtime derives a distinct instance id for each later sibling, so each keeps its own
state and children.

Nested components are just nested `pp-component` elements;
attributes on a nested root become `pp.props` in its script (kebab-case arrives
camelCased: `on-select` → `pp.props.onSelect`). A brace attribute (`items="{visible}"`)
is evaluated in the parent's scope and keeps its real type; a literal server-rendered
value arrives as a string.

#### Handlers a component writes on its own root

Because root attributes are props, a `{…}` binding on a component's root is evaluated in
the **parent's** scope and cannot read the component's own state. Put such bindings on an
element inside the root.

Native `on*` handlers the component itself authored on its root are the exception. The
server marks them by stamping `pp-event-owner` with the component's own id, and the
runtime then runs them in the component's scope, as React does:

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

Without `pp-event-owner`, a handler on a nested root resolves in the parent's scope
(that is how a parent passes `onclick="…"` to a child). For components with the same id
that are siblings, each instance resolves `pp-event-owner` to itself.

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
re-renders, its slot content re-renders with it. Slot content can be passed on unchanged
through an intermediate component and still belongs to the component that wrote it.

When a parent puts a `pp-ref` on a child component's root, the server adds
`pp-ref-owner="<parent id>"` beside it. The ref is then captured into the parent's refs
and not the child's.

### State & Effects

- `pp.state(initialValue)` → `[value, setValue]` (the setter accepts a value or an updater function; pass a function as `initialValue` to compute it lazily on first render only).
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
| `pp-ref-owner="owner_id"` | A child component root carrying a call-site `pp-ref` (server-stamped) | Capture the ref in the parent's refs |
| `pp-event-owner="own_id"` | A component root (server-stamped) | Run the root's own `on*` handlers in the component's scope |
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
| `pp-loading-transition='{"fadeIn":"200ms","fadeOut":"150ms"}'` | Inside a loading-state element | Fade durations for that loading state (JSON) |
| `data-pp-meta` | `<meta>` / `<link>` in `<head>` | Server-managed head tags replaced on SPA navigation |

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

`pp-for` also works inside `<svg>` (e.g. a `<template pp-for>` of `<circle>` or `<path>`
elements), and keyed rows may themselves contain nested components.

### URL attributes in deferred templates

When a `<template pp-component>` boundary is materialized, the runtime parks `src`,
`srcset`, `sizes`, `imagesrcset`, `imagesizes` and `poster` values that still contain
`{…}` under a `pp-inert-` prefix until the first render writes the evaluated value. The
browser therefore never requests a placeholder URL such as `/img/{user.id}.png`, and
logs no "Dropped srcset candidate" warnings. This needs no setup, but it only works for
markup inside a deferred boundary.

---

## Hooks Reference

All hooks live on the global `pp` object and are called from a component `<script>`:

| Hook | Returns | Purpose |
|---|---|---|
| `pp.state(initial \| () => initial)` | `[value, setValue]` | Reactive state (function = lazy initializer) |
| `pp.effect(cb, deps?)` | – | Side effect after render (optional cleanup) |
| `pp.layoutEffect(cb, deps?)` | – | Side effect before paint |
| `pp.ref(initial?)` | `{ current }` | Mutable, non-rendering value or DOM handle |
| `pp.memo(factory, deps)` | value | Memoized computation |
| `pp.callback(fn, deps)` | fn | Stable function identity |
| `pp.reducer(reducer, initialArg, init?)` | `[state, dispatch]` | Reducer state (`init(initialArg)` computes the initial state lazily) |
| `pp.context(token)` | value | Read a context value |
| `pp.portal(ref, target?)` | – | Render outside the tree (default target `document.body`) |
| `pp.id()` | string | Stable DOM-safe unique id |
| `pp.syncExternalStore(subscribe, getSnapshot)` | value | Subscribe to an external store |
| `pp.imperativeHandle(ref, createHandle, deps?)` | – | Expose an imperative API through a ref object or a callback ref |
| `pp.transition()` | `[isPending, startTransition]` | Pending flag for in-flight work; `startTransition` accepts a sync or `async` scope and keeps `isPending` true until it settles (renders stay synchronous — there is no concurrent scheduler) |
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

## Native JavaScript & Web APIs

A component's `<script>` is ordinary JavaScript running in the page. It is not a sandbox
and not a compile target. The runtime evaluates it in strict mode, as a function body
that takes `pp`, in the page's own global scope. So everything the browser can do is
available to it directly: WebGPU, Web Workers, WebAssembly, Web Audio, WebRTC and more.

- **No wrapper layer.** `window`, `document` and `navigator` are the same objects any
  script on the page sees. PulsePoint has no wrapper for any web API, and needs none.
- **New APIs work the day browsers ship them.** PulsePoint never stands between your code
  and the API, so it has nothing to add before you can call one.
- **What you write is what runs.** No build step transforms the script, so DevTools
  debugs it directly, breakpoints included.
- **Markup stays plain HTML.** A `<canvas>`, `<video>` or `<audio>` is written as itself
  and reached through `pp-ref`.

### Who does what

PulsePoint handles the data flow and the DOM, and the browser API does the heavy work.
The two meet in a ref and an effect:

| Job | Use | Why |
|---|---|---|
| Data from the server | `pp.rpc`, `pp.socket`, RPC streaming | Fetch, stream or push the values the API works on |
| Values the markup shows | `pp.state` | Counts, labels, status. A change re-renders only the nodes that differ |
| Handles to browser objects | `pp.ref` | GPU devices, contexts, workers, audio graphs, streams. Changing a ref never re-renders |
| Acquire, feed and release | `pp.effect` | Create the object on mount, push new state into it, dispose of it in the cleanup |
| The heavy work | The browser API | Shaders, threads, audio, codecs and hardware run at native speed. PulsePoint is not in that path |

### WebGPU fed by `pp.rpc`

The complete component below draws a bar chart with a WebGPU fragment shader:

- Each click asks the server for a new series. The result lands in state, an effect
  writes it to a GPU storage buffer, and the GPU redraws every bar.
- The only markup that re-renders is the labels.
- In a browser without WebGPU, the same effect draws with Canvas 2D instead.

```html
<template pp-component="gpu_chart">
  <div pp-component="gpu_chart">
    <p>Renderer: {backendLabel} · {series.length} values from the server</p>
    <canvas pp-ref="{canvas}" style="display: block; width: 100%; height: 14rem"></canvas>

    <input type="range" min="8" max="128" step="8"
           value="{points}" oninput="setPoints(Number(event.target.value))" />
    <button onclick="load()" disabled="{loading}">
      {loading ? "Loading..." : "Fetch new data"}
    </button>
    <p hidden="{!error}">{error}</p>

    <script>
      const MAX_POINTS = 128;

      const canvas = pp.ref(null);
      const gpu = pp.ref(null);                 // device, buffers: a ref, never state
      const [backend, setBackend] = pp.state("starting");
      const [series, setSeries] = pp.state([]);
      const [points, setPoints] = pp.state(48);
      const [loading, setLoading] = pp.state(false);
      const [error, setError] = pp.state("");

      const backendLabel =
        backend === "webgpu" ? "WebGPU"
        : backend === "canvas2d" ? "Canvas 2D (no WebGPU in this browser)"
        : "Starting...";

      const SHADER = `
        struct Params { count: f32, maxValue: f32, pad0: f32, pad1: f32 };
        @group(0) @binding(0) var<uniform> params: Params;
        @group(0) @binding(1) var<storage, read> values: array<f32>;

        struct VertexOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };

        @vertex fn vs(@builtin(vertex_index) i: u32) -> VertexOut {
          var corners = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
          var out: VertexOut;
          out.pos = vec4f(corners[i], 0.0, 1.0);
          out.uv = (corners[i] + vec2f(1.0)) * 0.5;
          return out;
        }

        @fragment fn fs(input: VertexOut) -> @location(0) vec4f {
          let index = min(u32(input.uv.x * params.count), u32(params.count) - 1u);
          let height = values[index] / params.maxValue;
          let cell = fract(input.uv.x * params.count);
          if (input.uv.y > height || cell < 0.12 || cell > 0.88) { return vec4f(0.0); }
          let t = input.uv.y / max(height, 0.001);
          return vec4f(mix(vec3f(0.11, 0.45, 0.85), vec3f(0.30, 0.85, 0.75), t), 1.0);
        }
      `;

      function sizeCanvas(el) {
        const ratio = window.devicePixelRatio || 1;
        el.width = Math.max(1, Math.round(el.clientWidth * ratio));
        el.height = Math.max(1, Math.round(el.clientHeight * ratio));
      }

      async function initGpu(el) {
        if (!navigator.gpu) return null;
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) return null;
        const device = await adapter.requestDevice();
        const context = el.getContext("webgpu");
        const format = navigator.gpu.getPreferredCanvasFormat();
        context.configure({ device, format, alphaMode: "premultiplied" });

        const module = device.createShaderModule({ code: SHADER });
        const pipeline = device.createRenderPipeline({
          layout: "auto",
          vertex: { module, entryPoint: "vs" },
          fragment: { module, entryPoint: "fs", targets: [{ format }] },
          primitive: { topology: "triangle-list" },
        });
        const params = device.createBuffer({
          size: 16,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        const values = device.createBuffer({
          size: MAX_POINTS * 4,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        const bindGroup = device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: params } },
            { binding: 1, resource: { buffer: values } },
          ],
        });
        return { device, context, pipeline, params, values, bindGroup };
      }

      function drawGpu(g, data) {
        const padded = new Float32Array(MAX_POINTS);
        padded.set(data.slice(0, MAX_POINTS));
        g.device.queue.writeBuffer(g.values, 0, padded);
        g.device.queue.writeBuffer(g.params, 0,
          new Float32Array([data.length, Math.max(1, ...data), 0, 0]));

        const encoder = g.device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
          colorAttachments: [{
            view: g.context.getCurrentTexture().createView(),
            loadOp: "clear",
            clearValue: { r: 0, g: 0, b: 0, a: 0 },
            storeOp: "store",
          }],
        });
        pass.setPipeline(g.pipeline);
        pass.setBindGroup(0, g.bindGroup);
        pass.draw(3);
        pass.end();
        g.device.queue.submit([encoder.finish()]);
      }

      function draw2d(el, data) {             // fallback without WebGPU
        const ctx = el.getContext("2d");
        ctx.clearRect(0, 0, el.width, el.height);
        const max = Math.max(1, ...data);
        const slot = el.width / data.length;
        data.forEach((value, i) => {
          const h = (value / max) * el.height;
          ctx.fillStyle = "rgb(28, 115, 217)";
          ctx.fillRect(i * slot + slot * 0.12, el.height - h, slot * 0.76, h);
        });
      }

      // 1. Acquire the GPU once, release it on unmount.
      pp.effect(() => {
        let cancelled = false;
        sizeCanvas(canvas.current);
        initGpu(canvas.current)
          .then((g) => {
            if (cancelled) return g?.device.destroy();
            gpu.current = g;
            setBackend(g ? "webgpu" : "canvas2d");
          })
          .catch(() => !cancelled && setBackend("canvas2d"));
        load();
        return () => {
          cancelled = true;
          gpu.current?.device.destroy();
          gpu.current = null;
        };
      }, []);

      // 2. Every new series: upload to the GPU buffer and draw.
      pp.effect(() => {
        if (backend === "starting" || series.length === 0) return;
        if (gpu.current) drawGpu(gpu.current, series);
        else draw2d(canvas.current, series);
      }, [series, backend]);

      // 3. The server decides what to draw.
      async function load() {
        setLoading(true);
        setError("");
        try {
          const { values } = await pp.rpc("gpu_series", { points });
          setSeries(values);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    </script>
  </div>
</template>
```

The server side is one RPC function, `gpu_series(points)`, that returns
`{"values": [55.2, 71.8, …]}`. You can also render the first series straight into
`pp.state(...)` and skip the initial fetch.

### Rules

1. **Browser objects go in `pp.ref`, not `pp.state`.** This covers GPU devices,
   contexts, workers, audio contexts, streams and observers. State is for values the
   markup shows. Storing a device there re-renders for no visible change.
2. **Acquire in `pp.effect(..., [])` and release in its cleanup.** Cleanups are
   synchronous, so start async setup inside the effect and guard it with a `cancelled`
   flag, as above.
3. **Push data into the API from a second effect** whose dependencies are the state it
   reads. That is the reactive bridge: server data lands in state, and the effect
   forwards it to the GPU, worker or audio graph.
4. **Run per-frame work on `requestAnimationFrame`, with values in refs.** Calling a
   state setter every frame re-renders the component 60 times a second. Set state only
   when something on screen should change.
5. **Feature-detect** (`if (!navigator.gpu) …`) and provide a fallback. WebGPU and most
   device APIs require a secure context: HTTPS, or `localhost` in development.
6. **No static `import`/`export` and no top-level `await`** in a component script,
   because it runs as a function body. Use `import()` inside an effect or an async
   function, or load the library with its own `<script type="module">`.

### Animation loops

A continuous animation belongs to the browser's frame loop, not PulsePoint's render
cycle. State only starts and stops it:

```js
const frame = pp.ref(0);
const [running, setRunning] = pp.state(true);

pp.effect(() => {
  if (!running) return;
  let id = requestAnimationFrame(function tick(t) {
    frame.current += 1;              // a ref: no re-render per frame
    renderFrame(gpu.current, t);     // the GPU does the per-frame work
    id = requestAnimationFrame(tick);
  });
  return () => cancelAnimationFrame(id);
}, [running]);
```

### Workers: server → thread → DOM

```js
const worker = pp.ref(null);
const [result, setResult] = pp.state(null);

pp.effect(() => {
  const w = new Worker("/js/parse-worker.js", { type: "module" });
  w.onmessage = (event) => setResult(event.data);   // worker -> state -> DOM
  worker.current = w;
  return () => w.terminate();
}, []);

async function analyze() {
  const file = await pp.rpc("exportCsv");            // server -> worker
  worker.current.postMessage(file);
}
```

### Third-party libraries

Any library that runs in a browser runs in a component. Load it with `import()` inside
an effect, give it the element from a ref, and destroy it in the cleanup:

```js
pp.effect(() => {
  let cancelled = false;
  let chart = null;
  import("https://esm.sh/some-chart-library").then(({ Chart }) => {
    if (cancelled) return;
    chart = new Chart(host.current, { data: points });
  });
  return () => {
    cancelled = true;
    chart?.destroy();
  };
}, []);
```

### Other APIs, same pattern

| API | Typical use | Release in the effect cleanup |
|---|---|---|
| WebGPU | GPU rendering and compute: charts, simulations, ML inference | `device.destroy()` |
| Canvas 2D / WebGL | Drawing, charts, image processing | None for 2D; `WEBGL_lose_context` for WebGL |
| Web Workers / OffscreenCanvas | Parsing, number crunching or rendering off the main thread | `worker.terminate()` |
| WebAssembly | Native-speed modules compiled from Rust, C or Go | The module's own API |
| Web Audio | Synthesis, effects, visualizers | `audioContext.close()` |
| Media capture / WebRTC | Camera, microphone, screen share, calls | `track.stop()`, `peerConnection.close()` |
| IndexedDB / Cache Storage | Offline data and assets | `db.close()` |
| Intersection / Resize / Mutation observers | Lazy loading, measuring, reacting to layout | `observer.disconnect()` |
| Web Serial / WebUSB / WebHID / Web Bluetooth | Talking to hardware from the page | `port.close()`, `device.close()` |
| Clipboard, Notifications, File System Access, Geolocation | One-off actions | None; call them inside the event handler that has the user gesture |

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
- **Redirects:** respond with `X-PP-Redirect: /target` (or a `Location` header on a 3xx); the client navigates, SPA-aware, and the call resolves to `{ redirected: true, to }`. Cross-origin targets are ignored with a console warning.
- **Errors:** non-2xx rejects the promise with an [`RpcError`](#rpcerror).

The third argument is either `true` (shorthand for `{ abortPrevious: true }`) or an
options object:

| Option | Default | Purpose |
|---|---|---|
| `abortPrevious` | `false` | Cancel the previous in-flight call (also an open stream); the cancelled call resolves to `{ cancelled: true }` |
| `url` | current route | Endpoint to POST to |
| `csrfUrl` | the request URL | Where to GET the CSRF cookie if it is missing |
| `credentials` | `same-origin`, or `include` for a cross-origin `url` | `fetch` credentials mode (`omit` also skips the CSRF fetch) |
| `onStream(chunk)` / `onStreamComplete()` | – | Consume an SSE response |
| `onStreamError(error)` | – | Handle a failure yourself; when set, the promise resolves instead of rejecting |
| `onUploadProgress({ loaded, total, percent })` / `onUploadComplete()` | – | Upload progress for multipart (file) payloads |

**Multipart ordering:** when a payload contains files, every non-file value is written
before the first file, so a server that streams the upload can read the other arguments
before it reaches the file. Keys keep their order within each group, and a `FileList`
is appended under one name.

#### `RpcError`

A rejected `pp.rpc` call throws an `RpcError` (an `Error` subclass with
`name === "RpcError"`):

| Field | Contents |
|---|---|
| `message` | The server's `error` text (401 → `"Authentication required"`, 403 → `"Permission denied"`) |
| `status` | The HTTP status (401, 403, 415, 422, 500, …) |
| `errors` | Field messages from a validation failure, e.g. `{ email: ["Already taken"] }`; `{}` if none |
| `requestId` | The body's `requestId` string, for support requests; `null` if absent |
| `body` | The parsed JSON body, or `null` |

```js
try {
  await pp.rpc("saveProfile", data);
} catch (err) {
  if (err.name === "RpcError" && err.status === 422) setFieldErrors(err.errors);
  else throw err;
}
```

A server error body therefore looks like:
`{"error": "Validation failed", "errors": {"email": ["Already taken"]}, "requestId": "req_8f2c"}`.

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

Non-JSON text frames reach `onMessage` as plain strings.

**Handlers and options** (the third argument):

| Option | Default | Purpose |
|---|---|---|
| `onOpen({ reconnected })` | – | Every successful open; `reconnected` is `false` only the first time |
| `onMessage(value)` | – | Each data frame |
| `onError(error)` | – | Handshake refusals and `{"error": …}` frames |
| `onClose({ code, reason, wasClean, willReconnect })` | – | Every closed connection, including one about to be replaced |
| `onReconnecting({ attempt, delay })` | – | A reconnect is scheduled `delay` ms from now |
| `reconnect` | `true` | Reopen after an unexpected close |
| `reconnectDelay` / `reconnectDelayMax` | `1000` / `30000` | Exponential backoff (with jitter) bounds, in ms |
| `maxReconnectAttempts` | `Infinity` | Give up after this many consecutive failures |
| `heartbeatInterval` | `25000` | Ping period in ms; `0` disables the heartbeat |
| `heartbeatTimeout` | `20000` | Treat the connection as dead if no frame arrives this long after a ping |
| `url` | `/__pulsepoint/ws` | Endpoint override |

**Staying connected.** An open connection sends `{"__pp": "ping"}` every
`heartbeatInterval`, and **the server must answer `{"__pp": "pong"}`**. A connection
that stays silent past `heartbeatTimeout` is replaced. Control frames (an object whose
only key is `__pp`) never reach `onMessage`. After an unexpected close the handle
reconnects with backoff and re-sends the arguments frame, so the server function runs
again from the top. The browser's `online` event, or a hidden tab becoming visible,
skips the backoff wait.

It does **not** reconnect after `handle.close()`, after an `{"error": …}` frame, after a
`1000` close (the server function returned), or after a policy close (`1003`, `1007`,
`1008`, `1009`, `1010`). Frames sent while the connection was down are not replayed. If
you need them, re-fetch in `onOpen` when `reconnected` is `true`.

**The handle** exposes:

- `send(value)`: queues one JSON value, buffering while connecting or reconnecting (up
  to 256 frames). It returns `false` once the handle is closed for good or the buffer is
  full.
- `close(code?, reason?)`: closes for good, with no reconnect.
- `readyState`: mirrors `WebSocket.readyState`, and is `CONNECTING` while waiting to
  reconnect.

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

Production servers must check `Origin` against an allow-list, cap connections, and bound
message size and rate.

### SPA navigation

`pp.mount()` intercepts same-origin `<a>` clicks, fetches the next page, swaps the region
marked `pp-loading-content="true"`, and manages scroll and history. Serve full HTML
documents for every route; optionally send `X-PP-Root-Layout: <id>` (also emitted as
`meta[name="pp-root-layout"]`) so the client can detect layout changes and fall back to a
full load. Per-link `pp-spa="false"` opts out.

What a navigation does:

- **Request:** a `GET` with `X-PP-Navigation: true`, `X-PulsePoint-Wire: true`,
  `X-Requested-With: XMLHttpRequest` and `Accept: text/html`. It times out after 15 s.
  On a timeout, a non-2xx status or any other error, the client falls back to a full page
  load.
- **Redirects:** followed `fetch` redirects and `X-PP-Redirect` are both honoured.
  Cross-origin targets fall back to a full load.
- **Head:** `<title>` is updated. Every `<head>` element marked `data-pp-meta`
  (description, canonical, robots, Open Graph, Twitter cards…) is replaced with the new
  page's set. Everything else in `<head>` is left untouched.
- **Body:** the new `<body>` attributes are copied (except `style`), the old page's
  components are destroyed, and the new body is mounted.
- **Events:** `pp:navigation:start`, `pp:navigation:complete` and `pp:navigation:error`
  are dispatched on `document`, with `event.detail = { url }` (plus `error` on failure).

```js
document.addEventListener("pp:navigation:start", () => progressBar.show());
document.addEventListener("pp:navigation:complete", (e) => analytics.page(e.detail.url));
```

- **Scroll:** positions are stored in history state per window and per scroll container
  (`pp-scroll-key`), and restored on back/forward. `pp-reset-scroll="true"` on the new
  page's `<body>` or a container resets it.
- **Loading states:** loading templates are `div[pp-loading-url="/route"]` elements inside
  a container with `id="loading-file-1B87E"`. The longest matching route prefix is used,
  falling back to `/`. A child with `pp-loading-transition='{"fadeIn":"200ms","fadeOut":"150ms"}'`
  sets the fade timing (default 250 ms; units `ms`, `s` or `m`).

`pp.redirect(url)` uses the same machinery when SPA navigation is on, and does a normal
`location` change otherwise or for cross-origin URLs.

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

1. **Serve and start the runtime**: copy `pp-reactive-v2.min.js` to your static assets, then import `ComponentInit` from it in a module script in your base layout and call `bootstrap()` exactly once.
2. **Render deferred components**: wrap every interactive region in a `<template pp-component="unique_id">` boundary, with exactly one root element and the component's `<script>` inside it. The id is server-generated and unique per page. Your template engine's own interpolation must not collide with PulsePoint's braces.
3. **Escape user data**: server-interpolated content must be HTML-escaped **and** must not leak live `{`/`}` into the DOM (encode them as `&#123;`/`&#125;`), or stored input like `{fetch(...)}` would execute as a template expression. This is the one security rule specific to PulsePoint. The same encoding avoids collisions with template engines that use braces.
4. **Set the CSRF cookie** on page responses.
5. **Handle RPC POSTs** with one middleware catching `X-PP-RPC: true`.
6. **Return structured errors**: `{"error": "…", "errors": {field: [...]}, "requestId": "…"}` with a non-2xx status, surfaced to the client as [`RpcError`](#rpcerror).
7. **Optional**: SSE streaming; a `/__pulsepoint/ws` endpoint that answers `{"__pp":"ping"}` with `{"__pp":"pong"}`; `X-PP-Redirect` for server-driven navigation; `data-pp-meta` on per-page head tags; and `pp-event-owner` / `pp-ref-owner` stamps if your component compiler forwards call-site attributes onto component roots.

### Deferred component boundaries

Wrap each **outermost** component root in an inert `<template pp-component>` carrying the
same id:

```html
<template pp-component="counter_1">
  <div pp-component="counter_1">…</div>
</template>
```

`PP.bootstrap()` materializes every `template[pp-component]` into live DOM first, then
scans for components. Without the wrapper, the browser parses and validates the region
before PulsePoint starts: raw `{...}` placeholders in `src`, SVG geometry, form values or
table text get evaluated as literal content, and component `<script>` blocks run outside
component scope. With it, first paint is flash-free and nothing executes early.

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
- `pp.enablePerf()` / `pp.getPerfStats()` expose per-component render counts and per-phase timings (`count`, `totalMs`, `maxMs`); `pp.resetPerfStats()` clears them.
- To profile the **initial mount** (which runs before you can type in the console), set `localStorage["pp-perf"] = "1"`, reload, then read `pp.getPerfStats()`.
- A failed `pp.rpc` is an [`RpcError`](#rpcerror): log `err.status`, `err.errors` and `err.requestId`.

---

## Documentation Structure

The full documentation is available on the official site. Key sections include:

- **Getting Started** – Introduction, Installation
- **Core** – State, Effect, Ref, Loop, Spread
- **Template & Mustache** – Text Interpolation, Attribute Binding, Event Handling, Two-Way Data Binding, Conditional Rendering
- **Components** – Components, Props, Children, Composition Roots, Fragments, Context Management, Portals
- **Native JavaScript & Web APIs** – WebGPU (live demo), Workers, animation loops, third-party libraries ([/docs/web-platform](https://pulsepoint.tsnc.tech/docs/web-platform))
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
- ✅ Structured RPC errors (`RpcError`) and upload progress for file payloads.
- ✅ Self-healing sockets: heartbeat, automatic reconnect with backoff, send buffering.
- ✅ Optional SPA navigation with scroll and history management, managed `<head>` tags and navigation events.
- ✅ Event ownership for component roots (`pp-event-owner`) and same-id sibling instances.
- ✅ Flash-free deferred templates, including inert `src`/`srcset` placeholders.
- ✅ Native web APIs straight from component scripts: WebGPU, Workers, WebAssembly, Web Audio, WebRTC (documented pattern + live WebGPU demo).
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
