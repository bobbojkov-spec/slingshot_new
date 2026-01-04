export const revalidate = 0;

type Product = {
  id: string;
  title?: string;
  slug?: string;
  status?: string;
  product_type?: string;
  category?: { name?: string } | string | null;
  updated_at?: string;
  images?: { url?: string }[];
};

const getAdminProductsUrl = () => {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BASE_URL ||
    'http://localhost:3000';
  return new URL('/api/admin/products', baseUrl.replace(/\/$/, '')).toString();
};

export default async function ProductsPage() {
  const res = await fetch(getAdminProductsUrl(), { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Unable to load products');
  }
  const data = await res.json();
  const products: Product[] = data?.products ?? [];

  const formatDate = (value?: string) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}.${d.getFullYear()}`;
  };

  return (
    <main className="px-6 py-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Admin Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} products</p>
        </div>
      </div>
      <div className="border border-border rounded-lg shadow-sm bg-white overflow-hidden">
        <div className="grid grid-cols-[120px,1fr,120px,140px,120px] gap-0 bg-slate-100 text-xs text-slate-500 uppercase px-4 py-3 font-semibold">
          <span>Image</span>
          <span>Title</span>
          <span>Status</span>
          <span>Updated</span>
          <span>Actions</span>
        </div>
        {products.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-600">No products to show</div>
        ) : (
          products.map((product) => {
            const imageUrl = product.images?.[0]?.url;
            const badgeColor =
              product.status?.toLowerCase() === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700';
            const secondaryText =
              typeof product.category === 'string'
                ? product.category
                : (product.category as { name?: string })?.name || product.product_type || '—';
            return (
              <div
                key={product.id}
                className="grid grid-cols-[120px,1fr,120px,140px,120px] gap-0 px-4 py-3 border-t border-slate-100 items-center"
              >
                <div className="h-16 w-28 bg-slate-50 border border-slate-200 rounded-md overflow-hidden flex items-center justify-center">
                  {imageUrl ? (
                    <img src={imageUrl} alt={product.title || 'Product image'} className="h-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400">No image</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{product.title || 'Untitled product'}</p>
                  <p className="text-xs text-slate-500 mt-1">{secondaryText}</p>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${badgeColor}`}>
                  {product.status || 'unknown'}
                </span>
                <span className="text-sm text-slate-600">{formatDate(product.updated_at)}</span>
                <div>
                  <a
                    href={`/admin/products/${product.id}`}
                    className="text-sm font-medium text-sky-600 hover:underline"
                  >
                    Edit
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}


