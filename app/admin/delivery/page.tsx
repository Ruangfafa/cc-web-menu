import { auth } from "@/auth";
import { DeliveryAddressMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
    createSiteAddress,
    deleteSiteAddress,
    updateDeliveryMode,
    updatePickupTimeRequirement,
    updateSiteAddress,
} from "./actions";
import { DeleteSiteAddressButton } from "./DeleteSiteAddressButton";

/**
 * 配送地址模式管理页
 *
 * 路径：
 * GET /admin/delivery
 *
 * 功能：
 * 1. 切换全站配送地址模式
 * 2. 管理站点地址集合
 * 3. 让 checkout 根据后台配置切换地址选择逻辑
 */
export default async function AdminDeliveryPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if ((session.user as { role?: string }).role !== "ADMIN") {
        redirect("/menu");
    }

    const deliverySetting = await prisma.deliverySetting.findUnique({
        where: {
            id: 1,
        },
    });
    const siteAddresses = await prisma.siteAddress.findMany({
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    const currentMode =
        deliverySetting?.mode || DeliveryAddressMode.SELF_ADDRESS;
    const requirePickupTime = deliverySetting?.requirePickupTime || false;

    return (
        <main style={{ maxWidth: 1100, margin: "60px auto", padding: 24 }}>
            <header style={{ marginBottom: 24 }}>
                <p style={{ margin: "0 0 12px" }}>
                    <Link href="/admin">Back to admin</Link>
                </p>

                <h1 style={{ margin: "0 0 8px" }}>Settings</h1>

                <p style={{ color: "#666", margin: 0 }}>
                    Switch between customer-owned addresses and site address
                    selection, and control checkout requirements.
                </p>
            </header>

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 20,
                    background: "#fff",
                    marginBottom: 24,
                }}
            >
                <h2 style={{ marginTop: 0 }}>Delivery Mode</h2>

                <form action={updateDeliveryMode}>
                    <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
                        <label>
                            <input
                                type="radio"
                                name="mode"
                                value={DeliveryAddressMode.SELF_ADDRESS}
                                defaultChecked={
                                    currentMode === DeliveryAddressMode.SELF_ADDRESS
                                }
                            />{" "}
                            Self Address
                        </label>

                        <p style={{ margin: 0, color: "#666" }}>
                            Customer uses their own saved address, or guest fills
                            address manually.
                        </p>

                        <label>
                            <input
                                type="radio"
                                name="mode"
                                value={DeliveryAddressMode.SITE_ADDRESS}
                                defaultChecked={
                                    currentMode === DeliveryAddressMode.SITE_ADDRESS
                                }
                            />{" "}
                            Site Address
                        </label>

                        <p style={{ margin: 0, color: "#666" }}>
                            Customer can only choose from admin-managed site
                            addresses.
                        </p>
                    </div>

                    <button type="submit">Save Delivery Mode</button>
                </form>
            </section>

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 20,
                    background: "#fff",
                    marginBottom: 24,
                }}
            >
                <h2 style={{ marginTop: 0 }}>Pickup Time</h2>

                <form action={updatePickupTimeRequirement}>
                    <label>
                        <input
                            type="checkbox"
                            name="requirePickupTime"
                            defaultChecked={requirePickupTime}
                        />{" "}
                        Require pickup time at checkout
                    </label>

                    <p style={{ color: "#666" }}>
                        When enabled, customers must select a pickup date, hour,
                        and minute before placing an order.
                    </p>

                    <button type="submit">Save Pickup Time Setting</button>
                </form>
            </section>

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 20,
                    background: "#fff",
                    marginBottom: 24,
                }}
            >
                <h2 style={{ marginTop: 0 }}>Add Site Address</h2>

                <form action={createSiteAddress}>
                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="name">Name</label>
                        <input
                            id="name"
                            name="name"
                            required
                            style={{
                                display: "block",
                                width: "100%",
                                padding: 8,
                                marginTop: 4,
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="fullAddress">Full Address</label>
                        <textarea
                            id="fullAddress"
                            name="fullAddress"
                            required
                            rows={3}
                            style={{
                                display: "block",
                                width: "100%",
                                padding: 8,
                                marginTop: 4,
                                resize: "vertical",
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="sortOrder">Sort Order</label>
                        <input
                            id="sortOrder"
                            name="sortOrder"
                            type="number"
                            defaultValue={0}
                            required
                            style={{
                                display: "block",
                                width: "100%",
                                padding: 8,
                                marginTop: 4,
                            }}
                        />
                    </div>

                    <label>
                        <input type="checkbox" name="isActive" defaultChecked /> Active
                    </label>

                    <div style={{ marginTop: 16 }}>
                        <button type="submit">Create Site Address</button>
                    </div>
                </form>
            </section>

            <section>
                <h2>Current Site Addresses</h2>

                {siteAddresses.length === 0 ? (
                    <p style={{ color: "#666" }}>No site addresses found.</p>
                ) : (
                    <div style={{ display: "grid", gap: 16 }}>
                        {siteAddresses.map((siteAddress) => (
                            <article
                                key={siteAddress.id}
                                style={{
                                    border: "1px solid #ddd",
                                    borderRadius: 10,
                                    padding: 16,
                                    background: "#fff",
                                }}
                            >
                                <form action={updateSiteAddress}>
                                    <input
                                        type="hidden"
                                        name="siteAddressId"
                                        value={siteAddress.id}
                                    />

                                    <div style={{ marginBottom: 16 }}>
                                        <label htmlFor={`name-${siteAddress.id}`}>
                                            Name
                                        </label>
                                        <input
                                            id={`name-${siteAddress.id}`}
                                            name="name"
                                            defaultValue={siteAddress.name}
                                            required
                                            style={{
                                                display: "block",
                                                width: "100%",
                                                padding: 8,
                                                marginTop: 4,
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: 16 }}>
                                        <label
                                            htmlFor={`address-${siteAddress.id}`}
                                        >
                                            Full Address
                                        </label>
                                        <textarea
                                            id={`address-${siteAddress.id}`}
                                            name="fullAddress"
                                            defaultValue={siteAddress.fullAddress}
                                            required
                                            rows={3}
                                            style={{
                                                display: "block",
                                                width: "100%",
                                                padding: 8,
                                                marginTop: 4,
                                                resize: "vertical",
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: 16 }}>
                                        <label
                                            htmlFor={`sortOrder-${siteAddress.id}`}
                                        >
                                            Sort Order
                                        </label>
                                        <input
                                            id={`sortOrder-${siteAddress.id}`}
                                            name="sortOrder"
                                            type="number"
                                            defaultValue={siteAddress.sortOrder}
                                            required
                                            style={{
                                                display: "block",
                                                width: "100%",
                                                padding: 8,
                                                marginTop: 4,
                                            }}
                                        />
                                    </div>

                                    <label>
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            defaultChecked={siteAddress.isActive}
                                        />{" "}
                                        Active
                                    </label>

                                    <div style={{ marginTop: 16 }}>
                                        <button type="submit">Update Site Address</button>
                                    </div>
                                </form>

                                <form
                                    action={deleteSiteAddress}
                                    style={{ marginTop: 12 }}
                                >
                                    <input
                                        type="hidden"
                                        name="siteAddressId"
                                        value={siteAddress.id}
                                    />

                                    <DeleteSiteAddressButton
                                        siteAddressName={siteAddress.name}
                                    />
                                </form>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
