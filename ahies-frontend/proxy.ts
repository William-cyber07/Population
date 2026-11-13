// proxy.ts
// Next.js 16 renamed `middleware.ts` to `proxy.ts`. The backend remains the
// real security boundary; this proxy only performs UX routing so users do not
// see pages their role cannot use. Tokens are still verified here (HS256) so a
// forged cookie cannot unlock the UI.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_ROLES = new Set(['admin', 'administrator']);
const USER_MANAGEMENT_ROLES = new Set(['manager', 'admin', 'administrator']);

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function verifySessionToken(token: string, secret: string) {
    try {
        const [header, payload, signature] = token.split('.');
        if (!header || !payload || !signature) return null;

        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const valid = await crypto.subtle.verify(
            'HMAC',
            key,
            base64UrlToBytes(signature),
            encoder.encode(`${header}.${payload}`)
        );
        if (!valid) return null;

        const claims = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload)));

        // Challenge tokens (2FA) must never be treated as a session.
        if (claims.scope !== 'session') return null;
        if (claims.exp && claims.exp * 1000 <= Date.now()) return null;

        return claims as {
            user_id: number;
            username: string;
            role: string;
            must_change_password?: boolean;
        };
    } catch {
        return null;
    }
}

function homeForRole(role: string) {
    if (ADMIN_ROLES.has(role)) return '/admin/dashboard';
    if (role === 'manager') return '/admin/users';
    return '/field/dashboard';
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('token')?.value;

    if (pathname === '/login') {
        return NextResponse.next();
    }

    const secret = process.env.JWT_SECRET;
    const session = token && secret ? await verifySessionToken(token, secret) : null;

    if (!session) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // Temporary passwords must be replaced before any other page is reachable.
    if (session.must_change_password && pathname !== '/account/change-password') {
        return NextResponse.redirect(new URL('/account/change-password', request.url));
    }

    if (pathname.startsWith('/admin')) {
        const allowed =
            ADMIN_ROLES.has(session.role) ||
            (USER_MANAGEMENT_ROLES.has(session.role) && pathname === '/admin/users');

        if (!allowed) {
            return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
