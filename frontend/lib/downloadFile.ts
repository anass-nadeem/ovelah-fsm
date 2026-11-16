
import { getToken } from "@/lib/auth";

/**
 * Opens a same-app API file (a PDF) in a new tab for preview - same
 * experience as a plain <a target="_blank"> link, but with the
 * login token attached so the backend allows it.
 *
 * A raw link click can't carry a custom Authorization header, so
 * this attaches the token as a "?token=..." query parameter
 * instead (the backend's require_auth accepts either). Deliberately
 * NOT using fetch()+blob here: a blob URL has no real filename
 * attached to it, so if the person then saves the PDF from within
 * the preview tab, the browser falls back to a random ID instead of
 * the proper generated name. Navigating directly to the real URL
 * means the browser loads the actual HTTP response - correct
 * filename, correct headers, exactly like it worked before login
 * was added.
 */
export function openFile(url: string): void {
  const token = getToken();

  const separator = url.includes("?") ? "&" : "?";

  const finalUrl = token
    ? `${url}${separator}token=${encodeURIComponent(token)}`
    : url;

  const newTab = window.open(finalUrl, "_blank");

  if (!newTab) {
    window.alert(
      "Your browser blocked the popup. Please allow popups for this site and try again."
    );
  }
}
/**
 * Reliably triggers a real "save file" download for a same-app API
 * URL, regardless of browser or PDF-viewer quirks.
 *
 * Why this exists: a plain `<a href="...">` pointing at the backend
 * (a different origin/port than the frontend) is not reliable for
 * downloading - browsers largely ignore the `download` attribute
 * for cross-origin links, and letting the browser's own built-in
 * PDF viewer handle it (Edge in particular) can leave the viewer's
 * own save button silently doing nothing.
 *
 * Fetching the bytes ourselves and handing them to the browser as a
 * blob sidesteps both problems entirely - it works the same way in
 * Edge, Chrome, and Firefox.
 */
export async function downloadFile(
  url: string,
  fallbackFilename: string
): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to download file (${response.status}).`
    );
  }

  // Prefer the filename the server actually generated (it encodes
  // PR number / reference / location / subject) over the fallback.
  const disposition = response.headers.get(
    "content-disposition"
  );

  let filename = fallbackFilename;

  if (disposition) {
    const match = disposition.match(
      /filename="?([^"]+)"?/
    );

    if (match && match[1]) {
      filename = match[1];
    }
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(blobUrl);
}