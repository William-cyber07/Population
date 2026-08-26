// app/persons/[id]/page.tsx
import { getPersonFullProfile } from '@/lib/api';

export default async function PersonProfile({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const parsedId = parseInt(id);

    // Fetch the FULL profile, not just the basic list
    const person = await getPersonFullProfile(parsedId);

    if (!person) {
        return (
            <main className="min-h-screen p-8 bg-gray-50">
                <h1 className="text-2xl font-bold text-red-600">Person Not Found</h1>
                <p className="mt-4 text-gray-600">No profile found with ID {parsedId}.</p>
                <a href="/" className="mt-4 inline-block text-blue-600 underline">Go back home</a>
            </main>
        );
    }

    return (
        <main className="min-h-screen p-8 bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Person Profile: {person.personid}</h1>
                    <a href="/" className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">← Back</a>
                </div>

                {/* --- BASIC INFO CARD --- */}
                <div className="bg-white shadow-md rounded-lg p-6 grid grid-cols-2 gap-4 mb-6">
                    <div className="border-b pb-2">
                        <span className="text-sm text-gray-500 block">ID</span>
                        <span className="font-medium">{person.person_round_id}</span>
                    </div>
                    <div className="border-b pb-2">
                        <span className="text-sm text-gray-500 block">Person Code</span>
                        <span className="font-medium">{person.personid}</span>
                    </div>
                    <div className="border-b pb-2">
                        <span className="text-sm text-gray-500 block">Sex</span>
                        <span className="font-medium">{person.sex === 'M' ? 'Male' : 'Female'}</span>
                    </div>
                    <div className="border-b pb-2">
                        <span className="text-sm text-gray-500 block">Age (Years)</span>
                        <span className="font-medium">{person.age_years}</span>
                    </div>
                </div>

                {/* --- EDUCATION CARD --- */}
                <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Education</h2>
                    {person.ever_attended_school ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-gray-500 block">Highest Level ID</span>
                                <span className="font-medium">{person.highest_level_id || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 block">Attended past 3 months</span>
                                <span className="font-medium">{person.attended_past_3_months ? 'Yes' : 'No'}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No education record found for this person.</p>
                    )}
                </div>

                {/* --- HEALTH CARD --- */}
                <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Health</h2>
                    {person.illness_or_injury_2wk ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-gray-500 block">Sought Practitioner?</span>
                                <span className="font-medium">{person.consulted_practitioner ? 'Yes' : 'No'}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 block">Main Sector</span>
                                <span className="font-medium">{person.sector || 'N/A'}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No recent illness/injury reported.</p>
                    )}
                </div>

                {/* --- EMPLOYMENT CARD --- */}
                <div className="bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Employment</h2>
                    {person.job_status ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-gray-500 block">Job Status</span>
                                <span className="font-medium">{person.job_status}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 block">Sector</span>
                                <span className="font-medium">{person.sector}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No employment record found.</p>
                    )}
                </div>

            </div>
        </main>
    );
}