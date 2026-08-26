// app/field/households/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createHousehold } from '@/lib/api';

export default function CreateHouseholdPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        hhid: '',
        cluster: '',
        urban_rural: 'U',
    });

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Create the household
            const result = await createHousehold(formData);
            
            // Show success message with the new ID
            alert(`Household created successfully! ID: ${result.household_id}`);
            
            // Redirect to the facts entry page for this new household
            // Note: We will build this page next! But for now, redirect back to the dashboard.
            router.push('/field/dashboard');
            
                } catch (error: any) {
            // If the error contains 'Duplicate entry', it means the HHID is already taken
            if (error.message && error.message.includes('Duplicate entry')) {
                alert('That Household ID is already taken. Please choose a unique HHID.');
            } else {
                alert('Failed to create household. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Create New Household</h1>
                <button 
                    onClick={() => router.push('/field/dashboard')}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                >
                    ← Back to Dashboard
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Household ID */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Household ID (HHID) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="hhid"
                            required
                            value={formData.hhid}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                            placeholder="e.g. HH002"
                        />
                        <p className="mt-1 text-sm text-gray-500">A unique identifier for this household (e.g., HH002)</p>
                    </div>

                    {/* Cluster */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Cluster Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="cluster"
                            required
                            value={formData.cluster}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                            placeholder="e.g. CLUSTER_02"
                        />
                    </div>

                    {/* Urban / Rural */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Area Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="urban_rural"
                            value={formData.urban_rural}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                        >
                            <option value="U">Urban</option>
                            <option value="R">Rural</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Household'}
                    </button>
                </form>
            </div>
        </div>
    );
}