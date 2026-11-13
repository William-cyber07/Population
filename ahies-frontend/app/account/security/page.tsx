// app/account/security/page.tsx
'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function SecurityPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [me, setMe] = useState<any>(null);

    const [setupData, setSetupData] = useState<any>(null);
    const [setupCode, setSetupCode] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);

    const [disablePassword, setDisablePassword] = useState('');
    const [disableCode, setDisableCode] = useState('');

    const loadMe = async () => {
        try {
            const response = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to load account');
            setMe(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMe();
    }, []);

    const startSetup = async () => {
        setError('');
        setMessage('');
        setBackupCodes([]);
        try {
            const response = await fetch(`${API_URL}/api/auth/2fa/setup`, {
                method: 'POST',
                credentials: 'include',
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to start setup');
            setSetupData(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const confirmSetup = async (e: any) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch(`${API_URL}/api/auth/2fa/enable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ code: setupCode }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to enable 2FA');

            setBackupCodes(data.backupCodes || []);
            setSetupData(null);
            setSetupCode('');
            setMessage('Two-factor authentication enabled. Save your backup codes now.');
            await loadMe();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const disable = async (e: any) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const response = await fetch(`${API_URL}/api/auth/2fa/disable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ password: disablePassword, code: disableCode }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to disable 2FA');

            setDisablePassword('');
            setDisableCode('');
            setBackupCodes([]);
            setMessage('Two-factor authentication disabled.');
            await loadMe();
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) {
        return <p className="text-gray-600">Loading account security...</p>;
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}
            {message && (
                <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded">
                    {message}
                </div>
            )}

            <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-1">Two-factor authentication</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Status:{' '}
                    <span className={me?.two_factor_enabled ? 'text-green-700 font-semibold' : 'text-gray-800 font-semibold'}>
                        {me?.two_factor_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                </p>

                {!me?.two_factor_enabled && !setupData && (
                    <button
                        onClick={startSetup}
                        className="bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700"
                    >
                        Set up authenticator app
                    </button>
                )}

                {setupData && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Scan this QR code with Google Authenticator, Microsoft Authenticator, or Authy.
                        </p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={setupData.qrDataUrl} alt="2FA QR code" className="w-60 h-60 border rounded" />
                        <p className="text-sm text-gray-600">
                            Can&apos;t scan it? Enter this key manually:{' '}
                            <code className="bg-gray-100 px-2 py-1 rounded break-all">{setupData.secret}</code>
                        </p>
                        <form onSubmit={confirmSetup} className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700">Verification code</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    required
                                    value={setupCode}
                                    onChange={(e) => setSetupCode(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                                    placeholder="123456"
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-green-600 text-white font-semibold py-2 px-4 rounded hover:bg-green-700"
                            >
                                Enable
                            </button>
                        </form>
                    </div>
                )}

                {backupCodes.length > 0 && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-400 rounded">
                        <h3 className="font-bold text-yellow-800 mb-2">Backup codes</h3>
                        <p className="text-sm text-yellow-800 mb-2">
                            Each code can be used once. Store them somewhere safe — they will not be shown again.
                        </p>
                        <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                            {backupCodes.map((code) => (
                                <span key={code} className="bg-white border rounded px-2 py-1">{code}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {me?.two_factor_enabled && (
                <div className="bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Disable two-factor authentication</h2>
                    <form onSubmit={disable} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                required
                                value={disablePassword}
                                onChange={(e) => setDisablePassword(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Authenticator or backup code</label>
                            <input
                                type="text"
                                required
                                value={disableCode}
                                onChange={(e) => setDisableCode(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-red-600 text-white font-semibold py-2 px-4 rounded hover:bg-red-700"
                        >
                            Disable 2FA
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
