/** Simple auth helpers using localStorage + JWT */

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    mobile?: string;
    role: string;
}

const TOKEN_KEY = "disastra_token";
const USER_KEY = "disastra_user";

export function saveAuth(token: string, user: AuthUser) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
    try {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as AuthUser;
    } catch {
        return null;
    }
}

export function isAdmin(): boolean {
    const u = getUser();
    return !!u && u.role?.toUpperCase() === "ADMIN";
}
