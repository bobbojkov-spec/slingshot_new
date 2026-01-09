export type ImageVariant = 'thumb' | 'medium' | 'original';

function replaceVariantSegment(url: string, sourceSegment: string, targetSegment: string): string {
  return url.replace(`/${sourceSegment}/`, `/${targetSegment}/`);
}

export function getImageVariantUrl(
  url: string | null | undefined,
  variant: ImageVariant
): string | null {
  if (!url) return null;
  const targetSegment = `/${variant}/`;
  if (url.includes(targetSegment)) {
    return url;
  }

  const sourceSegments: ImageVariant[] = ['original', 'thumb', 'medium'];
  for (const source of sourceSegments) {
    if (url.includes(`/${source}/`)) {
      return replaceVariantSegment(url, source, variant);
    }
  }

  return null;
}

export function getProxyUrl(filePath: string, bucket: string = 'slingshotnewimages-hw-tht'): string {
  if (!filePath) return '';
  if (filePath.startsWith('http')) return filePath;
  return `/api/media/raw?path=${encodeURIComponent(filePath)}&bucket=${encodeURIComponent(bucket)}`;
}
