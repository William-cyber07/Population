// components/AddPersonForm.js
'use client'; // <--- 1. Must be at the very top

import { useState } from 'react'; // <--- 2. THIS IS THE MISSING LINE!
import { createPerson } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function AddPersonForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        personid: '',
        sex: 'M',
        relationship_id: 1,
        age_years: '',
    });

   
    const household_round_id = 2; 
    const age_months = 0;
    const pop_weight = 100.0;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = { 
                ...formData, 
                household_round_id, 
                age_months, 
                pop_weight: parseFloat(pop_weight)
            };
            
            await createPerson(payload);
            setFormData({ personid: '', sex: 'M', relationship_id: 1, age_years: '' });
            router.refresh();
            alert('Person created successfully!');
        } catch (error) {
            alert('Failed to create person.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 shadow-md rounded-lg mt-8">
            <h2 className="text-xl font-semibold mb-4">Add New Person</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Person ID</label>
                        <input
                         type="text"
                         name="personid"
                         required
                         value={formData.personid}
                         onChange={handleChange}
                         className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                         placeholder="e.g. PID004"
                        />
                    </div>
                    <div>

                    <input
                    type="number"
                      name="age_years"
                      required
                      value={formData.age_years}
                     onChange={handleChange}
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                      placeholder="e.g. 25"
                    />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Sex</label>
                    <select
                        name="sex"
                        value={formData.sex}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                    >
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                    </select>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Add Person'}
                </button>
            </form>
        </div>
    );
}