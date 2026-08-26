'use client'; 

import { useState } from 'react';
import Link from 'next/link';

export default function PersonSearch({ initialPersons }) {
    
    const [searchTerm, setSearchTerm] = useState('');


    const filteredPersons = initialPersons.filter((person) => {
        const searchString = searchTerm.toLowerCase();
        return (
            person.personid.toLowerCase().includes(searchString) ||
            person.person_round_id.toString().includes(searchString) ||
            person.age_years.toString().includes(searchString)
        );
    });

    return (
        <div>
            {/* Search Input Bar */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search by Person ID or Age..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
            </div>

            {/* The Table */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Person ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sex</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPersons.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                    {initialPersons.length === 0 ? 'No persons in the database yet.' : 'No matching records found.'}
                                </td>
                            </tr>
                        ) : (
                            filteredPersons.map((person) => (
                                <tr key={person.person_round_id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <Link href={`/persons/${person.person_round_id}`} className="text-blue-600 hover:underline font-medium">
                                            {person.person_round_id}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {person.personid}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {person.sex === 'M' ? 'Male' : (person.sex === 'F' ? 'Female' : 'Unknown')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {person.age_years}
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