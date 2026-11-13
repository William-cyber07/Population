// app/account/change-password/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function ChangePasswordPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('The new passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/auth/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to change password');
            }

            setSuccess('Password changed successfully. Redirecting...');
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });

            const meResponse = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
            const me = meResponse.ok ? await meResponse.json() : null;
            const role = me?.role;

            setTimeout(() => {
                if (role === 'admin' || role === 'administrator') {
                    router.push('/admin/dashboard');
                } else if (role === 'manager') {
                    router.push('/admin/users');
                } else {
                    router.push('/field/dashboard');
                }
            }, 800);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Change Password</h2>
            <p className="text-sm text-gray-600 mb-6">
                Use at least 10 characters with uppercase, lowercase, a number and a symbol.
            </p>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded mb-4">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Current password</label>
                    <input
                        type="password"
                        name="currentPassword"
                        required
                        value={formData.currentPassword}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">New password</label>
                    <input
                        type="password"
                        name="newPassword"
                        required
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm new password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Change password'}
                </button>
            </form>
        </div>
    );
}
