/**
 * download.js
 * Handles triggering a browser download of Markdown content as a .md file.
 * No servers, no uploads — purely client-side Blob + Object URL magic.
 */

/**
 * Derives an output filename by stripping the original extension
 * and appending ".md".
 * @param {string} originalFilename
 * @returns {string}
 */
function deriveOutputFilename(originalFilename) {
  const dotIndex = originalFilename.lastIndexOf('.');
  const baseName = dotIndex !== -1 ? originalFilename.slice(0, dotIndex) : originalFilename;
  return `${baseName}.md`;
}

/**
 * Triggers a browser download of the given Markdown text.
 * @param {string} markdownText  The Markdown content to download.
 * @param {string} originalFilename  Used to derive the output filename.
 */
function downloadMarkdown(markdownText, originalFilename) {
  const outputName = deriveOutputFilename(originalFilename);

  // Create a Blob with UTF-8 Markdown content
  const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8' });

  // Create a temporary object URL
  const url = URL.createObjectURL(blob);

  // Build an invisible anchor and click it to trigger download
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = outputName;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup: remove the anchor and revoke the object URL to free memory
  document.body.removeChild(anchor);

  // Small delay before revoking so the browser has time to initiate the download
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
