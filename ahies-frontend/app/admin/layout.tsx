'use client';
import Link from 'next/link';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg fixed h-full z-10">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
                </div>
                
                <nav className="p-4 space-y-2">
                    <Link 
                        href="/admin/dashboard" 
                        className="block px-4 py-2 text-gray-700 bg-blue-50 rounded-md font-medium hover:bg-blue-100"
                    >
                        📊 Dashboard
                    </Link>
                    <Link 
                        href="/admin/configuration" 
                        className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    >
                        ⚙️ Config
                    </Link>
                    <Link 
                     href="/admin/users" 
                      className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    >
                     👤 Create Field User
                    </Link>
                    <Link 
                    href="/admin/citizens" 
                    className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                  >
                👥 View All Citizens
                </Link>      
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 ml-64">
                <header className="bg-white shadow-sm p-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Logged in as <span className="font-medium text-gray-800">Admin</span></span>
                        <form 
    onSubmit={async (e) => {
        e.preventDefault(); // Prevent the form from refreshing the page
        const response = await fetch('http://localhost:3000/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });
        if (response.ok) {
            window.location.href = 'http://localhost:3001/login'; // Redirect to frontend login
        }
    }}
>
    <button 
        type="submit"
        className="text-sm text-red-600 hover:text-red-800 font-medium"
    >
        Logout
    </button>
</form>
                    </div>
                </header>
                
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}