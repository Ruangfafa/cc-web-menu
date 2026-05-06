import { searchAddressPredictions } from "@/lib/address-normalization";
import { NextResponse } from "next/server";

type AddressAutocompleteRequest = {
    input?: string;
    sessionToken?: string;
};

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as AddressAutocompleteRequest;
        const input = String(body.input || "");
        const sessionToken = String(body.sessionToken || "").trim();

        if (!sessionToken) {
            return NextResponse.json(
                { error: "Session token is required." },
                { status: 400 }
            );
        }

        const predictions = await searchAddressPredictions(input, sessionToken);

        return NextResponse.json({ predictions });
    } catch (error) {
        console.error("Address autocomplete error:", error);

        return NextResponse.json(
            { error: "Failed to search addresses." },
            { status: 500 }
        );
    }
}
