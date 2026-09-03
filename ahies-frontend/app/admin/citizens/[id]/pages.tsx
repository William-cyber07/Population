// app/admin/citizens/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function AdminCitizenProfilePage() {
    const params = useParams();
    const personRoundId = params.id;
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await fetch(`${API_URL}/api/persons-full/${personRoundId}`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setProfile(data);
            }
        } catch (error) {
            console.error('Failed to fetch profile');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-6 text-center">Loading...</div>;
    if (!profile) return <div className="p-6 text-center text-red-500">Profile not found.</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Full Profile: {profile.personid}</h1>
                <Link href="/admin/citizens" className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">
                    ← Back to List
                </Link>
            </div>

            {/* Basic Info Card */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Basic Information</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div><span className="text-gray-500">ID:</span> {profile.person_round_id}</div>
                    <div><span className="text-gray-500">Sex:</span> {profile.sex === 'M' ? 'Male' : 'Female'}</div>
                    <div><span className="text-gray-500">Age:</span> {profile.age_years} years</div>
                    <div><span className="text-gray-500">Status:</span> <span className="font-semibold">{profile.status}</span></div>
                </div>
            </div>

            {/* Education Card */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Education</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div><span className="text-gray-500">Ever attended school:</span> {profile.ever_attended_school ? 'Yes' : 'No'}</div>
                    <div><span className="text-gray-500">Highest Level ID:</span> {profile.highest_level_id || 'N/A'}</div>
                </div>
            </div>

            {/* Health Card */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Health</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div><span className="text-gray-500">Illness/Injury (2 weeks):</span> {profile.illness_or_injury_2wk ? 'Yes' : 'No'}</div>
                    <div><span className="text-gray-500">Consulted Practitioner:</span> {profile.consulted_practitioner ? 'Yes' : 'No'}</div>
                </div>
            </div>

            {/* Employment Card */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Employment</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div><span className="text-gray-500">Sector:</span> {profile.sector || 'N/A'}</div>
                    <div><span className="text-gray-500">Job Status:</span> {profile.job_status || 'N/A'}</div>
                </div>
            </div>
        </div>
    );
}