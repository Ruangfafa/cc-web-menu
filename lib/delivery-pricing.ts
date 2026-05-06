export const DELIVERY_PRICING_BASE_PLUS_DISTANCE = "BASE_PLUS_DISTANCE";
export const DELIVERY_PRICING_DISTANCE_TIERS = "DISTANCE_TIERS";

export type DeliveryPricingMode =
    | typeof DELIVERY_PRICING_BASE_PLUS_DISTANCE
    | typeof DELIVERY_PRICING_DISTANCE_TIERS;

export type DeliveryDistanceTier = {
    minKm: number;
    maxKm: number | null;
    feeCents: number;
};

export type DeliveryPricingSetting = {
    originLatitude: number | null;
    originLongitude: number | null;
    pricingMode: string;
    baseDeliveryFeeCents: number;
    perKmDeliveryFeeCents: number;
    distanceTiers?: DeliveryDistanceTier[];
};

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
    return (value * Math.PI) / 180;
}

export function calculateDistanceKm(
    fromLatitude: number,
    fromLongitude: number,
    toLatitude: number,
    toLongitude: number
) {
    const latitudeDelta = toRadians(toLatitude - fromLatitude);
    const longitudeDelta = toRadians(toLongitude - fromLongitude);
    const fromLatitudeRadians = toRadians(fromLatitude);
    const toLatitudeRadians = toRadians(toLatitude);

    const a =
        Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
        Math.cos(fromLatitudeRadians) *
            Math.cos(toLatitudeRadians) *
            Math.sin(longitudeDelta / 2) *
            Math.sin(longitudeDelta / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_KM * c;
}

export function calculateDeliveryFeeCents(
    setting: DeliveryPricingSetting,
    destinationLatitude: number,
    destinationLongitude: number
) {
    if (
        typeof setting.originLatitude !== "number" ||
        typeof setting.originLongitude !== "number"
    ) {
        throw new Error("Delivery origin address is not configured.");
    }

    const distanceKm = calculateDistanceKm(
        setting.originLatitude,
        setting.originLongitude,
        destinationLatitude,
        destinationLongitude
    );

    if (setting.pricingMode === DELIVERY_PRICING_DISTANCE_TIERS) {
        const tier = (setting.distanceTiers || [])
            .slice()
            .sort((a, b) => a.minKm - b.minKm)
            .find((item) => {
                return (
                    distanceKm >= item.minKm &&
                    (item.maxKm === null || distanceKm < item.maxKm)
                );
            });

        if (!tier) {
            throw new Error("No delivery price tier matches this address.");
        }

        return {
            distanceKm,
            feeCents: tier.feeCents,
        };
    }

    return {
        distanceKm,
        feeCents:
            setting.baseDeliveryFeeCents +
            Math.ceil(distanceKm * setting.perKmDeliveryFeeCents),
    };
}
