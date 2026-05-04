"use client";

type DeleteSiteAddressButtonProps = {
    siteAddressName: string;
};

export function DeleteSiteAddressButton({
    siteAddressName,
}: DeleteSiteAddressButtonProps) {
    return (
        <button
            type="submit"
            onClick={(event) => {
                const confirmed = window.confirm(
                    `Delete site address "${siteAddressName}"?`
                );

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
