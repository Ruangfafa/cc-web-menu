"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AddressPrediction = {
    placeId: string;
    text: string;
};

type AddressAutocompleteInputProps = {
    id: string;
    name?: string;
    defaultValue?: string;
    required?: boolean;
    rows?: number;
    placeholder?: string;
};

function createSessionToken() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;
}

export function AddressAutocompleteInput({
    id,
    name = "fullAddress",
    defaultValue = "",
    required = false,
    rows = 4,
    placeholder,
}: AddressAutocompleteInputProps) {
    const [value, setValue] = useState(defaultValue);
    const [selectedPlaceId, setSelectedPlaceId] = useState("");
    const [predictions, setPredictions] = useState<AddressPrediction[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const sessionTokenRef = useRef(createSessionToken());
    const requestIdRef = useRef(0);
    const listId = useMemo(() => `${id}-suggestions`, [id]);

    useEffect(() => {
        setSelectedPlaceId("");

        if (value.trim().length < 3) {
            setPredictions([]);
            setOpen(false);
            return;
        }

        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;
        const timeoutId = window.setTimeout(async () => {
            setLoading(true);

            try {
                const response = await fetch("/api/addresses/autocomplete", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        input: value,
                        sessionToken: sessionTokenRef.current,
                    }),
                });

                if (!response.ok || requestId !== requestIdRef.current) {
                    return;
                }

                const data = (await response.json()) as {
                    predictions?: AddressPrediction[];
                };

                setPredictions(data.predictions || []);
                setOpen(Boolean(data.predictions?.length));
            } finally {
                if (requestId === requestIdRef.current) {
                    setLoading(false);
                }
            }
        }, 250);

        return () => window.clearTimeout(timeoutId);
    }, [value]);

    function handleSelect(prediction: AddressPrediction) {
        setValue(prediction.text);
        setSelectedPlaceId(prediction.placeId);
        setPredictions([]);
        setOpen(false);
    }

    return (
        <div className="address-autocomplete">
            <textarea
                aria-autocomplete="list"
                aria-controls={listId}
                aria-expanded={open}
                autoComplete="off"
                id={id}
                name={name}
                onBlur={() => {
                    window.setTimeout(() => setOpen(false), 150);
                }}
                onChange={(event) => setValue(event.target.value)}
                onFocus={() => setOpen(predictions.length > 0)}
                placeholder={placeholder}
                required={required}
                rows={rows}
                style={{
                    display: "block",
                    width: "100%",
                    padding: 8,
                    marginTop: 4,
                    resize: "vertical",
                }}
                value={value}
            />

            <input name="googlePlaceId" type="hidden" value={selectedPlaceId} />
            <input
                name="googlePlacesSessionToken"
                type="hidden"
                value={sessionTokenRef.current}
            />

            {open && (
                <div className="address-autocomplete-list" id={listId}>
                    {predictions.map((prediction) => (
                        <button
                            className="address-autocomplete-option"
                            key={prediction.placeId}
                            onMouseDown={(event) => {
                                event.preventDefault();
                                handleSelect(prediction);
                            }}
                            type="button"
                        >
                            {prediction.text}
                        </button>
                    ))}
                    <div className="address-autocomplete-powered">
                        {loading ? "Searching..." : "Powered by Google"}
                    </div>
                </div>
            )}
        </div>
    );
}
