<div align="center">

# File2MD

**Convert files to Markdown — instantly, privately, right in your browser.**

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blueviolet?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Godzilla0604%2FFile2MD-181717?style=flat-square&logo=github)](https://github.com/Godzilla0604/File2MD)
[![No Backend](https://img.shields.io/badge/Backend-None-orange?style=flat-square)](#privacy)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-red?style=flat-square)](#tech-stack)

</div>

---

## What is File2MD?

**File2MD** is a Chrome Extension that converts common file formats into clean Markdown (`.md`) files, all inside your browser. No servers, no accounts, no internet required after installation. Drop a file, click Convert, done.

It is aimed at developers, writers, and students who need a fast, private way to turn source files and documents into Markdown for wikis, README drafts, note-taking apps, or documentation pipelines.

---

##  Features

| Feature | Detail |
|---------|--------|
|  **100% Local** | Files never leave your device. Processed via the browser's `FileReader` API |
|  **Instant** | No network latency — conversion is synchronous and in-memory |
|  **Drag & Drop** | Drop a file onto the popup or click to browse |
|  **Live Preview** | See the first 800 characters of converted Markdown before saving |
|  **File Size Info** | Displays file size in the status bar when a file is selected |
|  **One-Click Download** | Saves `filename.md` to your Downloads folder automatically |
|  **Accessible** | Full ARIA roles, `aria-live` regions, and keyboard navigation |
|  **Dark UI** | Glassmorphism-inspired design with animated progress bar |

---

##  Supported File Types

| Extension | Conversion Method |
|-----------|------------------|
| `.txt`    | Preserved as plain Markdown text — no wrapping, no heading added |
| `.md`     | Passed through unchanged — output is identical to input |
| `.py`     | Wrapped in a ` ```python ` fenced code block with `# filename` heading |
| `.js`     | Wrapped in a ` ```javascript ` fenced code block with `# filename` heading |
| `.html`   | **Semantic conversion** via `htmlToMarkdown()` — headings, bold/italic, links, images, lists, blockquotes, `<pre>` code blocks, and HTML entity decoding |
| `.css`    | Wrapped in a ` ```css ` fenced code block with `# filename` heading |
| `.json`   | Pretty-printed via `JSON.parse` → wrapped in a ` ```json ` fenced code block |
| `.csv`    | Parsed into a GitHub-Flavoured Markdown table (handles quoted commas) |

> **Note on `.html`:** The converter is a lightweight regex-based semantic mapper, not a full DOM parser. It handles standard content pages well. Deeply nested layouts or JavaScript-rendered content may not convert perfectly.

---

##  Installation

### Load Unpacked (Developer Mode)

1. [Download or clone this repository](https://github.com/Godzilla0604/File2MD) to your local machine.
2. Open **Google Chrome** and go to `chrome://extensions/`.
3. Toggle **Developer Mode** on (switch in the top-right corner).
4. Click **"Load unpacked"**.
5. Select the `File2MD` project folder (the one containing `manifest.json`).
6. The **File2MD** icon will appear in your Chrome toolbar. Pin it for easy access.

> No build step, no `npm install`, no compilation — the extension runs directly from source.

---

##  Usage

1. Click the **File2MD** icon in your Chrome toolbar to open the popup.
2. **Drop a file** onto the upload zone, or click **"Click to browse"** to open the file picker.
3. The status bar will confirm the file name and size.
4. Click **"Convert & Download .md"**.
5. A progress bar animates as the file is processed.
6. Your `.md` file is automatically saved to your Downloads folder.
7. A **preview** of the converted Markdown appears inside the popup.

---

##  Project Structure

```
File2MD/
├── manifest.json     # Chrome Extension Manifest V3 — zero permissions required
├── popup.html        # Extension popup UI (semantic HTML5 + ARIA)
├── popup.css         # Dark glassmorphism design system with CSS custom properties
├── popup.js          # UI controller — drag-drop, progress, status, preview
├── converter.js      # Core conversion logic for all 8 file types (local only)
├── download.js       # Blob + Object URL download helper (no uploads, ever)
├── LICENSE           # MIT License
├── .gitignore        # OS, editor, and build artefact exclusions
├── README.md         # This file
└── icons/
    ├── icon16.png    # Toolbar icon (16×16)
    ├── icon32.png    # Toolbar icon (32×32)
    ├── icon48.png    # Extensions page icon (48×48)
    └── icon128.png   # Chrome Web Store icon (128×128)
```

---

##  How It Works

```
User selects / drops a file
          │
          ▼
    popup.js — handleFileSelected()
          │  validates extension via isSupportedFile()
          │  displays file name + size in status bar
          ▼
    popup.js — convert button click
          │
          ▼
    converter.js — convertFileToMarkdown(file)
          │  FileReader.readAsText(file, 'UTF-8')
          │
          ├─ .txt  → plain text, trimmed
          ├─ .md   → raw content, unchanged
          ├─ .py   → # filename + ```python block
          ├─ .js   → # filename + ```javascript block
          ├─ .html → htmlToMarkdown() — 13-step semantic regex pipeline
          ├─ .css  → # filename + ```css block
          ├─ .json → JSON.parse → pretty-print → ```json block
          └─ .csv  → csvToMarkdownTable() → GFM pipe table
          │
          ▼
    download.js — downloadMarkdown(markdown, originalFilename)
          │  new Blob([markdown], { type: 'text/markdown' })
          │  URL.createObjectURL(blob) → <a>.click()
          │  URL.revokeObjectURL() after 1 s
          ▼
    filename.md → saved to Downloads
```

---

##  Privacy

File2MD is designed from the ground up to be **completely private**:

- **Zero network requests** — no `fetch()`, no `XMLHttpRequest`, no WebSockets.
- **Zero permissions** — `manifest.json` declares empty `permissions` and `host_permissions` arrays. Chrome cannot grant access to sites or storage that wasn't declared.
- **FileReader API only** — files are read directly into JavaScript memory, processed, and discarded.
- **Blob downloads** — the output `.md` file is constructed in memory and handed to the browser's built-in download mechanism. Nothing is written to disk by the extension itself.
- **No analytics, no tracking, no telemetry** of any kind.

You can audit every line of code — there are no minified bundles or obfuscated scripts.

---

##  Tech Stack

| Technology | Role |
|------------|------|
| **HTML5** | Popup structure, semantic elements, ARIA accessibility |
| **CSS3** | Dark glassmorphism design, CSS custom properties, keyframe animations |
| **Vanilla JavaScript (ES2020)** | FileReader API, Blob API, DOM manipulation, async/await |
| **Chrome Extension Manifest V3** | Extension packaging and browser integration |

**No npm. No React. No Webpack. No backend. Zero external dependencies.**

---

##  Development Notes

### Adding a New File Format

1. Add the extension string to `SUPPORTED_EXTENSIONS` in [`converter.js`](converter.js).
2. Add a corresponding `case` in the `switch` block inside `convertFileToMarkdown()`.
3. Add an `accept` attribute entry in the `<input type="file">` in [`popup.html`](popup.html).
4. Add a colour-coded `.chip--ext` rule in [`popup.css`](popup.css) and a matching `<span>` in the supported-types section of the popup.

### Code Quality Rules

- No dead code (unused variables are removed, not commented out).
- Every public function has a JSDoc comment with `@param` and `@returns`.
- All conversion functions are pure — they take a string and return a string.
- The UI controller (`popup.js`) never touches conversion logic directly; it only calls `convertFileToMarkdown()` and `downloadMarkdown()`.

---

##  Roadmap

### Near-Term

- [ ] Support `.xml` — pretty-print as a code block
- [ ] Support `.yaml` / `.yml` — code block with `yaml` hint
- [ ] Support `.toml` — code block with `toml` hint
- [ ] Copy-to-clipboard button alongside the download button
- [ ] Custom output filename field

### Mid-Term

- [ ] Batch conversion — select multiple files and download a `.zip`
- [ ] Syntax highlighting in the preview panel
- [ ] "Convert All Open Tabs" mode for `.html` pages
- [ ] Configurable HTML conversion options (e.g. include/exclude images)

### Long-Term

- [ ] Offline-first service worker support
- [ ] Chrome Web Store publication
- [ ] Firefox (Manifest V3) port

---

##  Contributing

Contributions are welcome! Please:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`.
3. Make your changes — keep functions pure and modular.
4. Test by loading the extension unpacked in Chrome.
5. Open a Pull Request with a clear description of what changed and why.

> **Do not introduce external dependencies.** File2MD is intentionally dependency-free.

---

##  License

[MIT License](LICENSE) — Copyright © 2026 [Rishil Chudasama](https://github.com/Godzilla0604). Free to use, modify, and distribute.

---

<div align="center">

Built with  privacy-first principles · No servers · No tracking · No nonsense

</div>
