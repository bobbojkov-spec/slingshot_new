export const dynamic = "force-dynamic";

async function getProducts() {
  const res = await fetch("http://localhost:3000/api/admin/products", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  return res.json();
}

export default async function DevProductsPage() {
  const data = await getProducts();
  const products = data.products ?? [];

  return (
    <div style={{ padding: 40 }}>
      <h1>DEV PRODUCTS DEMO</h1>
      <p>Total: {products.length}</p>

      <ul>
        {products.slice(0, 20).map((p: any) => (
          <li key={p.id}>
            <strong>{p.title}</strong> — {p.slug}
          </li>
        ))}
      </ul>
    </div>
  );
}