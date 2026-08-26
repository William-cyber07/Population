// app/field/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FieldDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    // Fetch the current user's profile when the page loads
    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/auth/me', {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setUserData(data);
            }
        } catch (error) {
            console.error('Failed to fetch user profile');
        }
    };

        const handleSync = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/surveys/sync', {
                method: 'POST',
                credentials: 'include', // Sends the auth cookie
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Sync failed');
            }

            alert(`Sync successful! ${data.synced_count} surveys submitted for Admin review.`);
            
            // Refresh the page to update the stats (optional)
            router.refresh();
        } catch (error: any) {
            alert(`Sync failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Field User Dashboard</h1>
            
            {/* Welcome & Assigned Zone Card */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-lg font-semibold text-gray-800">Welcome, {userData?.username || 'Field User'}!</h2>
                <div className="mt-2 text-gray-600">
                    <span className="font-medium">Your Assigned Zone:</span> 
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        District #{userData?.assigned_district_id || 'Not Assigned'}
                    </span>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                    <h3 className="text-gray-500 text-sm uppercase font-semibold">Pending Drafts</h3>
                    <p className="text-3xl font-bold text-gray-800">0</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-sm uppercase font-semibold">Synced</h3>
                    <p className="text-3xl font-bold text-gray-800">0</p>
                </div>
            </div>

                        {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Card 1: Create Household */}
                <div 
                    onClick={() => router.push('/field/households')}
                    className="bg-white p-6 rounded-lg shadow-md border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all flex flex-col items-center justify-center text-center h-40"
                >
                    <span className="text-4xl mb-2">🏠</span>
                    <span className="text-lg font-medium text-blue-600">Create New Household</span>
                    <span className="text-sm text-gray-500">Start a new survey entry</span>
                </div>

                {/* NEW Card 2: Enter Citizen Facts */}
                <div 
                    onClick={() => router.push('/field/facts')}
                    className="bg-white p-6 rounded-lg shadow-md border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition-all flex flex-col items-center justify-center text-center h-40"
                >
                    <span className="text-4xl mb-2">👤</span>
                    <span className="text-lg font-medium text-purple-600">Enter Citizen Facts</span>
                    <span className="text-sm text-gray-500">Add a person to a Household</span>
                </div>

                {/* Card 3: Sync Button */}
                <div className="bg-white p-6 rounded-lg shadow-md border-2 border-dashed border-green-300 flex flex-col items-center justify-center text-center h-40">
                    <span className="text-4xl mb-2">☁️</span>
                    <button 
                        onClick={handleSync}
                        disabled={loading}
                        className="text-lg font-medium text-green-600 hover:text-green-700 disabled:opacity-50"
                    >
                        {loading ? 'Syncing...' : 'Sync Pending Submissions'}
                    </button>
                    <span className="text-sm text-gray-500">Upload drafts to Admin</span>
                </div>
            </div>
        </div>
    );
}