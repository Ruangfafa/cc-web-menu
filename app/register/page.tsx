"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../LanguageProvider";

export default function RegisterPage() {
    const { t } = useLanguage();
    const router = useRouter();

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    phone,
                    email,
                    password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || t("registerFailed"));
                return;
            }

            router.push("/login");
        } catch (err) {
            setError(t("somethingWentWrong"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <main style={{ maxWidth: 400, margin: "80px auto" }}>
            <h1>{t("register")}</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>{t("name")}</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label>{t("phone")}</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label>{t("email")}</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label>{t("password")}</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                    />
                </div>

                {error && (
                    <p style={{ color: "red" }}>
                        {error}
                    </p>
                )}

                <button type="submit" disabled={loading}>
                    {loading ? t("registering") : t("register")}
                </button>
            </form>
        </main>
    );
}
