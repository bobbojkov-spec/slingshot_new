const normalizePath = (path = "") => {
    if (!path) return "/";
    return path.startsWith("/") ? path : `/${path}`;
};

const stripLocalePrefix = (path: string) => {
    return path.startsWith("/bg") ? path.replace("/bg", "") || "/" : path;
};

export const buildHreflangLinks = (baseUrl: string, path = "/") => {
    const safeBase = baseUrl.replace(/\/$/, "");
    const normalizedPath = normalizePath(path);
    const basePath = stripLocalePrefix(normalizedPath);

    const enUrl = `${safeBase}${basePath}`;
    const bgUrl = `${safeBase}/bg${basePath === "/" ? "" : basePath}`;
    const defaultUrl = enUrl;

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