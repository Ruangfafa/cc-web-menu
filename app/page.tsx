import { redirect } from "next/navigation";

/**
 * 首页重定向
 *
 * 路径：
 * GET /
 *
 * 功能：
 * 1. 用户访问 http://localhost:3000
 * 2. 自动跳转到 http://localhost:3000/menu
 *
 * 原因：
 * 对顾客来说，菜单页才是主入口。
 */
export default function HomePage() {
    redirect("/menu");
}