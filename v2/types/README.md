# PulsePoint v2 — Type definitions

TypeScript declarations for [`pp-reactive-v2.min.js`](../pp-reactive-v2.min.js). They are
generated from the runtime source, so don't edit them by hand. The one exception is
`pp-global.d.ts`, which declares the global `pp`.

## Entry points

| File | What it declares |
|---|---|
| `pp-global.d.ts` | The global `pp` (`window.pp`): page-level utilities such as `mount`, `rpc`, `socket`, `redirect`, `createContext` and the perf helpers |
| `pp-utilities.d.ts` | `ComponentInit` (`bootstrap()`) and the `PPUtilities` class behind the global `pp` |
| `ComponentRuntime.d.ts` | `ComponentRuntime<Props>`: the `pp` a **component script** receives (hooks + utilities + `props`), plus `ComponentHooksAPI`, `PPContext`, `createContext`, and the `Runtime*Options` types |
| `RpcClient.d.ts` | `RpcOptions` and the `RpcError` class |
| `SocketClient.d.ts` | `SocketOptions`, `SocketHandle`, `SocketCloseInfo` |
| `HooksSystem.d.ts` | `RefObject`, `PortalInfo` |

Every other file declares runtime internals. They have to be present because the entry
points import them, but they are not public API.

## Usage

Make the global `pp` known to the compiler, either by adding it to `include` in
`tsconfig.json` or with a reference:

```ts
/// <reference path="./types/pp-global.d.ts" />

pp.mount();
pp.socket("chat", { room: "general" }, { onOpen: ({ reconnected }) => {} });
```

The global `pp` is typed at **page level**. Hooks such as `pp.state` and `pp.effect` are
only present on the `pp` that a component script receives, so type that one as
`ComponentRuntime`:

```ts
import type { ComponentRuntime } from "./types/ComponentRuntime.js";
import type { RpcError } from "./types/RpcClient.js";

declare const pp: ComponentRuntime<{ label: string }>;

const [count, setCount] = pp.state(0);
const [isPending, startTransition] = pp.transition();

startTransition(async () => {
  try {
    await pp.rpc("save", { count });
  } catch (err) {
    const rpcErr = err as RpcError;
    if (rpcErr.name === "RpcError" && rpcErr.status === 422) console.log(rpcErr.errors);
  }
});
```

The bundle exports only `ComponentInit` and `PPUtilities`. `RpcError` is a type, not an
importable class, so check `err.name === "RpcError"` instead of using `instanceof`.
