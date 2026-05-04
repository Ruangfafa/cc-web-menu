"use client";

export function DeleteAddressButton() {
    return (
        <button
            type="submit"
            onClick={(event) => {
                const confirmed = window.confirm("Delete this address?");

                if (!confirmed) {
                    event.preventDefault();
                }
            }}
            style={{
                borderColor: "#b00020",
                color: "#b00020",
            }}
        >
            Delete
        </button>
    );
}
