# ![Audio Thing](https://raw.githubusercontent.com/muzazu/audio-thing-ext/main/public/icon/32.png) Audio Thing

A small browser extension to manage and boost audio levels in the browser.

**Quick summary:** lightweight UI built with React and WXT, focused on letting users increase or normalize audio output per tab.

**Status:** Prototype / in active development.

**Try It:** [Chrome Web Store](https://chromewebstore.google.com/detail/fogdedbbmagmgikimklbkbpnpieeimkf)

---

(\_　\_)。゜zｚＺ

![SS](https://raw.githubusercontent.com/muzazu/audio-thing-ext/main/public/ss.webp)

## Setup (stuff you probably need)

- Node.js (18+ is safe)
- bun → https://bun.com/
- oxc plugins (linting and formatting) → https://oxc.rs/docs/guide/introduction.html
- (optional) vp (Vite Plus) → https://viteplus.dev/guide/

## Stack

- WXT (extension framework) → https://wxt.dev/guide/introduction.html
- React → https://react.dev/
- shadcn/ui → https://ui.shadcn.com/

## Getting started (development)

If you’ve never used WXT, maybe skim this first:  
https://wxt.dev/guide/introduction.html

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

PRs are welcome,
if something’s unclear / broken, just open an issue

## License

[MIT](./LICENSE) | © 2026 muzazu made with ❤️.
