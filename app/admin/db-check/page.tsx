import type { ReactNode } from "react";
import { products } from "@/lib/db";

export const revalidate = 0;

async function fetchProducts() {
  try {
    const rows = await products.getActive();
    return rows;
  } catch (error) {
    console.error("DB read failed", error);
    return [];
  }
}

export default async function AdminDbCheckPage() {
  const rows = await fetchProducts();

  const body: ReactNode =
    rows.length === 0 ? (
      <p className="text-sm text-gray-600">No active products found.</p>
    ) : (
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="font-medium">ID</th>
            <th className="font-medium">Handle</th>
            <th className="font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t">
              <td className="py-2">{row.id}</td>
              <td className="py-2">{row.handle}</td>
              <td className="py-2">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );

  return (
    <section className="px-6 py-6">
      <h1 className="text-2xl font-medium mb-4">Database read test</h1>
      <div className="w-full overflow-x-auto bg-white p-4 rounded shadow-sm">{body}</div>
    </section>
  );
}

