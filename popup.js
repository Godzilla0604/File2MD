/**
 * popup.js
 * Orchestrates the popup UI: file selection, conversion, status updates, download.
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ── Element refs ── */
  const dropZone       = document.getElementById('drop-zone');
  const fileInput      = document.getElementById('file-input');
  // NOTE: fileLabel removed — no matching element in popup.html
  const fileNameBadge  = document.getElementById('file-name-badge');
  const convertBtn     = document.getElementById('convert-btn');
  const statusBox      = document.getElementById('status');
  const progressBar    = document.getElementById('progress-bar');
  const progressFill   = document.getElementById('progress-fill');
  const previewSection = document.getElementById('preview-section');
  const previewContent = document.getElementById('preview-content');
  const charCount      = document.getElementById('char-count');

  let selectedFile = null;

  /* ── Helpers ── */

  /**
   * Formats a byte count as a human-readable string (KB / MB).
   * @param {number} bytes
   * @returns {string}
   */
  function formatSize(bytes) {
    if (bytes < 1024)       return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /**
   * Updates the status box. type: 'idle' | 'loading' | 'success' | 'error'
   * Passing an empty message hides the box.
   */
  function setStatus(message, type = 'idle') {
    statusBox.textContent = message;
    statusBox.className = `status status--${type}`;
    statusBox.style.display = message ? 'block' : 'none';
  }

  /**
   * Shows/hides the animated progress bar.
   * Pass null to hide it, or a number 0–100 to set fill width.
   */
  function setProgress(pct) {
    if (pct === null) {
      progressBar.style.display = 'none';
      progressFill.style.width = '0%';
    } else {
      progressBar.style.display = 'block';
      // Use rAF so the width transition triggers correctly
      requestAnimationFrame(() => {
        progressFill.style.width = `${pct}%`;
      });
    }
  }

  /** Enables/disables the convert button based on whether a file is ready. */
  function updateConvertBtn() {
    convertBtn.disabled = !selectedFile;
  }

  /** Populates and shows the Markdown preview panel. */
  function showPreview(markdown) {
    // Cap preview at 800 chars to keep the popup responsive
    const preview = markdown.length > 800
      ? markdown.slice(0, 800) + '\n\n\u2026_(preview truncated — full file downloaded)_'
      : markdown;
    previewContent.textContent = preview;
    charCount.textContent = `${markdown.length.toLocaleString()} chars`;
    previewSection.style.display = 'block';
    previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /** Validates and registers a dropped or browsed file. */
  function handleFileSelected(file) {
    if (!file) return;

    if (!isSupportedFile(file.name)) {
      const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}` : '(no extension)';
      setStatus(`❌ Unsupported type ${ext}. Choose a supported file.`, 'error');
      selectedFile = null;
      fileNameBadge.style.display = 'none';
      updateConvertBtn();
      return;
    }

    selectedFile = file;
    // Truncate long filenames visually in the badge
    fileNameBadge.textContent = file.name;
    fileNameBadge.style.display = 'inline-flex';
    setStatus(`✅ Ready — ${file.name} (${formatSize(file.size)})`, 'success');
    previewSection.style.display = 'none';
    updateConvertBtn();
  }

  /* ── File Input ── */

  fileInput.addEventListener('change', () => {
    handleFileSelected(fileInput.files[0] || null);
  });

  /* ── Drag & Drop ── */

  ['dragenter', 'dragover'].forEach(evt => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.add('drop-zone--drag-over');
    });
  });

  ['dragleave', 'dragend', 'drop'].forEach(evt => {
    dropZone.addEventListener(evt, () => {
      dropZone.classList.remove('drop-zone--drag-over');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0] || null;
    if (file) {
      handleFileSelected(file);
    }
  });

  // Click on drop zone opens file picker
  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  /* ── Convert Button ── */

  convertBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    const filename = selectedFile.name;
    convertBtn.disabled = true;
    setStatus('⏳ Converting…', 'loading');
    setProgress(10);
    previewSection.style.display = 'none';

    // Yield to browser so the UI renders the loading state before heavy work
    await new Promise(r => setTimeout(r, 60));

    try {
      setProgress(40);
      const markdown = await convertFileToMarkdown(selectedFile);
      setProgress(80);

      // Brief "finalising" pause for smoother UX
      await new Promise(r => setTimeout(r, 150));
      setProgress(100);

      // Trigger the local download
      downloadMarkdown(markdown, filename);

      await new Promise(r => setTimeout(r, 300));
      setProgress(null);

      const outName = deriveOutputFilename(filename);
      setStatus(`🎉 Saved as “${outName}” — check your Downloads folder.`, 'success');
      showPreview(markdown);

    } catch (err) {
      setProgress(null);
      setStatus(`❌ Conversion failed: ${err.message}`, 'error');
    } finally {
      convertBtn.disabled = false;
    }
  });

  /* ── Keyboard: allow pressing Enter on the drop zone ── */
  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  /* ── Initial state ── */
  setProgress(null);
  updateConvertBtn();
});
