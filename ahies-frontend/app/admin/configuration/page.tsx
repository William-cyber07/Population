// app/admin/configuration/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// List of all your lookup tables
const LOOKUP_TABLES = [
    { name: 'region', label: 'Regions', idCol: 'region_id' },
    { name: 'district', label: 'Districts', idCol: 'district_id' },
    { name: 'marital_status', label: 'Marital Status', idCol: 'status_id' },
    { name: 'relationship_to_head', label: 'Relationship to Head', idCol: 'relationship_id' },
    { name: 'education_level', label: 'Education Levels', idCol: 'level_id' },
    { name: 'activity_type', label: 'Activity Types', idCol: 'activity_type_id' },
    { name: 'expense_item', label: 'Expense Items', idCol: 'expense_item_id' },
    { name: 'workplace_condition_item', label: 'Workplace Conditions', idCol: 'condition_id' }
];

export default function ConfigurationPage() {
    const router = useRouter();
    const [selectedTable, setSelectedTable] = useState('');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newItem, setNewItem] = useState('');
    const [regions, setRegions] = useState([]);
    const [selectedRegionId, setSelectedRegionId] = useState('');

    useEffect(() => {
        if (!selectedTable) return;
        fetchData();
        if (selectedTable === 'district') {
            fetchRegions();
        }
    }, [selectedTable]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/lookups/${selectedTable}`, {
                credentials: 'include',
            });
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (error) {
            alert('Failed to load lookup data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchRegions = async () => {
        try {
            const response = await fetch(`${API_URL}/api/lookups/region`, {
                credentials: 'include',
            });
            if (response.ok) {
                const result = await response.json();
                setRegions(result);
            }
        } catch (error) {
            console.error('Failed to load regions');
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return alert('Please enter a label.');

        try {
            let payload: any = {};

            if (selectedTable === 'region') {
                payload = { region_name: newItem };
            } 
            else if (selectedTable === 'district') {
                if (!selectedRegionId) return alert('Please select a Region for this District.');
                payload = { district_name: newItem, region_id: parseInt(selectedRegionId) };
            } 
            else {
                payload = { label: newItem };
            }

            const response = await fetch(`${API_URL}/api/lookups/${selectedTable}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include',
            });
            
            if (response.ok) {
                setNewItem('');
                setSelectedRegionId('');
                fetchData();
                router.refresh();
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to add item.');
            }
        } catch (error) {
            alert('Failed to add item.');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            const response = await fetch(`${API_URL}/api/lookups/${selectedTable}/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (response.ok) {
                fetchData();
                router.refresh();
            } else {
                alert('Failed to delete item. Make sure it is not being used!');
            }
        } catch (error) {
            alert('Failed to delete item.');
        }
    };

    const tableConfig = LOOKUP_TABLES.find(t => t.name === selectedTable);
    const idColumn = tableConfig ? tableConfig.idCol : 'id';

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">System Configuration</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700">Select a Table to Manage</label>
                    <select
                        value={selectedTable}
                        onChange={(e) => setSelectedTable(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                    >
                        <option value="">-- Choose a table --</option>
                        {LOOKUP_TABLES.map((t) => (
                            <option key={t.name} value={t.name}>{t.label}</option>
                        ))}
                    </select>
                </div>

                {selectedTable && (
                    <div>
                        <form onSubmit={handleAdd} className="flex flex-col gap-4 mb-6">
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Enter new label..."
                                    value={newItem}
                                    onChange={(e) => setNewItem(e.target.value)}
                                    className="flex-1 rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                                />
                                <button
                                    type="submit"
                                    className="bg-green-600 text-white font-semibold py-2 px-6 rounded hover:bg-green-700"
                                >
                                    Add
                                </button>
                            </div>
                            
                            {/* REGION DROPDOWN FOR DISTRICTS */}
                            {selectedTable === 'district' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Region</label>
                                    <select
                                        value={selectedRegionId}
                                        onChange={(e) => setSelectedRegionId(e.target.value)}
                                        className="w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                                    >
                                        <option value="">-- Select a Region --</option>
                                        {regions.map((region: any) => (
                                            <option key={region.region_id} value={region.region_id}>
                                                {region.region_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </form>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 border">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td colSpan={3} className="px-6 py-4 text-center">Loading...</td></tr>
                                    ) : data.length === 0 ? (
                                        <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">No records found.</td></tr>
                                    ) : (
                                        data.map((row: any, index: number) => {
                                            const idValue = Number(row[idColumn]);
                                            const safeKey = (idValue && idValue > 0) ? idValue : `row-${index}`;
                                            return (
                                                <tr key={safeKey}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{idValue}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {row.label || row.region_name || row.district_name || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <button
                                                            onClick={() => handleDelete(idValue)}
                                                            className="text-red-600 hover:text-red-900 font-medium"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}