export function colorsUrl(productId: string) {
  if (!productId) {
    throw new Error('Missing productId for colorsUrl');
  }
  return `/api/admin/products/${productId}/colors`;
}

