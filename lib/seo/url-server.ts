import { headers } from "next/headers";
import { businessInfo } from "@/lib/seo/business";

export const resolveBaseUrl = async () => {
    if (process.env.NEXT_PUBLIC_SITE_URL) {
        return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
    }

    try {
        const headersList = await headers();
        const host = headersList.get("host");
        if (host) {
            const protocol = host.includes("localhost") ? "http" : "https";
            return `${protocol}://${host}`;
        }
    } catch (error) {
        // headers() is only available in server components
    }

    return businessInfo.url.replace(/\/$/, "");
};

export const buildCanonicalUrl = async (path = "") => {
    const baseUrl = await resolveBaseUrl();
    if (!path) return baseUrl;
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${normalized}`;
};
