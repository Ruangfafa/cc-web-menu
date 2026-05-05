"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
    localeCookieName,
    localeLabels,
    locales,
    normalizeLocale,
    type Locale,
} from "@/lib/i18n";

export function LanguageSwitcher() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [locale, setLocale] = useState<Locale>("en");

    useEffect(() => {
        const cookieLocale = document.cookie
            .split("; ")
            .find((item) => item.startsWith(`${localeCookieName}=`))
            ?.split("=")[1];

        setLocale(normalizeLocale(cookieLocale));
    }, []);

    function handleChange(nextLocale: Locale) {
        const normalizedLocale = normalizeLocale(nextLocale);

        document.cookie = `${localeCookieName}=${normalizedLocale}; path=/; max-age=31536000; SameSite=Lax`;
        setLocale(normalizedLocale);
        startTransition(() => {
            router.refresh();
        });
    }

    return (
        <div
            aria-label={locale === "zh" ? "语言" : "Language"}
            className="language-switcher"
        >
            {locales.map((item) => {
                const selected = item === locale;

                return (
                    <button
                        key={item}
                        type="button"
                        onClick={() => handleChange(item)}
                        disabled={isPending}
                        aria-pressed={selected}
                        className="language-switcher-button"
                    >
                        {localeLabels[item]}
                    </button>
                );
            })}
        </div>
    );
}
