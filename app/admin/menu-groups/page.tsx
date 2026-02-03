import MenuGroupsListClient from "@/components/admin/MenuGroupsListClient";

export const revalidate = 0;

const ADMIN_BASE_URL =
  process.env.NEXT_API_URL ||
  process.env.ADMIN_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.BASE_URL ||
  "http://localhost:3000";

export default async function MenuGroupsPage() {
  try {
    const res = await fetch(`${ADMIN_BASE_URL}/api/admin/menu-groups`, { cache: "no-store" });
    if (!res.ok) {
      console.error("Failed to load menu groups", res.status);
      return <MenuGroupsListClient initialGroups={[]} source="all" />;
    }

    const data = await res.json();
    return <MenuGroupsListClient initialGroups={data?.groups || []} source="all" />;
  } catch (error) {
    console.error("Failed to load menu groups", error);
    return <MenuGroupsListClient initialGroups={[]} source="all" />;
  }
}
