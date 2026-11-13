// app/account/layout.tsx
import Link from 'next/link';

export default function AccountLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-3xl mx-auto p-4 flex justify-between items-center">
                    <h1 className="text-lg font-bold text-gray-800">Account Security</h1>
                    <div className="flex gap-4 text-sm">
                        <Link href="/account/security" className="text-blue-600 hover:underline">
                            Two-factor
                        </Link>
                        <Link href="/account/change-password" className="text-blue-600 hover:underline">
                            Change password
                        </Link>
                        <Link href="/field/dashboard" className="text-gray-600 hover:underline">
                            Back to app
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-6">{children}</main>
        </div>
    );
}
