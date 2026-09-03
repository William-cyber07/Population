// app/admin/citizens/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function AdminCitizensPage() {
    const [citizens, setCitizens] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCitizens();
    }, []);

    const fetchCitizens = async () => {
        try {
            const response = await fetch(`${API_URL}/api/persons`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setCitizens(data);
            }
        } catch (error) {
            console.error('Failed to fetch citizens');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">All Citizens Data</h1>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Person ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sex</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-4 text-center">Loading...</td></tr>
                        ) : citizens.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No citizens found in the database.</td></tr>
                        ) : (
                            citizens.map((citizen: any) => (
                                <tr key={citizen.person_round_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{citizen.person_round_id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{citizen.personid}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{citizen.sex === 'M' ? 'Male' : 'Female'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{citizen.age_years}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <Link 
                                            href={`/admin/citizens/${citizen.person_round_id}`}
                                            className="text-blue-600 hover:underline font-medium"
                                        >
                                            View Full Profile
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}