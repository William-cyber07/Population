// app/page.tsx
import { getPersons } from '@/lib/api';
import AddPersonForm from '@/components/AddPersonForm';
import PersonSearch from '@/components/PersonSearch'; // <--- Import our new component

export default async function Home() {
    const persons = await getPersons();

    return (
        <main className="min-h-screen p-8 bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">
                    Population Dashboard
                </h1>

                {/* Pass the server-fetched data to the Client Component */}
                <PersonSearch initialPersons={persons} />

                <AddPersonForm />
            </div>
        </main>
    );
}