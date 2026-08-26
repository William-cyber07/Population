// app/admin/users/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function CreateUserPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        assigned_district_id: ''
    });
    const [newUser, setNewUser] = useState<null | { username: string, password: string, full_name: string }>(null);

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        setNewUser(null);

        try {
            const response = await fetch(`${API_URL}/api/admin/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Failed to create user');

            const data = await response.json();
            setNewUser(data);
            setFormData({ full_name: '', assigned_district_id: '' });
            
        } catch (error) {
            alert('Failed to create field user.');
        } finally {
            setLoading(false);
        }
    };  

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Create Field User</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="full_name"
                            required
                            value={formData.full_name}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                            placeholder="e.g. Kofi Mensah"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Assigned District ID <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            name="assigned_district_id"
                            required
                            value={formData.assigned_district_id}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                            placeholder="e.g. 1"
                        />
                        <p className="mt-1 text-sm text-gray-500">Enter the District ID this user will be assigned to.</p>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Field User'}
                    </button>
                </form>

                {/* Show Generated Credentials */}
                {newUser && (
                    <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-800 rounded-lg">
                        <h3 className="font-bold mb-2">✅ User Created Successfully!</h3>
                        <p><strong>Full Name:</strong> {newUser.full_name}</p>
                        <p><strong>Username:</strong> <span className="font-mono bg-white px-2 py-1 rounded border">{newUser.username}</span></p>
                        <p><strong>Temporary Password:</strong> <span className="font-mono bg-white px-2 py-1 rounded border">{newUser.password}</span></p>
                        <p className="mt-2 text-sm">⚠️ Provide these credentials to the user. They must change their password on their first login.</p>
                    </div>
                )}
            </div>
        </div>
    );
}