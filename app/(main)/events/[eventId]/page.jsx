"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import ReconnectGoogleCalendar from "@/components/reconnect-google-calendar";

// ... existing imports ...

export default function EventPage({ params }) {
    const { user, isLoaded } = useUser();
    const [showReconnectAlert, setShowReconnectAlert] = useState(false);

    // ... existing code ...

    useEffect(() => {
        if (error?.includes("Failed to refresh Google Calendar access")) {
            setShowReconnectAlert(true);
        }
    }, [error]);

    return (
        <div className="container mx-auto px-4 py-8">
            {showReconnectAlert && <ReconnectGoogleCalendar />}
            {/* ... rest of your existing JSX ... */}
        </div>
    );
} 