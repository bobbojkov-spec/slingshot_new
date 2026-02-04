export const buildCanonicalUrlClient = (path = "") => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");
    if (!baseUrl) return path || "";
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl.replace(/\/$/, "")}${normalized}`;
};