"use server";

import { db } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { google } from "googleapis";
import { sendBookingNotification } from "@/lib/mailer";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateAugmentedNoteAndSummary({ answers, linkedinUrl }) {
  let answersText = '';
  if (answers && typeof answers === 'object') {
    answersText = Object.entries(answers).map(([q, a]) => `${q}: ${a}`).join('\n');
  }
  const prompt = `You are an assistant for meeting preparation. Given the following LinkedIn profile URL and answers to custom questions, generate:\n\n1. An "augmented note" (a concise, actionable summary for the meeting host, max 100 words).\n2. A "LinkedIn summary" (a 1-2 sentence summary of the attendee, suitable for a LinkedIn intro, max 50 words).\n\nLinkedIn URL: ${linkedinUrl || 'N/A'}\n\nAnswers:\n${answersText}\n\nFormat:\nAugmented Note: ...\nLinkedIn Summary: ...`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });
    const text = response.text;

    // 解析结果
    let augmentedNote = "", linkedinSummary = "";
    if (text) {
      const noteMatch = text.match(/Augmented Note:(.*?)(?:LinkedIn Summary:|$)/is);
      const summaryMatch = text.match(/LinkedIn Summary:(.*)/is);
      augmentedNote = noteMatch ? noteMatch[1].trim() : "";
      linkedinSummary = summaryMatch ? summaryMatch[1].trim() : "";
    }
    return { augmentedNote, linkedinSummary };
  } catch (error) {
    console.error("Error generating AI notes:", error);
    throw error;
  }
}

export async function createBooking(bookingData) {
  try {
    // Fetch the event and its creator with user information
    const event = await db.event.findUnique({
      where: { id: bookingData.eventId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            clerkUserId: true
          }
        }
      },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    if (!event.user) {
      throw new Error("Event creator not found");
    }

    // Get the event creator's Google OAuth token from Clerk
    const { data } = await clerkClient().users.getUserOauthAccessToken(
      event.user.clerkUserId,
      "oauth_google"
    );

    const token = data[0]?.token;
    const refreshToken = data[0]?.refresh_token;

    if (!token) {
      throw new Error("Event creator has not connected Google Calendar");
    }

    // Set up Google OAuth client
    const oauth2Client = new google.auth.OAuth2();

    // Configure OAuth2 client with both access and refresh tokens
    oauth2Client.setCredentials({
      access_token: token,
      refresh_token: refreshToken
    });

    // Create calendar instance
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    try {
      // Create Google Meet link
      const meetResponse = await calendar.events.insert({
        calendarId: "primary",
        conferenceDataVersion: 1,
        requestBody: {
          summary: `${bookingData.name} - ${event.title}`,
          description: bookingData.additionalInfo,
          start: { dateTime: bookingData.startTime },
          end: { dateTime: bookingData.endTime },
          attendees: [{ email: bookingData.email }, { email: event.user.email }],
          conferenceData: {
            createRequest: { requestId: `${event.id}-${Date.now()}` },
          },
        },
      });

      const meetLink = meetResponse.data.hangoutLink;
      const googleEventId = meetResponse.data.id;

      // Create booking in database
      const booking = await db.booking.create({
        data: {
          eventId: event.id,
          userId: event.userId,
          name: bookingData.name,
          email: bookingData.email,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          additionalInfo: bookingData.additionalInfo,
          meetLink,
          googleEventId,
          linkedinUrl: bookingData.linkedinUrl,
          answers: bookingData.answers,
        },
      });

      // Send email notification
      try {
        await sendBookingNotification(booking, event);
      } catch (emailError) {
        console.error("Failed to send booking notification email:", emailError);
        // Don't throw the error as the booking was successful
      }

      // 生成并保存AI摘要
      try {
        const { augmentedNote, linkedinSummary } = await generateAugmentedNoteAndSummary({
          answers: booking.answers,
          linkedinUrl: booking.linkedinUrl,
        });
        await db.booking.update({
          where: { id: booking.id },
          data: { augmentedNote, linkedinSummary },
        });
      } catch (aiError) {
        console.error("Failed to generate AI notes:", aiError);
      }

      return { success: true, booking, meetLink };
    } catch (error) {
      if (error.code === 401) {
        // Token expired, try to refresh
        try {
          const { tokens } = await oauth2Client.refreshAccessToken();

          // Update the token in Clerk
          await clerkClient().users.updateUserOauthAccessToken(
            event.user.clerkUserId,
            "oauth_google",
            tokens.refresh_token || refreshToken
          );

          // Retry the calendar operation with new token
          oauth2Client.setCredentials(tokens);
          const calendar = google.calendar({ version: "v3", auth: oauth2Client });

          const meetResponse = await calendar.events.insert({
            calendarId: "primary",
            conferenceDataVersion: 1,
            requestBody: {
              summary: `${bookingData.name} - ${event.title}`,
              description: bookingData.additionalInfo,
              start: { dateTime: bookingData.startTime },
              end: { dateTime: bookingData.endTime },
              attendees: [{ email: bookingData.email }, { email: event.user.email }],
              conferenceData: {
                createRequest: { requestId: `${event.id}-${Date.now()}` },
              },
            },
          });

          const meetLink = meetResponse.data.hangoutLink;
          const googleEventId = meetResponse.data.id;

          const booking = await db.booking.create({
            data: {
              eventId: event.id,
              userId: event.userId,
              name: bookingData.name,
              email: bookingData.email,
              startTime: bookingData.startTime,
              endTime: bookingData.endTime,
              additionalInfo: bookingData.additionalInfo,
              meetLink,
              googleEventId,
              linkedinUrl: bookingData.linkedinUrl,
              answers: bookingData.answers,
            },
          });

          // Send email notification
          try {
            await sendBookingNotification(booking, event);
          } catch (emailError) {
            console.error("Failed to send booking notification email:", emailError);
            // Don't throw the error as the booking was successful
          }

          // 生成并保存AI摘要
          try {
            const { augmentedNote, linkedinSummary } = await generateAugmentedNoteAndSummary({
              answers: booking.answers,
              linkedinUrl: booking.linkedinUrl,
            });
            await db.booking.update({
              where: { id: booking.id },
              data: { augmentedNote, linkedinSummary },
            });
          } catch (aiError) {
            console.error("Failed to generate AI notes:", aiError);
          }

          return { success: true, booking, meetLink };
        } catch (refreshError) {
          console.error("Failed to refresh token:", refreshError);
          throw new Error("Failed to refresh Google Calendar access. Please reconnect your Google Calendar.");
        }
      }
      throw error;
    }
  } catch (error) {
    console.error("Error creating booking:", error);
    return { success: false, error: error.message };
  }
}
