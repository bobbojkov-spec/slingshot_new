import Script from "next/script";

type SchemaJsonLdProps = {
    data: Record<string, unknown>;
    defer?: boolean;
};

export default function SchemaJsonLd({ data, defer = false }: SchemaJsonLdProps) {
    return (
        <Script
            id={`schema-${JSON.stringify(data).slice(0, 20)}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
            strategy={defer ? "afterInteractive" : "beforeInteractive"}
        />
    );
}
