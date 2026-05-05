import { cookies } from "next/headers";
import { localeCookieName, normalizeLocale, type Locale } from "./i18n";

export async function getLocale(): Promise<Locale> {
    const cookieStore = await cookies();
    return normalizeLocale(cookieStore.get(localeCookieName)?.value);
}
