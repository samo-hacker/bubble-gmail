import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    // Create OAuth2 client with environment variables
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    // Set refresh token from environment variables
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Fetch Gmail messages in Promotions category (common for subscriptions)
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
      const unsubscribe = headers.find(h => h.name.toLowerCase() === "list-unsubscribe")?.value || null;

      // Only include emails with unsubscribe header
      if (unsubscribe) {
        emails.push({ subject, from, unsubscribe });
      }
    }

    // Return JSON response
    res.status(200).json(emails);
  } catch (err) {
    console.error("Error fetching emails:", err);
    res.status(500).json({ error: "Failed to fetch subscription emails" });
  }
}
