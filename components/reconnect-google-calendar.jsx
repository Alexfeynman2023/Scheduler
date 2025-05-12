"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export default function ReconnectGoogleCalendar() {
    const [isLoading, setIsLoading] = useState(false);

    const handleReconnect = async () => {
        setIsLoading(true);
        try {
            // Redirect to Clerk's OAuth connection page
            window.location.href = "/api/auth/oauth/google/connect";
        } catch (error) {
            console.error("Error reconnecting Google Calendar:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Google Calendar Connection Required</AlertTitle>
            <AlertDescription className="mt-2">
                Your Google Calendar connection needs to be refreshed. This is required to ensure proper calendar integration.
                <div className="mt-4">
                    <Button
                        onClick={handleReconnect}
                        disabled={isLoading}
                        variant="destructive"
                    >
                        {isLoading ? "Connecting..." : "Reconnect Google Calendar"}
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    );
} 