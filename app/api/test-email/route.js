import { testEmailConfig } from "@/lib/mailer";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const isValid = await testEmailConfig();
        if (isValid) {
            return NextResponse.json({
                success: true,
                message: "Email configuration is valid"
            });
        } else {
            return NextResponse.json({
                success: false,
                message: "Email configuration is invalid"
            }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
} 