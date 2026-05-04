/**
 * 购物车 localStorage key
 *
 * 为什么抽常量：
 * 后续 /cart、菜单详情页、结账页都会共用同一个 key。
 */
export const CART_STORAGE_KEY = "cc-web-menu-cart";
export const CART_STORAGE_EVENT = "cc-web-menu-cart-updated";

/**
 * 缓存最近一次 localStorage 原始值和解析结果。
 *
 * 为什么需要：
 * useSyncExternalStore 要求 getSnapshot 在底层数据没变化时
 * 返回稳定引用，否则 React 会认为 store 一直在变化。
 */
let lastCartRaw = "";
let lastCartSnapshot: CartItem[] = [];

/**
 * 购物车里的单个已选选项快照
 *
 * 为什么必须保存快照：
 * 后台菜单以后可能改名、改价、删选项，
 * 但用户加入购物车时看到的内容不能跟着历史配置变化。
 */
export type CartItemSelectedOption = {
    optionGroupId: number;
    optionGroupNameSnapshot: string;
    optionGroupItemId: number;
    subItemId: number;
    subItemNameSnapshot: string;
    priceCentsSnapshot: number;
};

/**
 * 购物车条目快照
 */
export type CartItem = {
    cartItemId: string;
    serviceDate: string;
    menuItemId: number;
    mainItemId: number;
    nameSnapshot: string;
    basePriceCentsSnapshot: number;
    selectedOptions: CartItemSelectedOption[];
    quantity: number;
    totalPriceCentsSnapshot: number;
};

/**
 * 从浏览器读取购物车。
 *
 * 为什么做容错：
 * localStorage 可能为空、损坏、或被手动改坏，
 * 这里统一兜底，避免页面直接崩掉。
 */
export function readCart(): CartItem[] {
    if (typeof window === "undefined") {
        return [];
    }

    const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!rawCart) {
        lastCartRaw = "";
        lastCartSnapshot = [];
        return [];
    }

    /**
     * 如果 localStorage 原始字符串没变，直接返回上一次快照引用。
     */
    if (rawCart === lastCartRaw) {
        return lastCartSnapshot;
    }

    try {
        const parsedCart = JSON.parse(rawCart);
        const nextSnapshot = Array.isArray(parsedCart)
            ? (parsedCart as CartItem[])
            : [];

        lastCartRaw = rawCart;
        lastCartSnapshot = nextSnapshot;

        return nextSnapshot;
    } catch {
        lastCartRaw = "";
        lastCartSnapshot = [];
        return [];
    }
}

/**
 * 写入购物车到浏览器 localStorage。
 */
export function writeCart(cartItems: CartItem[]) {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    window.dispatchEvent(new Event(CART_STORAGE_EVENT));
}

/**
 * 向购物车追加一个条目。
 *
 * 当前策略：
 * 先不做“同配置自动合并”，每次加入都新增一条快照。
 *
 * 为什么先这样做：
 * 逻辑最直接，便于先把顾客下单链路跑通；
 * 后面做 /cart 页面时，再决定是否按配置合并数量。
 */
export function addCartItem(cartItem: CartItem) {
    const currentCart = readCart();

    if (currentCart.some((item) => !item.serviceDate)) {
        return {
            success: false,
            error: "Your cart contains older items without a menu date. Please clear the cart before adding new items.",
        };
    }

    const existingServiceDate = currentCart.find(
        (item) => item.serviceDate
    )?.serviceDate;

    if (
        existingServiceDate &&
        cartItem.serviceDate &&
        existingServiceDate !== cartItem.serviceDate
    ) {
        return {
            success: false,
            error: `Your cart already contains items for ${existingServiceDate}. Please checkout or clear the cart before adding ${cartItem.serviceDate}.`,
        };
    }

    writeCart([...currentCart, cartItem]);

    return {
        success: true,
        error: "",
    };
}

/**
 * 更新单个购物车条目的数量。
 *
 * 规则：
 * - 数量最少为 1
 * - 如果找不到目标条目，则保持原样
 */
export function updateCartItemQuantity(
    cartItemId: string,
    quantity: number
) {
    const safeQuantity = Math.max(1, Math.floor(quantity));
    const currentCart = readCart();

    writeCart(
        currentCart.map((item) =>
            item.cartItemId === cartItemId
                ? {
                      ...item,
                      quantity: safeQuantity,
                  }
                : item
        )
    );
}

/**
 * 删除单个购物车条目。
 */
export function removeCartItem(cartItemId: string) {
    const currentCart = readCart();
    writeCart(currentCart.filter((item) => item.cartItemId !== cartItemId));
}

/**
 * 清空整个购物车。
 */
export function clearCart() {
    writeCart([]);
}

/**
 * 订阅购物车更新事件。
 *
 * 为什么需要：
 * /cart 页面现在要响应 localStorage 的更新，
 * 用 useSyncExternalStore 订阅会比在 effect 里直接 setState 更稳。
 */
export function subscribeCart(onStoreChange: () => void) {
    if (typeof window === "undefined") {
        return () => undefined;
    }

    const handleChange = () => {
        onStoreChange();
    };

    window.addEventListener("storage", handleChange);
    window.addEventListener(CART_STORAGE_EVENT, handleChange);

    return () => {
        window.removeEventListener("storage", handleChange);
        window.removeEventListener(CART_STORAGE_EVENT, handleChange);
    };
}
