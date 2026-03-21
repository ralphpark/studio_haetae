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

export async function deleteMeetEvent(eventId: string): Promise<boolean> {
  try {
    const auth = getAuth();
    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID!,
      eventId,
    });
    return true;
  } catch (error) {
    console.error("Google Calendar delete error:", error);
    return false;
  }
}

export async function getBusySlots(date: string): Promise<string[]> {
  const auth = getAuth();
  const calendar = google.calendar({ version: "v3", auth });

  const timeMin = `${date}T00:00:00+09:00`;
  const timeMax = `${date}T23:59:59+09:00`;

  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: "Asia/Seoul",
      items: [{ id: process.env.GOOGLE_CALENDAR_ID! }],
    },
  });

  const busyPeriods =
    res.data.calendars?.[process.env.GOOGLE_CALENDAR_ID!]?.busy || [];

  const slots = [
    "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00",
  ];

  const busySlots: string[] = [];

  for (const slot of slots) {
    const [h] = slot.split(":");
    const slotStart = new Date(`${date}T${h}:00:00+09:00`);
    const slotEnd = new Date(`${date}T${String(Number(h) + 1).padStart(2, "0")}:00:00+09:00`);

    for (const period of busyPeriods) {
      const busyStart = new Date(period.start!);
      const busyEnd = new Date(period.end!);
      if (slotStart < busyEnd && slotEnd > busyStart) {
        busySlots.push(slot);
        break;
      }
    }
  }

  return busySlots;
}
