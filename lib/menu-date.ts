export function toDateKey(date: Date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function todayDateKey() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function toLocalDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return null;
    }

    const date = new Date(
        Date.UTC(
            Number(dateKey.slice(0, 4)),
            Number(dateKey.slice(5, 7)) - 1,
            Number(dateKey.slice(8, 10))
        )
    );

    if (Number.isNaN(date.getTime()) || toDateKey(date) !== dateKey) {
        return null;
    }

    return date;
}

export function formatMenuDate(dateKey: string) {
    const date = parseDateKey(dateKey);

    if (!date) {
        return dateKey;
    }

    return date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    });
}

export function buildLocalDateTimeFromDateKey(
    dateKey: string,
    hour: string,
    minute: string
) {
    const date = parseDateKey(dateKey);

    if (!date) {
        return null;
    }

    return new Date(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        Number(hour),
        Number(minute)
    );
}
