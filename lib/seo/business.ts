export const businessInfo = {
    name: "Slingshot Bulgaria",
    legalName: "Slingshot Bulgaria",
    description:
        "Premium kiteboarding, wing foiling, and wakeboarding gear, curated for bold riders across Bulgaria and beyond.",
    url: "https://slingshotnew-development.up.railway.app",
    email: "info@slingshot.bg",
    telephone: "+359888123456",
    address: {
        streetAddress: "Vitosha Blvd 123",
        addressLocality: "Sofia",
        addressRegion: "Sofia City Province",
        postalCode: "1000",
        addressCountry: "BG"
    },
    geo: {
        latitude: 42.6977,
        longitude: 23.3219
    },
    areaServed: ["Bulgaria", "Sofia"],
    sameAs: [
        "https://www.instagram.com/slingshotsports",
        "https://www.facebook.com/slingshotsports",
        "https://www.youtube.com/@slingshotsports"
    ]
};

export const buildLocalBusinessSchema = (baseUrl: string) => ({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${baseUrl}#localbusiness`,
    name: businessInfo.name,
    legalName: businessInfo.legalName,
    description: businessInfo.description,
    url: baseUrl,
    telephone: businessInfo.telephone,
    email: businessInfo.email,
    sameAs: businessInfo.sameAs,
    address: {
        "@type": "PostalAddress",
        streetAddress: businessInfo.address.streetAddress,
        addressLocality: businessInfo.address.addressLocality,
        addressRegion: businessInfo.address.addressRegion,
        postalCode: businessInfo.address.postalCode,
        addressCountry: businessInfo.address.addressCountry
    },
    geo: {
        "@type": "GeoCoordinates",
        latitude: businessInfo.geo.latitude,
        longitude: businessInfo.geo.longitude
    },
    areaServed: businessInfo.areaServed.map((area) => ({
        "@type": "AdministrativeArea",
        name: area
    }))
});

export const buildWebSiteSchema = (baseUrl: string) => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}#website`,
    name: businessInfo.name,
    url: baseUrl,
    inLanguage: ["en", "bg"],
    potentialAction: {
        "@type": "SearchAction",
        target: `${baseUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
    }
});

export const buildBreadcrumbSchema = (baseUrl: string, items: { label: string; href?: string }[]) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        item: item.href ? `${baseUrl}${item.href}` : undefined
    }))
});
