import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function GET() {
    const { userId } = auth();

    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Redirect to Clerk's OAuth connection page with the correct scopes
    const redirectUrl = new URL("https://accounts.clerk.dev/oauth/google");
    redirectUrl.searchParams.append("client_id", process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
    redirectUrl.searchParams.append("redirect_uri", `${process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}/oauth-callback`);
    redirectUrl.searchParams.append("response_type", "code");
    redirectUrl.searchParams.append("scope", "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events offline_access");
    redirectUrl.searchParams.append("access_type", "offline");
    redirectUrl.searchParams.append("prompt", "consent");

    return NextResponse.redirect(redirectUrl.toString());
} 