type GoogleGeocodeResponse = {
    status: string;
    error_message?: string;
    results?: Array<{
        formatted_address: string;
        place_id: string;
        partial_match?: boolean;
        geometry: {
            location: {
                lat: number;
                lng: number;
            };
        };
    }>;
};

type GooglePlacesAutocompleteResponse = {
    suggestions?: Array<{
        placePrediction?: {
            placeId: string;
            text?: {
                text: string;
            };
        };
    }>;
};

type GooglePlaceDetailsResponse = {
    id: string;
    formattedAddress: string;
    location: {
        latitude: number;
        longitude: number;
    };
};

export type NormalizedAddress = {
    fullAddress: string;
    googlePlaceId: string;
    latitude: number;
    longitude: number;
};

export type AddressPrediction = {
    placeId: string;
    text: string;
};

function getGoogleMapsApiKey() {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        throw new Error(
            "GOOGLE_MAPS_API_KEY is required to normalize customer addresses."
        );
    }

    return apiKey;
}

function getGoogleMapsRegionCode() {
    return process.env.GOOGLE_MAPS_REGION_CODE || "CA";
}

export async function searchAddressPredictions(
    input: string,
    sessionToken: string
): Promise<AddressPrediction[]> {
    const trimmedInput = input.trim();

    if (trimmedInput.length < 3) {
        return [];
    }

    const response = await fetch(
        "https://places.googleapis.com/v1/places:autocomplete",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": getGoogleMapsApiKey(),
                "X-Goog-FieldMask":
                    "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
            },
            body: JSON.stringify({
                input: trimmedInput,
                sessionToken,
                includedRegionCodes: [getGoogleMapsRegionCode()],
            }),
            cache: "no-store",
        }
    );

    if (!response.ok) {
        throw new Error("Address autocomplete request failed.");
    }

    const data = (await response.json()) as GooglePlacesAutocompleteResponse;

    return (data.suggestions || [])
        .map((suggestion) => suggestion.placePrediction)
        .filter((prediction): prediction is NonNullable<typeof prediction> =>
            Boolean(prediction?.placeId && prediction.text?.text)
        )
        .map((prediction) => ({
            placeId: prediction.placeId,
            text: prediction.text?.text || "",
        }));
}

export async function getAddressByPlaceId(
    placeId: string,
    sessionToken: string
): Promise<NormalizedAddress> {
    const trimmedPlaceId = placeId.trim();

    if (!trimmedPlaceId) {
        throw new Error("Place id is required.");
    }

    const url = new URL(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(
            trimmedPlaceId
        )}`
    );
    url.searchParams.set("sessionToken", sessionToken);

    const response = await fetch(url, {
        headers: {
            "X-Goog-Api-Key": getGoogleMapsApiKey(),
            "X-Goog-FieldMask": "id,formattedAddress,location",
        },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Address details request failed.");
    }

    const data = (await response.json()) as GooglePlaceDetailsResponse;

    if (
        !data.id ||
        !data.formattedAddress ||
        typeof data.location?.latitude !== "number" ||
        typeof data.location?.longitude !== "number"
    ) {
        throw new Error("Selected address is missing required location details.");
    }

    return {
        fullAddress: data.formattedAddress,
        googlePlaceId: data.id,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
    };
}

export async function normalizeAddress(address: string): Promise<NormalizedAddress> {
    const trimmedAddress = address.trim();

    if (!trimmedAddress) {
        throw new Error("Address is required.");
    }

    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", trimmedAddress);
    url.searchParams.set("key", getGoogleMapsApiKey());
    url.searchParams.set("region", getGoogleMapsRegionCode().toLowerCase());

    const response = await fetch(url, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Address normalization request failed.");
    }

    const data = (await response.json()) as GoogleGeocodeResponse;
    const firstResult = data.results?.[0];

    if (data.status !== "OK" || !firstResult || firstResult.partial_match) {
        throw new Error(
            data.error_message || "Address could not be matched precisely."
        );
    }

    return {
        fullAddress: firstResult.formatted_address,
        googlePlaceId: firstResult.place_id,
        latitude: firstResult.geometry.location.lat,
        longitude: firstResult.geometry.location.lng,
    };
}
