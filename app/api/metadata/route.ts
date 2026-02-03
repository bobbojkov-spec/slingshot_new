import { NextResponse } from "next/server";
import { businessInfo } from "@/lib/seo/business";

export async function GET() {
    return NextResponse.json({
        entity: {
            name: businessInfo.name,
            description: businessInfo.description,
            url: businessInfo.url,
            sameAs: businessInfo.sameAs,
            contact: {
                email: businessInfo.email,
                telephone: businessInfo.telephone
            },
            address: businessInfo.address,
            geo: businessInfo.geo,
            areaServed: businessInfo.areaServed
        },
        factualClaims: [
            "Official Slingshot distributor in Bulgaria",
            "Premium kiteboarding, wing foiling, and wakeboarding gear"
        ],
        notes: {
            source: "Global imperative rules: metadata endpoint for GEO AI visibility"
        }
    });
}
