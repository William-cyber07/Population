// app/admin/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [pendingSurveys, setPendingSurveys] = useState([]);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

    // Fetch pending surveys when the page loads
    useEffect(() => {
        fetchPendingSurveys();
    }, []);

    const fetchPendingSurveys = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/pending`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setPendingSurveys(data);
                setStats({
                    pending: data.length,
                    approved: 0, // We will implement the other endpoints later
                    rejected: 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch pending surveys');
        }
    };

    const handleReview = async (personRoundId: number, action: 'approve' | 'reject', reason?: string) => {
        try {
            const response = await fetch(`${API_URL}/api/admin/review/${personRoundId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, reason }),
                credentials: 'include',
            });

            if (response.ok) {
                // Refresh the list after a successful review
                fetchPendingSurveys();
            } else {
                alert('Failed to process review');
            }
        } catch (error) {
            console.error('Error reviewing survey:', error);
            alert('Failed to process review');
        }
    };

    const handleReject = (personRoundId: number) => {
        const reason = prompt('Please enter a rejection reason:');
        if (reason !== null) {
            handleReview(personRoundId, 'reject', reason);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                    <h3 className="text-gray-500 text-sm uppercase font-semibold">Pending Reviews</h3>
                    <p className="text-3xl font-bold text-gray-800">{stats.pending}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-sm uppercase font-semibold">Approved</h3>
                    <p className="text-3xl font-bold text-gray-800">{stats.approved}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
                    <h3 className="text-gray-500 text-sm uppercase font-semibold">Rejected</h3>
                    <p className="text-3xl font-bold text-gray-800">{stats.rejected}</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Pending Survey Submissions</h2>
                
                {loading ? (
                    <p className="text-center text-gray-500 py-4">Loading...</p>
                ) : pendingSurveys.length === 0 ? (
                    <div className="bg-gray-50 p-8 text-center text-gray-500 rounded border border-dashed border-gray-300">
                        No surveys are currently pending review.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Person ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pendingSurveys.map((survey: any) => (
                                    <tr key={survey.person_round_id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {survey.person_round_id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {survey.personid}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {survey.age_years}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => handleReview(survey.person_round_id, 'approve')}
                                                className="text-green-600 hover:text-green-900 font-medium mr-4"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(survey.person_round_id)}
                                                className="text-red-600 hover:text-red-900 font-medium"
                                            >
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}