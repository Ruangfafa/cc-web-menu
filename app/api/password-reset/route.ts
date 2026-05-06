import {
    hashVerificationCode,
    normalizeEmail,
    PASSWORD_RESET_EMAIL_CODE_PURPOSE,
} from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

type PasswordResetRequest = {
    email?: string;
    verificationCode?: string;
    password?: string;
};

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as PasswordResetRequest;
        const email = normalizeEmail(String(body.email || ""));
        const verificationCode = String(body.verificationCode || "").trim();
        const password = String(body.password || "");

        if (!email || !email.includes("@")) {
            return NextResponse.json(
                { error: "Invalid email address." },
                { status: 400 }
            );
        }

        if (!verificationCode) {
            return NextResponse.json(
                { error: "Verification code is required." },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters." },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid or expired verification code." },
                { status: 400 }
            );
        }

        const verificationRecords = await prisma.$queryRaw<
            Array<{ id: number; codeHash: string }>
        >`
            SELECT id, code_hash AS codeHash
            FROM email_verification_codes
            WHERE email = ${email}
              AND purpose = ${PASSWORD_RESET_EMAIL_CODE_PURPOSE}
              AND used_at IS NULL
              AND expires_at > ${new Date()}
            ORDER BY created_at DESC
            LIMIT 1
        `;
        const verificationRecord = verificationRecords[0];

        if (
            !verificationRecord ||
            verificationRecord.codeHash !==
                hashVerificationCode(email, verificationCode)
        ) {
            return NextResponse.json(
                { error: "Invalid or expired verification code." },
                { status: 400 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await prisma.$transaction([
            prisma.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    passwordHash,
                },
            }),
            prisma.$executeRaw`
                UPDATE email_verification_codes
                SET used_at = ${new Date()}
                WHERE id = ${verificationRecord.id}
            `,
        ]);

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error("Password reset error:", error);

        return NextResponse.json(
            { error: "Failed to reset password." },
            { status: 500 }
        );
    }
}
