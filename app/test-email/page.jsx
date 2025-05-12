"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TestEmailPage() {
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const testEmail = async () => {
        setLoading(true);
        setStatus("Testing email configuration...");
        try {
            const response = await fetch("/api/test-email");
            const data = await response.json();
            setStatus(data.message);
        } catch (error) {
            setStatus("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">Email Configuration Test</h1>
            <Button
                onClick={testEmail}
                disabled={loading}
                className="mb-4"
            >
                {loading ? "Testing..." : "Test Email Configuration"}
            </Button>
            {status && (
                <div className={`p-4 rounded ${status.includes("valid")
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                    {status}
                </div>
            )}
        </div>
    );
} 