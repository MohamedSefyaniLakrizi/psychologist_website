import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

// Initialize Google Calendar client with OAuth2
const getCalendarClient = (accessToken: string) => {
  const auth = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  auth.setCredentials({
    access_token: accessToken,
  });

  return google.calendar({ version: "v3", auth });
};

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  status: string;
}

export interface CreateEventData {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  clientEmail: string;
  clientName: string;
  timeZone?: string;
}

export interface UpdateEventData extends CreateEventData {
  eventId: string;
}

export class GoogleCalendarService {
  private calendar;
  private calendarId: string;

  constructor(accessToken: string) {
    this.calendar = getCalendarClient(accessToken);
    this.calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
  }

  async createEvent(eventData: CreateEventData): Promise<CalendarEvent> {
    const {
      summary,
      description,
      startDateTime,
      endDateTime,
      clientEmail,
      clientName,
      timeZone = "Europe/Paris",
    } = eventData;

    const event = {
      summary,
      description,
      start: {
        dateTime: startDateTime,
        timeZone,
      },
      end: {
        dateTime: endDateTime,
        timeZone,
      },
      attendees: [
        {
          email: clientEmail,
          displayName: clientName,
        },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 24 hours before
          { method: "popup", minutes: 30 }, // 30 minutes before
        ],
      },
    };

    try {
      const response = await this.calendar.events.insert({
        calendarId: this.calendarId,
        requestBody: event,
        sendUpdates: "all", // Send email invitations
      });

      return response.data as CalendarEvent;
    } catch (error) {
      console.error("Error creating calendar event:", error);
      throw new Error("Failed to create calendar event");
    }
  }

  async updateEvent(eventData: UpdateEventData): Promise<CalendarEvent> {
    const {
      eventId,
      summary,
      description,
      startDateTime,
      endDateTime,
      clientEmail,
      clientName,
      timeZone = "Europe/Paris",
    } = eventData;

    const event = {
      summary,
      description,
      start: {
        dateTime: startDateTime,
        timeZone,
      },
      end: {
        dateTime: endDateTime,
        timeZone,
      },
      attendees: [
        {
          email: clientEmail,
          displayName: clientName,
        },
      ],
    };

    try {
      const response = await this.calendar.events.update({
        calendarId: this.calendarId,
        eventId,
        requestBody: event,
        sendUpdates: "all", // Send email updates
      });

      return response.data as CalendarEvent;
    } catch (error) {
      console.error("Error updating calendar event:", error);
      throw new Error("Failed to update calendar event");
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: this.calendarId,
        eventId,
        sendUpdates: "all", // Send cancellation emails
      });
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      throw new Error("Failed to delete calendar event");
    }
  }

  async getEvents(
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 50
  ): Promise<CalendarEvent[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: timeMin || new Date().toISOString(),
        timeMax,
        maxResults,
        singleEvents: true,
        orderBy: "startTime",
      });

      return (response.data.items as CalendarEvent[]) || [];
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      throw new Error("Failed to fetch calendar events");
    }
  }

  async getEvent(eventId: string): Promise<CalendarEvent> {
    try {
      const response = await this.calendar.events.get({
        calendarId: this.calendarId,
        eventId,
      });

      return response.data as CalendarEvent;
    } catch (error) {
      console.error("Error fetching calendar event:", error);
      throw new Error("Failed to fetch calendar event");
    }
  }

  // Helper method to calculate end time (1 hour after start by default)
  static calculateEndTime(
    startDateTime: string,
    durationMinutes: number = 60
  ): string {
    const startDate = new Date(startDateTime);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return endDate.toISOString();
  }

  // Helper method to format date and time for calendar
  static formatDateTime(date: string, time: string): string {
    const dateTimeString = `${date}T${time}:00`;
    const dateTime = new Date(dateTimeString);
    return dateTime.toISOString();
  }
}
