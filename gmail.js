import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    // Replace this with your stored OAuth tokens
    const tokens = YOUR_STORED_TOKENS; // Example: from database or in-memory

    if (!tokens) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Fetch emails in Promotions category (common for subscriptions)
    const result = await gmail.users.messages.list({
      userId: "me",
      maxResults: 100,
      q: "category:promotions"
    });

    const messages = result.data.messages || [];
    const emails = [];

    for (const msg of messages) {
      const msgData = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "metadata",
        metadataHeaders: ["Subject", "From", "List-Unsubscribe"]
      });

      const headers = msgData.data.payload.headers || [];
      const subject = headers.find(h => h.name === "Subject")?.value || "(No subject)";
      const from = headers.find(h => h.name === "From")?.value || "(Unknown sender)";

      // Only include if List-Unsubscribe header exists
      const unsubscribe = headers.find(h => h.name.toLowerCase() === "list-unsubscribe")?.value || null;
      if (unsubscribe) {
        emails.push({ subject, from, unsubscribe });
      }
    }

    res.status(200).json(emails);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch subscription emails" });
  }
}
s