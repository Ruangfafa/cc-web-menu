"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "../LanguageProvider";

export default function ForgotPasswordPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [sendingCode, setSendingCode] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [codeSent, setCodeSent] = useState(false);

    async function handleSendCode() {
        setError("");
        setMessage("");
        setSendingCode(true);

        try {
            const response = await fetch("/api/password-reset/send-code", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });
            const result = await response.json();

            if (!response.ok) {
                setError(result.error || t("verificationCodeSendFailed"));
                return;
            }

            setCodeSent(true);
            setMessage(t("passwordResetCodeSent"));
        } catch {
            setError(t("somethingWentWrong"));
        } finally {
            setSendingCode(false);
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            const response = await fetch("/api/password-reset", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    verificationCode,
                    password,
                }),
            });
            const result = await response.json();

            if (!response.ok) {
                setError(result.error || t("passwordResetFailed"));
                return;
            }

            router.push("/login");
        } catch {
            setError(t("somethingWentWrong"));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="auth-shell">
            <h1>{t("forgotPassword")}</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">{t("email")}</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => {
                            setEmail(event.target.value);
                            setCodeSent(false);
                            setVerificationCode("");
                            setMessage("");
                        }}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="verificationCode">
                        {t("verificationCode")}
                    </label>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(0, 1fr) auto",
                            gap: 8,
                            alignItems: "end",
                        }}
                    >
                        <input
                            id="verificationCode"
                            type="text"
                            inputMode="numeric"
                            value={verificationCode}
                            onChange={(event) =>
                                setVerificationCode(event.target.value)
                            }
                            required
                            minLength={6}
                            maxLength={6}
                        />
                        <button
                            type="button"
                            onClick={handleSendCode}
                            disabled={sendingCode || !email}
                        >
                            {sendingCode
                                ? t("sendingVerificationCode")
                                : t("sendVerificationCode")}
                        </button>
                    </div>
                    <p style={{ color: "#666", margin: "8px 0 0" }}>
                        {t("verificationCodeSpamHint")}
                    </p>
                </div>

                <div>
                    <label htmlFor="password">{t("newPassword")}</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        minLength={8}
                    />
                </div>

                {error && <p style={{ color: "red" }}>{error}</p>}
                {message && <p style={{ color: "#0a6b2d" }}>{message}</p>}

                <button type="submit" disabled={submitting || !codeSent}>
                    {submitting ? t("resettingPassword") : t("resetPassword")}
                </button>
            </form>

            <p>
                <Link href="/login">{t("backToLogin")}</Link>
            </p>
        </main>
    );
}
