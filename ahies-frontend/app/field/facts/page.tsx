// app/field/facts/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPerson } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function EnterFactsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [householdId, setHouseholdId] = useState('');
    const [educationLevels, setEducationLevels] = useState([]);
    const [regions, setRegions] = useState([]);

    useEffect(() => {
        fetchEducationLevels();
        fetchRegions();
    }, []);

    const fetchEducationLevels = async () => {
        try {
            const response = await fetch(`${API_URL}/api/lookups/education_level`, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setEducationLevels(data);
            }
        } catch (error) { console.error('Failed to load education levels'); }
    };

    const fetchRegions = async () => {
        try {
            const response = await fetch(`${API_URL}/api/lookups/region`, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setRegions(data);
            }
        } catch (error) { console.error('Failed to load regions'); }
    };

    // 1. Basic Person Info
    const [formData, setFormData] = useState({
        personid: '', sex: 'M', relationship_id: 1, age_years: '', age_months: 0, pop_weight: 100.0,
        date_of_birth: '', marital_status_id: '', religion: '', nationality: 'Ghanaian by birth',
        ethnicity_major: '', ethnicity_detail: '', created_by: 2
    });

    // 2. Migration State (NEW)
    const [migration, setMigration] = useState({
        born_in_this_town: false,
        born_region_id: '',
        resident_since_birth: false,
        years_in_town: '',
        prior_region_id: '',
        years_at_prior_residence: '',
        reason_for_moving: ''
    });

    // 3. Education State
    const [education, setEducation] = useState({
        ever_attended_school: false, highest_level_id: '', attended_past_3_months: false, still_in_school: false
    });

    // 4. Health State
    const [health, setHealth] = useState({
        illness_or_injury_2wk: false, consulted_practitioner: false, consulted_whom: '', facility_group: '',
        fee_consultation: 0, fee_drugs_treatment: 0, ever_registered_insurance: false, currently_covered: false
    });

    // 5. Disability State (NEW)
    const [disability, setDisability] = useState({
        difficulty_seeing: 'No difficulty', dificulty_hearing: 'No difficulty',
        difficulty_walking: 'No difficulty', difficulty_remembering: 'No difficulty',
        difficulty_selfcare: 'No difficulty', difficulty_communications: 'No difficulty'
    });

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleEducationChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setEducation({ ...education, [name]: type === 'checkbox' ? checked : value });
    };

    const handleHealthChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setHealth({ ...health, [name]: type === 'checkbox' ? checked : value });
    };

    const handleMigrationChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setMigration({ ...migration, [name]: type === 'checkbox' ? checked : value });
    };

    const handleDisabilityChange = (e: any) => {
        setDisability({ ...disability, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                household_round_id: parseInt(householdId),
                migration: migration,
                education: education,
                health: health,
                disability: disability
            };

            await createPerson(payload);
            alert('Full profile saved successfully!');
            // Reset all states...
            setFormData({ personid: '', sex: 'M', relationship_id: 1, age_years: '', age_months: 0, pop_weight: 100.0, date_of_birth: '', marital_status_id: '', religion: '', nationality: 'Ghanaian by birth', ethnicity_major: '', ethnicity_detail: '', created_by: 2 });
            setMigration({ born_in_this_town: false, born_region_id: '', resident_since_birth: false, years_in_town: '', prior_region_id: '', years_at_prior_residence: '', reason_for_moving: '' });
            setEducation({ ever_attended_school: false, highest_level_id: '', attended_past_3_months: false, still_in_school: false });
            setHealth({ illness_or_injury_2wk: false, consulted_practitioner: false, consulted_whom: '', facility_group: '', fee_consultation: 0, fee_drugs_treatment: 0, ever_registered_insurance: false, currently_covered: false });
            setDisability({ difficulty_seeing: 'No difficulty', dificulty_hearing: 'No difficulty', difficulty_walking: 'No difficulty', difficulty_remembering: 'No difficulty', difficulty_selfcare: 'No difficulty', difficulty_communications: 'No difficulty' });
            setHouseholdId('');
        } catch (error: any) {
            alert(error.message || 'Failed to add person.');
        } finally {
            setLoading(false);
        }
    };

       return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Enter Citizen Facts</h1>
                <button onClick={() => router.push('/field/dashboard')} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">← Back</button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* SECTION 1: HOUSEHOLD & BASIC INFO */}
                    <div className="border-b border-gray-200 pb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">1. Household & Basic Info</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-900">Household Round ID <span className="text-red-500">*</span></label>
                            <input type="number" required value={householdId} onChange={(e) => setHouseholdId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900">Person ID <span className="text-red-500">*</span></label>
                                <input type="text" name="personid" required value={formData.personid} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900">Age (Years) <span className="text-red-500">*</span></label>
                                <input type="number" name="age_years" required value={formData.age_years} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900">Sex</label>
                                <select name="sex" value={formData.sex} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900">
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900">Marital Status</label>
                                <input type="number" name="marital_status_id" value={formData.marital_status_id} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900" placeholder="e.g. 1" />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: MIGRATION */}
                    <div className="border-b border-gray-200 pb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">2. Migration History</h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" name="born_in_this_town" checked={migration.born_in_this_town} onChange={handleMigrationChange} />
                                <label className="text-sm font-medium text-gray-900">Born in this town/village?</label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900">Born in another Region</label>
                                <select name="born_region_id" value={migration.born_region_id} onChange={handleMigrationChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900">
                                    <option value="">-- Select Region --</option>
                                    {regions.map((r: any) => <option key={r.region_id} value={r.region_id}>{r.region_name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: EDUCATION */}
                    <div className="border-b border-gray-200 pb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">3. Education</h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" name="ever_attended_school" checked={education.ever_attended_school} onChange={handleEducationChange} />
                                <label className="text-sm font-medium text-gray-900">Ever attended school?</label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900">Highest Level Attained</label>
                                <select name="highest_level_id" value={education.highest_level_id} onChange={handleEducationChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900">
                                    <option value="">-- Select Level --</option>
                                    {educationLevels.map((level: any) => <option key={level.level_id} value={level.level_id}>{level.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: HEALTH */}
                    <div className="border-b border-gray-200 pb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">4. Health</h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" name="illness_or_injury_2wk" checked={health.illness_or_injury_2wk} onChange={handleHealthChange} />
                                <label className="text-sm font-medium text-gray-900">Illness or injury in the past 2 weeks?</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" name="consulted_practitioner" checked={health.consulted_practitioner} onChange={handleHealthChange} />
                                <label className="text-sm font-medium text-gray-900">Consulted a health practitioner?</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" name="ever_registered_insurance" checked={health.ever_registered_insurance} onChange={handleHealthChange} />
                                <label className="text-sm font-medium text-gray-900">Ever registered for health insurance?</label>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 5: DISABILITY */}
                    <div className="border-b border-gray-200 pb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">5. Disability</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { key: 'difficulty_seeing', label: 'Seeing (even with glasses)' },
                                { key: 'dificulty_hearing', label: 'Hearing (even with aid)' },
                                { key: 'difficulty_walking', label: 'Walking/Climbing stairs' },
                                { key: 'difficulty_remembering', label: 'Remembering/Concentrating' },
                                { key: 'difficulty_selfcare', label: 'Self-care (washing/dressing)' },
                                { key: 'difficulty_communications', label: 'Communicating (usual language)' },
                            ].map((field) => (
                                <div key={field.key}>
                                    <label className="block text-sm font-medium text-gray-900">{field.label}</label>
                                    <select name={field.key} value={disability[field.key as keyof typeof disability]} onChange={handleDisabilityChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900">
                                        <option value="No difficulty">No difficulty</option>
                                        <option value="Yes, some difficulty">Yes, some difficulty</option>
                                        <option value="Yes, a lot of difficulty">Yes, a lot of difficulty</option>
                                        <option value="Cannot do at all">Cannot do at all</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50">
                        {loading ? 'Saving...' : 'Save Full Citizen Profile'}
                    </button>
                </form>
            </div>
        </div>
    )};