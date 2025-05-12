"use server";

import { db } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { google } from "googleapis";

export async function getUserMeetings(type = "upcoming") {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const now = new Date();

  const meetings = await db.booking.findMany({
    where: {
      userId: user.id,
      startTime: type === "upcoming" ? { gte: now } : { lt: now },
    },
    include: {
      event: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      startTime: type === "upcoming" ? "asc" : "desc",
    },
  });

  return meetings;
}

export async function cancelMeeting(meetingId) {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const meeting = await db.booking.findUnique({
    where: { id: meetingId },
    include: { event: true, user: true },
  });

  if (!meeting || meeting.userId !== user.id) {
    throw new Error("Meeting not found or unauthorized");
  }

  // Cancel the meeting in Google Calendar
  const { data } = await clerkClient.users.getUserOauthAccessToken(
    meeting.user.clerkUserId,
    "oauth_google"
  );

  const token = data[0]?.token;
  const refreshToken = data[0]?.refresh_token;

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: token,
    refresh_token: refreshToken
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    await calendar.events.delete({
      calendarId: "primary",
      eventId: meeting.googleEventId,
    });
  } catch (error) {
    if (error.code === 401) {
      // Token expired, try to refresh
      try {
        const { tokens } = await oauth2Client.refreshAccessToken();

        // Update the token in Clerk
        await clerkClient.users.updateUserOauthAccessToken(
          meeting.user.clerkUserId,
          "oauth_google",
          tokens.refresh_token || refreshToken
        );

        // Retry the calendar operation with new token
        oauth2Client.setCredentials(tokens);
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        await calendar.events.delete({
          calendarId: "primary",
          eventId: meeting.googleEventId,
        });
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        throw new Error("Failed to refresh Google Calendar access. Please reconnect your Google Calendar.");
      }
    } else {
      console.error("Failed to delete event from Google Calendar:", error);
    }
  }

  // Delete the meeting from the database
  await db.booking.delete({
    where: { id: meetingId },
  });

  return { success: true };
}

export async function getMeetingDetails(meetingId) {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) {
    throw new Error("User not found");
  }
  const meeting = await db.booking.findUnique({
    where: { id: meetingId },
    select: {
      id: true,
      eventId: true,
      userId: true,
      name: true,
      email: true,
      startTime: true,
      endTime: true,
      additionalInfo: true,
      meetLink: true,
      linkedinUrl: true,
      answers: true,
      augmentedNote: true,
      linkedinSummary: true,
      event: {
        select: {
          id: true,
          title: true,
          description: true,
          duration: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
  if (!meeting || meeting.userId !== user.id) {
    throw new Error("Meeting not found or unauthorized");
  }
  return meeting;
}
