// client/src/cometchat.js
// CometChat SDK initialisation + login helper
// Docs: https://www.cometchat.com/docs/javascript-chat-sdk/overview

import { CometChat } from "@cometchat/chat-sdk-javascript";

const APP_ID = import.meta.env.VITE_COMETCHAT_APP_ID;       // ← set in .env
const REGION = import.meta.env.VITE_COMETCHAT_REGION;        // ← set in .env
const AUTH_KEY = import.meta.env.VITE_COMETCHAT_AUTH_KEY;    // ← set in .env

let initialized = false;

export async function initCometChat() {
  if (initialized) return;

  const appSetting = new CometChat.AppSettingsBuilder()
    .subscribePresenceForAllUsers()
    .setRegion(REGION)
    .autoEstablishSocketConnection(true)
    .build();

  await CometChat.init(APP_ID, appSetting);
  initialized = true;
  console.log("CometChat initialised ✅");
}

/**
 * Log a user into CometChat using the auth token returned by our backend.
 * We use token-based login (not auth key) so the key is never exposed to clients.
 *
 * @param {string} uid      - CometChat UID (same as our DB user.id)
 * @param {string} authToken - Short-lived token from our /auth/me or /auth/login endpoint
 */
export async function loginCometChat(uid, authToken) {
  try {
    // If already logged in as this user, skip
    const currentUser = await CometChat.getLoggedinUser();
    if (currentUser && currentUser.getUid() === uid) return currentUser;

    // Login with the server-issued auth token
    const user = await CometChat.loginWithAuthToken(authToken);
    console.log("CometChat login success:", user.getUid());
    return user;
  } catch (err) {
    console.error("CometChat login error:", err);
    throw err;
  }
}

export async function logoutCometChat() {
  try {
    await CometChat.logout();
  } catch (_) {
    // ignore
  }
}

export { CometChat, AUTH_KEY };
