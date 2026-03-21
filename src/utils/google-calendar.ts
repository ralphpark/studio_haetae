import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: SCOPES,
  });
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
