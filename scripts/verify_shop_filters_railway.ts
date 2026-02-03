import fetch from 'node-fetch';

type FacetItem = {
    slug?: string;
    name?: string;
    count?: number | string;
};

type Facets = {
    categories?: FacetItem[];
    collections?: FacetItem[];
    tags?: FacetItem[];
    brands?: FacetItem[];
};

type ProductsResponse = {
    products: unknown[];
    facets?: Facets;
    pagination?: {
        total?: number;
    };
};

const BASE_URL = process.env.RAILWAY_BASE_URL || 'https://slingshotnew-development.up.railway.app';
const LANGS: Array<'en' | 'bg'> = ['en', 'bg'];
const COLLECTIONS_TO_CHECK = ['twin-tips'];
const MAX_COMBOS_PER_COLLECTION = 50;

const toNumber = (value?: number | string) => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
};

const buildUrl = (params: Record<string, string | string[]>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach((item) => searchParams.append(key, item));
        } else {
            searchParams.set(key, value);
        }
    });
    return `${BASE_URL}/api/products?${searchParams.toString()}`;
};

const fetchProducts = async (params: Record<string, string | string[]>) => {
    const url = buildUrl(params);
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed request ${url}: ${res.status}`);
    }
    return (await res.json()) as ProductsResponse;
};

const getFacetValue = (item: FacetItem) => {
    return item.slug || item.name || '';
};

const verifySingleFacet = async (lang: 'en' | 'bg', collection: string) => {
    const baseParams = { collection, lang, limit: '12' };
    const baseResponse = await fetchProducts(baseParams);
    const facets = baseResponse.facets || {};
    const failures: string[] = [];

    const facetKeys: Array<keyof Facets> = ['brands', 'collections', 'tags'];

    for (const key of facetKeys) {
        const items = facets[key] || [];
        for (const item of items) {
            const count = toNumber(item.count);
            const value = getFacetValue(item);
            if (!value || count <= 0) continue;

            const params: Record<string, string | string[]> = { ...baseParams };
            params[key.slice(0, -1)] = value; // brands -> brand, tags -> tag, collections -> collection

            const response = await fetchProducts(params);
            if (!response.products || response.products.length === 0) {
                failures.push(`${key}:${value} (${count}) returned 0 products`);
            }
        }
    }

    return failures;
};

const verifyComboFacets = async (lang: 'en' | 'bg', collection: string) => {
    const baseParams = { collection, lang, limit: '12' };
    const baseResponse = await fetchProducts(baseParams);
    const facets = baseResponse.facets || {};
    const failures: string[] = [];

    const tags = (facets.tags || []).filter((tag) => toNumber(tag.count) > 0).slice(0, 20);
    const brands = (facets.brands || []).filter((brand) => toNumber(brand.count) > 0).slice(0, 10);
    const collections = (facets.collections || []).filter((col) => toNumber(col.count) > 0).slice(0, 10);

    let combosChecked = 0;
    for (const tag of tags) {
        for (const brand of brands) {
            if (combosChecked >= MAX_COMBOS_PER_COLLECTION) break;
            const params = {
                ...baseParams,
                tag: getFacetValue(tag),
                brand: getFacetValue(brand)
            };
            const response = await fetchProducts(params);
            if (!response.products || response.products.length === 0) {
                failures.push(`combo tag:${getFacetValue(tag)} + brand:${getFacetValue(brand)} returned 0 products`);
            }
            combosChecked += 1;
        }
    }

    for (const tag of tags) {
        for (const col of collections) {
            if (combosChecked >= MAX_COMBOS_PER_COLLECTION) break;
            const params = {
                ...baseParams,
                tag: getFacetValue(tag),
                collection: getFacetValue(col)
            };
            const response = await fetchProducts(params);
            if (!response.products || response.products.length === 0) {
                failures.push(`combo tag:${getFacetValue(tag)} + collection:${getFacetValue(col)} returned 0 products`);
            }
            combosChecked += 1;
        }
    }

    return failures;
};

const run = async () => {
    console.log(`Running filter verification against ${BASE_URL}`);
    const allFailures: string[] = [];

    for (const lang of LANGS) {
        for (const collection of COLLECTIONS_TO_CHECK) {
            console.log(`\nChecking lang=${lang}, collection=${collection}`);
            const singleFailures = await verifySingleFacet(lang, collection);
            const comboFailures = await verifyComboFacets(lang, collection);

            if (singleFailures.length === 0 && comboFailures.length === 0) {
                console.log('✔ No failures found.');
            } else {
                console.log('✖ Failures found:');
                [...singleFailures, ...comboFailures].forEach((item) => {
                    console.log(`  - ${item}`);
                    allFailures.push(`[${lang}] [${collection}] ${item}`);
                });
            }
        }
    }

    if (allFailures.length > 0) {
        console.log(`\nSummary: ${allFailures.length} failures`);
        process.exitCode = 1;
    } else {
        console.log('\nSummary: all checks passed');
    }
};

run().catch((error) => {
    console.error('Verification failed:', error);
    process.exitCode = 1;
});