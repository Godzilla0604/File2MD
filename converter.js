/**
 * converter.js — File2MD
 * Core conversion logic: reads a File object and returns a Markdown string.
 *
 * Privacy guarantee:
 *   All processing is done synchronously in the browser's JavaScript engine
 *   via the FileReader API. No network requests are made. No data ever leaves
 *   the device.
 *
 * Supported formats: txt, md, py, js, html, css, json, csv
 */

const SUPPORTED_EXTENSIONS = ['txt', 'md', 'py', 'js', 'html', 'css', 'json', 'csv'];

/**
 * Returns the file extension (lowercase, no dot).
 * @param {string} filename
 * @returns {string}
 */
function getExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Checks whether a filename has a supported extension.
 * @param {string} filename
 * @returns {boolean}
 */
function isSupportedFile(filename) {
  return SUPPORTED_EXTENSIONS.includes(getExtension(filename));
}

/**
 * Converts a CSV string into a Markdown table.
 * @param {string} csvText
 * @returns {string}
 */
function csvToMarkdownTable(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return '_Empty CSV file._';

  // Parse rows, handling quoted commas
  const parseRow = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const rows = lines.map(parseRow);
  const header = rows[0];
  const separator = header.map(() => '---');

  const mdRows = [
    `| ${header.join(' | ')} |`,
    `| ${separator.join(' | ')} |`,
    ...rows.slice(1).map(row => {
      // Pad or trim row to match header column count
      while (row.length < header.length) row.push('');
      return `| ${row.slice(0, header.length).join(' | ')} |`;
    })
  ];
  return mdRows.join('\n');
}

/**
 * Wraps raw text in a fenced code block with the given language hint.
 * @param {string} text
 * @param {string} lang
 * @returns {string}
 */
function toCodeBlock(text, lang) {
  return `\`\`\`${lang}\n${text}\n\`\`\``;
}

/**
 * Converts an HTML string into a readable Markdown representation.
 *
 * Strategy: lightweight regex-based semantic mapping — NOT a full DOM parser.
 * Handles the most common content elements well; edge cases in deeply nested
 * or JavaScript-heavy pages may not convert perfectly.
 *
 * Transformation order matters: block-level elements are handled before
 * inline elements so that nested constructs resolve correctly.
 *
 * @param {string} html - Raw HTML source text.
 * @returns {string}    - Converted Markdown string.
 */
function htmlToMarkdown(html) {
  let md = html;

  // 1. Strip DOCTYPE declarations and HTML comments (non-content noise)
  md = md.replace(/<!DOCTYPE[^>]*>/gi, '');
  md = md.replace(/<!--[\s\S]*?-->/g, '');

  // 2. Block-level semantic elements → ATX headings
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n');
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n');
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n');
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n');
  md = md.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '\n##### $1\n');
  md = md.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '\n###### $1\n');

  // 3. Line breaks and horizontal rules
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<hr\s*\/?>/gi, '\n---\n');

  // 4. Paragraphs → double-newline-separated blocks
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');

  // 5. Lists → GFM unordered list items
  //    Ordered lists are also flattened to ‘-’ bullets for simplicity
  md = md.replace(/<ul[^>]*>/gi, '\n');
  md = md.replace(/<\/ul>/gi, '\n');
  md = md.replace(/<ol[^>]*>/gi, '\n');
  md = md.replace(/<\/ol>/gi, '\n');
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');

  // 6. Inline text formatting
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '_$1_');
  md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '_$1_');
  md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
  md = md.replace(/<mark[^>]*>([\s\S]*?)<\/mark>/gi, '==$1==');
  md = md.replace(/<del[^>]*>([\s\S]*?)<\/del>/gi, '~~$1~~');
  md = md.replace(/<s[^>]*>([\s\S]*?)<\/s>/gi, '~~$1~~');

  // 7. Links: <a href="url">text</a> → [text](url)
  md = md.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // 8. Images — handle both attribute orders
  md = md.replace(/<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*\/?>/, '![$2]($1)');
  md = md.replace(/<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']*)["'][^>]*\/?>/gi, '![$1]($2)');
  md = md.replace(/<img[^>]*src=["']([^"']*)["'][^>]*\/?>/gi, '![]($1)');

  // 9. Blockquotes: prefix every line with >
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner) => {
    return inner.trim().split('\n').map(l => `> ${l}`).join('\n') + '\n';
  });

  // 10. Pre + code blocks — must run before the generic tag-strip below
  md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '\n```\n$1\n```\n');
  md = md.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '\n```\n$1\n```\n');

  // 11. Strip any remaining HTML tags (e.g. <div>, <span>, <head>, <script>)
  md = md.replace(/<[^>]+>/g, '');

  // 12. Decode the most common HTML entities
  md = md.replace(/&amp;/g,  '&');
  md = md.replace(/&lt;/g,   '<');
  md = md.replace(/&gt;/g,   '>');
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#39;/g,  "'");
  md = md.replace(/&nbsp;/g, ' ');

  // 13. Normalise whitespace — collapse 3+ consecutive newlines to 2
  md = md.replace(/\n{3,}/g, '\n\n');

  return md.trim();
}

/**
 * Master conversion function.
 * Reads the file and resolves with a Markdown string.
 * @param {File} file
 * @returns {Promise<string>}
 */
function convertFileToMarkdown(file) {
  return new Promise((resolve, reject) => {
    if (!isSupportedFile(file.name)) {
      reject(new Error(`Unsupported file type. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`));
      return;
    }

    const ext = getExtension(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const rawText = e.target.result;
        const filename = file.name;
        let markdown = '';

        switch (ext) {

          // ── .md: keep file content exactly as-is ──
          case 'md':
            markdown = rawText;
            break;

          // ── .txt: preserve as normal Markdown text (no code block) ──
          case 'txt':
            markdown = rawText.trim();
            break;

          // ── .csv: convert to a GitHub-flavoured Markdown table ──
          case 'csv': {
            const table = csvToMarkdownTable(rawText);
            markdown = `# ${filename}\n\n${table}`;
            break;
          }

          // ── Code files: # filename + fenced code block ──
          case 'py':
            markdown = `# ${filename}\n\n${toCodeBlock(rawText, 'python')}`;
            break;

          case 'js':
            markdown = `# ${filename}\n\n${toCodeBlock(rawText, 'javascript')}`;
            break;

          // ── .html: semantic HTML → Markdown via htmlToMarkdown() ──
          case 'html': {
            const converted = htmlToMarkdown(rawText);
            markdown = `# ${filename} (Converted)\n\n${converted}`;
            break;
          }

          case 'css':
            markdown = `# ${filename}\n\n${toCodeBlock(rawText, 'css')}`;
            break;

          case 'json': {
            // Pretty-print valid JSON before wrapping; leave raw if invalid
            let pretty = rawText;
            try {
              pretty = JSON.stringify(JSON.parse(rawText), null, 2);
            } catch (_) { /* invalid JSON — use raw text */ }
            markdown = `# ${filename}\n\n${toCodeBlock(pretty, 'json')}`;
            break;
          }

          default:
            markdown = rawText.trim();
        }

        resolve(markdown);
      } catch (err) {
        reject(new Error(`Conversion failed: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read the file.'));
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Builds a plain Markdown document with a heading and body text.
 * Utility function kept for extensibility — not currently called by the
 * main switch (all cases are handled inline), but available for future
 * format handlers that need the standard heading+body structure.
 *
 * @param {string} filename - Used as the H1 heading.
 * @param {string} content  - Body text (will be trimmed).
 * @returns {string}
 */
function buildMarkdownDocument(filename, content) {
  return `# ${filename}\n\n${content.trim()}`;
}
