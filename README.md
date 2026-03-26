# ![Audio Thing](https://raw.githubusercontent.com/muzazu/audio-thing-ext/main/public/icon/32.png) Audio Thing

A small browser extension to manage and boost audio levels in the browser. Currently targeted for Chrome during development.

**Quick summary:** lightweight UI built with React and WXT, focused on letting users increase or normalize audio output per tab.

**Status:** Prototype / in active development.

---

(\_　\_)。゜zｚＺ

![SS](https://raw.githubusercontent.com/muzazu/audio-thing-ext/main/public/ss.webp)

## Prerequisites

- Node.js (recommended >= 18)
- vp (Vite Plus) — we use `vp` for hooks: https://viteplus.dev/guide/
- bun: https://bun.com/

## Tech stack

- WXT (extension framework): https://wxt.dev/guide/introduction.html
- React: https://react.dev/
- shadcn/ui: https://ui.shadcn.com/

## Getting started (development)

1. Install dependencies:

```bash
bun install
```

2. Start development server with hot reload:

```bash
bun dev
```

3. During development you can load the extension into Chrome using the extension's built output (see Build).

## Build & load for testing

1. Build the extension:

```bash
bun build
```

2. Load the extension into Chrome:

- Open `chrome://extensions`
- Enable "Developer mode"
- Click "Load unpacked" and select the output folder (e.g., `dist/` or the folder created by the build)

Note: build output folder may vary depending on WXT/vite config.

## Project structure

- `entrypoints/` — extension entry scripts (background, content, popup)
- `components/` — UI components
- `lib/` — utilities
- `public/` — static assets and manifest

## Contributing

Contributions are welcome. Please open an issue or a PR with a clear description of the change.

## License

[MIT](./LICENSE) | © 2026 muzazu made with ❤️.
