// server/cometchat.js
// CometChat REST API wrapper
// Docs: https://www.cometchat.com/docs/rest-api

const axios = require("axios");

const APP_ID = process.env.COMETCHAT_APP_ID;
const REGION = process.env.COMETCHAT_REGION;
const API_KEY = process.env.COMETCHAT_API_KEY;

// Base URL for CometChat v3 REST API
const BASE_URL = `https://${APP_ID}.api-${REGION}.cometchat.io/v3`;

const headers = {
  "Content-Type": "application/json",
  appId: APP_ID,
  apiKey: API_KEY,
};

const cometchat = {
  /**
   * Create a new user in CometChat.
   * Called during registration so the user can later log in via the SDK.
   */
  async createUser(uid, name, avatar = null) {
    const payload = { uid, name };
    if (avatar) payload.avatar = avatar;

    const res = await axios.post(`${BASE_URL}/users`, payload, { headers });
    return res.data;
  },

  /**
   * Generate an auth token for a user (used for SDK login on the frontend).
   * This token is short-lived and should be fetched fresh each session.
   */
  async generateAuthToken(uid) {
    const res = await axios.post(
      `${BASE_URL}/users/${uid}/auth_tokens`,
      {},
      { headers }
    );
    return res.data.data.authToken;
  },

  /**
   * Send a direct message from one user to another via the REST API.
   * Used for system/automated messages if needed.
   */
  async sendMessage(senderId, receiverId, text) {
    const res = await axios.post(
      `${BASE_URL}/messages`,
      {
        category: "message",
        type: "text",
        data: { text },
        receiver: receiverId,
        receiverType: "user",
      },
      {
        headers: {
          ...headers,
          onBehalfOf: senderId,
        },
      }
    );
    return res.data;
  },

  /**
   * Block a user — prevents them from messaging even if CometChat doesn't know
   * about the friendship. Used as a secondary guard when a friendship is removed.
   */
  async blockUser(requestingUid, targetUid) {
    const res = await axios.post(
      `${BASE_URL}/users/${requestingUid}/blockedusers`,
      { blockedUids: [targetUid] },
      { headers }
    );
    return res.data;
  },

  /**
   * Unblock a user after they become friends.
   */
  async unblockUser(requestingUid, targetUid) {
    const res = await axios.delete(
      `${BASE_URL}/users/${requestingUid}/blockedusers`,
      {
        headers,
        data: { blockedUids: [targetUid] },
      }
    );
    return res.data;
  },

  /**
   * Fetch all users (useful for admin checks).
   */
  async getUsers() {
    const res = await axios.get(`${BASE_URL}/users`, { headers });
    return res.data;
  },
};

module.exports = cometchat;
