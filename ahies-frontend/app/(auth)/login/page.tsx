// app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function redirectAfterLogin(router: ReturnType<typeof useRouter>, user: any) {
    if (user.must_change_password) {
        router.push('/account/change-password');
        return;
    }

    const role = user.role;
    if (role === 'admin' || role === 'administrator') {
        router.push('/admin/dashboard');
    } else if (role === 'manager') {
        router.push('/admin/users');
    } else {
        router.push('/field/dashboard');
    }
}

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
    const [challengeToken, setChallengeToken] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            if (data.requires2fa) {
                setChallengeToken(data.challengeToken);
                setStep('2fa');
                return;
            }

            redirectAfterLogin(router, data.user);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/auth/2fa/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ challengeToken, code: twoFactorCode }),
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            redirectAfterLogin(router, data.user);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
                <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">Population Survey System</h1>
                
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {step === 'credentials' ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Username</label>
                            <input
                                type="text"
                                name="username"
                                required
                                value={formData.username}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                                placeholder="e.g. admin"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                                placeholder="e.g. admin123"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerify} className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Enter the 6-digit code from your authenticator app, or one of your backup codes.
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Verification code</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                autoFocus
                                required
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900 tracking-widest text-center"
                                placeholder="123456"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Verify'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setStep('credentials');
                                setChallengeToken('');
                                setTwoFactorCode('');
                                setError('');
                            }}
                            className="w-full text-sm text-gray-600 hover:text-gray-900"
                        >
                            Back to login
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
