import { validateEcpOrigin } from './originAllowlist';

const SS_PREFIX = "cleverdeal::";

/**
 * Get an ECP param from URL query params and store it in session storage.
 * If there is no such param in URL, use the one saved in session storage.
 * This prevents any ECP param loss after navigating through different URLs.
 * Security: ecpOrigin values are validated against an allowlist before storage.
 * @param {*} name the ECP param name
 * @returns the ECP param value
 */
export const getEcpParam = (name: string): string | null => {
    const sessionStorageKey = SS_PREFIX + name;

    let queryParam = new URL(window.location.href).searchParams.get(name);

    if (name === 'ecpOrigin') {
        if (queryParam) {
            queryParam = validateEcpOrigin(queryParam);
        }
        const stored = sessionStorage.getItem(sessionStorageKey);
        if (stored && stored !== validateEcpOrigin(stored)) {
            sessionStorage.removeItem(sessionStorageKey);
        }
    }

    if (queryParam) {
        sessionStorage.setItem(sessionStorageKey, queryParam);
        return queryParam;
    }

    return sessionStorage.getItem(sessionStorageKey);
};
