// Triggers a browser save/open for a blob returned by an authenticated
// axios request (a plain <a href> can't carry the Authorization header,
// so PDFs and other protected files have to be fetched as a blob first).
export function openOrDownloadBlob(blob, filename, { openInNewTab = true } = {}) {
  const url = window.URL.createObjectURL(blob);
  if (openInNewTab) {
    window.open(url, '_blank');
  } else {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
}
