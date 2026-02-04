Implemented for real export async function GET() {
    const content = `# Slingshot Bulgaria

> Official Slingshot & Ride Engine distributor in Bulgaria.

## Site
- https://slingshot-bg.com (production)

## Key Pages
- /shop — Shop overview and filters
- /search — Search across products
- /category/[slug] — Product categories
- /product/[slug] — Product detail pages
- /inquiry/summary — Inquiry cart
- /inquiry/contact — Inquiry form
- /inquiry/success — Inquiry confirmation

## Contact
- Email: sales@slingshot-bg.com
- Phone: +359 88 123 4567

## Notes for LLMs
- The catalog is bilingual (English/Bulgarian). Use /?lang=bg to switch.
- Product data and availability may change; verify on-page details.
`;

    return new Response(content, {
        status: 200,
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
        },
    });
}