"use client";

type ConfirmDeleteButtonProps = {
    itemName: string;
};

export function ConfirmDeleteButton({ itemName }: ConfirmDeleteButtonProps) {
    return (
        <button
            type="submit"
            onClick={(event) => {
                const confirmed = window.confirm(`Delete "${itemName}"?`);

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
