import crypto from "crypto";

export const REGISTER_EMAIL_CODE_PURPOSE = "register";
export const PASSWORD_RESET_EMAIL_CODE_PURPOSE = "password-reset";

export function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

export function createVerificationCode() {
    return String(crypto.randomInt(100000, 1000000));
}

export function hashVerificationCode(email: string, code: string) {
    const secret = process.env.AUTH_SECRET || "cc-web-menu";

    return crypto
        .createHash("sha256")
        .update(`${normalizeEmail(email)}:${code}:${secret}`)
        .digest("hex");
}

export function createVerificationExpiry() {
    return new Date(Date.now() + 10 * 60 * 1000);
}
