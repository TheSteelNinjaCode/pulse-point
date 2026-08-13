# PulsePoint • AI Execution Rules (Backend-Agnostic, Core Runtime Only)

> Purpose: eliminate guesses and make AI outputs instantly copy-pasteable for **PulsePoint** projects, without assuming **any specific backend** (no PHP, no Prisma, no framework coupling).  
> This document only covers the **core PulsePoint runtime** (state, effects, refs, directives) — no backend helpers.  
> **Version:** 2.2.0 | **Last Updated:** 2025-11-21

---

## ⚡ Core Principles (PulsePoint Only)

These rules assume you are writing code for the **PulsePoint runtime** (browser-side reactive layer). The backend can be **anything** (PHP, Node, Go, Python, etc.), and is **out of scope** here.

1. Only use the **allowed runtime surface** listed below (`pp.state`, `pp.effect`, `pp.ref`, markup directives).
2. Keep a strict **file layout**: HTML markup → a single `<script>` block at the bottom.
3. Prefer **visibility toggles** (`hidden` attribute) over complex conditional markup.
4. Use **stable keys** in loops (IDs or stable indices, never random).
5. Do **not invent** helpers, directives, or APIs that are not explicitly listed here.

If something isn’t listed here, treat it as **forbidden** for AI-generated PulsePoint code.

---

## ✅ Allowed Runtime Surface

### Core JavaScript API

1. `pp.state<T>(initial)` → `[state, setState]`
2. `pp.ref<T>(initial: T | null)`
3. `pp.effect(fn: () => void | () => void, deps?: Dependency[])`

### Markup Directives

1. `pp-for` (only inside `<template>`)
2. `pp-spread`
3. `pp-ref`

> If a symbol is not above, **do not use it** in generated code.

---

## 🗂 File Layout (Backend-Agnostic)

Minimal layout PulsePoint expects on the client:

```html
<!-- 1) HTML markup -->
<ul>
  <template pp-for="user in users">
    <li key="{user.id}">{user.name}</li>
  </template>
</ul>

<!-- 2) One script block at bottom -->
<script>
  const [users, setUsers] = pp.state([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);
</script>
```

Rules:

- **Exactly one** `<script>` block per page/component, at the bottom.
- Any backend (PHP, Node, etc.) can inject initial data (for example as JSON) **before** this script runs.
- JavaScript must only reference data that is already available when the script executes.

---

## 🔀 Conditionals & Booleans

**Visibility (preferred):**

```html
<div hidden="{!isOpen}">Shown when open</div>
<div hidden="{isOpen}">Shown when closed</div>
```

**Text/attribute ternaries (simple values only):**

```html
<span class="{isActive ? 'text-green-600' : 'text-red-600'}">
  {isActive ? 'Active' : 'Inactive'}
</span>
```

**Boolean attributes** (present/absent semantics):

```html
<input type="checkbox" checked="{isActive}" />
```

**Ternary string guardrail (quotes must wrap string branches):**

- ✅ `{isActive ? 'text-blue-500' : 'text-gray-500'}`
- ❌ `{isActive ? text-blue-500' : 'text-gray-500'}` ← missing opening quote

If a branch is not quoted, treat the output as invalid and fix it before using.

---

## 🔗 Refs (`pp-ref`) Patterns

**Single element ref:**

```html
<input type="text" pp-ref="{nameInput}" />
<button onclick="nameInput.current?.focus()">Focus</button>

<script>
  const nameInput = pp.ref(null);
</script>
```

## Focus an input when entering edit mode

**Callback ref (dynamic/loop):**

```html
<ul class="space-y-2">
  <template pp-for="item in items">
    <li key="{item.id}" class="flex gap-2">
      <span>{item.name}</span>

      <!-- Register specific inputs into a Map using a callback -->
      <input
        pp-ref="{registerRef(item.id)}"
        type="text"
        hidden="{editingId !== item.id}"
      />

      <button onclick="setEditingId(item.id)">Edit</button>
    </li>
  </template>
</ul>

<script>
  const [items, setItems] = pp.state([
    { id: 1, name: "Task A" },
    { id: 2, name: "Task B" },
  ]);
  const [editingId, setEditingId] = pp.state(null);

  // Store refs: Map<ID, HTMLElement>
  const itemRefs = new Map();

  // Curried function: ID -> (Element) -> Void
  const registerRef = (id) => (el) => {
    if (el) itemRefs.set(id, el);
    else itemRefs.delete(id); // Cleanup on unmount
  };

  // Effect: Auto-focus when entering edit mode
  pp.effect(() => {
    if (editingId && itemRefs.has(editingId)) {
      itemRefs.get(editingId).focus();
    }
  }, [editingId]);
</script>
```

Rules:

- Always init with `pp.ref(null)` and null-check (`ref.current?`).
- Use refs for DOM or imperative handles, **not** for reactive data storage.
- Clean up in `pp.effect` return functions when necessary.

---

## 🎨 Spread (`pp-spread`) Patterns

**Basic:**

```html
<button pp-spread="{...btn}">Submit</button>

<script>
  const [btn] = pp.state({
    class: "px-3 py-2 rounded-md",
    "aria-label": "submit",
  });
</script>
```

**Multiple spreads & precedence:**

```html
<input pp-spread="{...base, ...validation}" placeholder="Name" />

<script>
  const [base] = pp.state({ class: "input-base", required: true });
  const [validation] = pp.state({ pattern: "[A-Za-z]+" });
</script>
```

Notes:

- Later spreads override earlier ones.
- Explicit attributes on the element override all spreads.

---

## 🔁 Lists (`pp-for`)

```html
<ul>
  <template pp-for="todo in todos">
    <li key="{todo.id}">
      {todo.title}
      <button onclick="removeTodo(todo.id)">Remove</button>
    </li>
  </template>
</ul>

<script>
  const [todos, setTodos] = pp.state([
    { id: 1, title: "First task" },
    { id: 2, title: "Second task" },
  ]);

  function removeTodo(id) {
    setTodos(todos.filter((item) => item.id !== id));
  }
</script>
```

Rules:

- Place `pp-for` **only** on `<template>` elements.
- `key` must be **stable** (`id` or stable index), never random.
- Avoid mutating arrays directly; prefer `setTodos` with new arrays.

---

## ⚡ Effects (`pp.effect`) Cheats

```html
<script>
  // On any reactive change
  pp.effect(() => console.log("Any change"));

  // Once (mount)
  pp.effect(() => {
    // init logic
    return () => {
      // cleanup logic
    };
  }, []);

  // With deps
  const [count, setCount] = pp.state(0);
  pp.effect(() => {
    console.log("count", count);
  }, [count]);
</script>
```

Common patterns:

- Use `[]` deps for one-time init + cleanup.
- Use `[stateVar]` deps to react to specific state changes.
- Avoid unconditional `setState` inside effects; guard with conditions.

---

## ✅ Two-Way Binding Patterns

**Checkbox:**

```html
<input
  type="checkbox"
  checked="{isActive}"
  onchange="setIsActive(event.target.checked)"
/>

<script>
  const [isActive, setIsActive] = pp.state(false);
</script>
```

**Text input:**

```html
<input type="text" value="{name}" oninput="setName(event.target.value)" />

<script>
  const [name, setName] = pp.state("");
</script>
```

Rules:

- Inputs should always read from state and write back via explicit setters.
- Avoid mixing manual DOM reads (`document.querySelector`) with PulsePoint state.

---

## ❌ Error Patterns to Avoid (PulsePoint Core)

1. Using any API **not** listed in the Allowed Runtime Surface.
2. Putting `pp-for` directly on non-`<template>` elements.
3. Using ternaries to show/hide entire blocks instead of `hidden` toggles.
4. Missing quotes in string ternaries.
5. Multiple `<script>` blocks or scripts not at the bottom.
6. Unstable or random keys in list rendering.
7. Direct DOM mutations for things that should be reactive state.
8. Hard-coding backend-specific things (PHP, Prisma, Laravel, etc.) in PulsePoint-only snippets.

Always fix these before considering AI-generated code “safe to paste” into a PulsePoint project, no matter which backend you use.
