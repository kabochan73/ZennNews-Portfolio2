// Cookie names, importable from both the server and the browser.

/** HttpOnly cookie holding the Sanctum token. Only the Next.js server reads it. */
export const AUTH_COOKIE_NAME = "zennnews_token";

/**
 * Readable by JavaScript, value "1". A display hint only ("probably logged in"),
 * set and cleared together with the token; it grants nothing by itself.
 */
export const LOGGED_IN_COOKIE_NAME = "zennnews_logged_in";
