import {
    createVerificationCode,
    createVerificationExpiry,
    hashVerificationCode,
    normalizeEmail,
    REGISTER_EMAIL_CODE_PURPOSE,
} from "@/lib/email-verification";
import { sendMail } from "@/lib/smtp-mail";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type SendRegisterCodeRequest = {
    email?: string;
};

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as SendRegisterCodeRequest;
        const email = normalizeEmail(String(body.email || ""));

        if (!email || !email.includes("@")) {
            return NextResponse.json(
                { error: "Invalid email address." },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Email is already registered." },
                { status: 409 }
            );
        }

        const recentCodeRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(*) AS count
            FROM email_verification_codes
            WHERE email = ${email}
              AND purpose = ${REGISTER_EMAIL_CODE_PURPOSE}
              AND created_at >= ${new Date(Date.now() - 60 * 1000)}
        `;
        const recentCodeCount = Number(recentCodeRows[0]?.count || 0);

        if (recentCodeCount > 0) {
            return NextResponse.json(
                { error: "Please wait before requesting another code." },
                { status: 429 }
            );
        }

        const code = createVerificationCode();

        await prisma.$executeRaw`
            INSERT INTO email_verification_codes
                (email, purpose, code_hash, expires_at)
            VALUES
                (${email}, ${REGISTER_EMAIL_CODE_PURPOSE}, ${hashVerificationCode(
                    email,
                    code
                )}, ${createVerificationExpiry()})
        `;

        await sendMail({
            to: email,
            subject: "C&C Web Menu registration code",
            text: `Your C&C Web Menu registration code is ${code}. It expires in 10 minutes.`,
        });

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error("Send register verification code error:", error);

        return NextResponse.json(
            { error: "Failed to send verification code." },
            { status: 500 }
        );
    }
}
