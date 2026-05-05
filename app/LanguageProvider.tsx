"use client";

import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { createTranslator, localeCookieName, normalizeLocale, type Locale } from "@/lib/i18n";

type LanguageContextValue = {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: ReturnType<typeof createTranslator>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
    initialLocale,
    children,
}: {
    initialLocale: Locale;
    children: ReactNode;
}) {
    const [locale, setLocaleState] = useState(initialLocale);

    useEffect(() => {
        document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    }, [locale]);

    const value = useMemo<LanguageContextValue>(() => {
        return {
            locale,
            setLocale(nextLocale) {
                const normalizedLocale = normalizeLocale(nextLocale);
                document.cookie = `${localeCookieName}=${normalizedLocale}; path=/; max-age=31536000; SameSite=Lax`;
                setLocaleState(normalizedLocale);
            },
            t: createTranslator(locale),
        };
    }, [locale]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    const [fallbackLocale, setFallbackLocale] = useState<Locale>("en");

    useEffect(() => {
        const cookieLocale = document.cookie
            .split("; ")
            .find((item) => item.startsWith(`${localeCookieName}=`))
            ?.split("=")[1];

        setFallbackLocale(normalizeLocale(cookieLocale));
    }, []);

    const fallbackContext = useMemo<LanguageContextValue>(() => {
        return {
            locale: fallbackLocale,
            setLocale(nextLocale) {
                const normalizedLocale = normalizeLocale(nextLocale);
                document.cookie = `${localeCookieName}=${normalizedLocale}; path=/; max-age=31536000; SameSite=Lax`;
                setFallbackLocale(normalizedLocale);
            },
            t: createTranslator(fallbackLocale),
        };
    }, [fallbackLocale]);

    return context || fallbackContext;
}
