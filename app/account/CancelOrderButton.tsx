"use client";

export function CancelOrderButton() {
    return (
        <button
            type="submit"
            onClick={(event) => {
                const confirmed = window.confirm("Cancel this order?");

                if (!confirmed) {
                    event.preventDefault();
                }
            }}
            style={{
                borderColor: "#b00020",
                color: "#b00020",
            }}
        >
            Cancel Order
        </button>
    );
}
