import { google } from "googleapis";

function getAuth() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return oauth2Client;
}

export async function createMeetEvent({
  date,
  time,
  title,
  description,
}: {
  date: string;
  time: string;
  title: string;
  description?: string;
}) {
  const auth = getAuth();
  const calendar = google.calendar({ version: "v3", auth });

  const [h, m] = time.split(":");
  const startDateTime = `${date}T${h}:${m}:00+09:00`;
  const endH = String(Number(h) + 1).padStart(2, "0");
  const endDateTime = `${date}T${endH}:${m}:00+09:00`;

  const event = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    requestBody: {
      summary: title,
      description: description || "",
      start: { dateTime: startDateTime, timeZone: "Asia/Seoul" },
      end: { dateTime: endDateTime, timeZone: "Asia/Seoul" },
      conferenceData: {
        createRequest: {
          requestId: `haetae-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
    conferenceDataVersion: 1,
  });

  return {
    meetLink: event.data.hangoutLink || null,
    eventId: event.data.id || null,
  };
}
