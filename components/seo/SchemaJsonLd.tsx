import Script from 'next/script';

type SchemaJsonLdProps = {
    data: Record<string, unknown>;
};

export default function SchemaJsonLd({ data }: SchemaJsonLdProps) {
    return (
        <Script
            id={`schema-${JSON.stringify(data).slice(0, 20)}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
            strategy="afterInteractive"
        />
    );
}
