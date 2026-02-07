const normalizePath = (path = "") => {
    if (!path) return "/";
    return path.startsWith("/") ? path : `/${path}`;
};

export const buildHreflangLinks = (baseUrl: string, path = "/") => {
    const safeBase = baseUrl.replace(/\/$/, "");
    const normalizedPath = normalizePath(path);

    const enUrl = `${safeBase}${normalizedPath}${normalizedPath.includes("?") ? "&" : "?"}lang=en`;
    const bgUrl = `${safeBase}${normalizedPath}${normalizedPath.includes("?") ? "&" : "?"}lang=bg`;
    const defaultUrl = `${safeBase}${normalizedPath}`;

    return {
        canonical: defaultUrl,
        alternates: {
            languages: {
                en: enUrl,
                "bg-BG": bgUrl,
                "x-default": defaultUrl,
            },
        },
    };
};