import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
    const location = useLocation();

    // Map path to Title
    const getTitle = (pathname) => {
        if (pathname.includes('/dashboard')) return 'Dashboard';
        if (pathname.includes('/new-claim')) return 'New Claim';
        if (pathname.includes('/claims')) return 'Claims Management';
        if (pathname.includes('/reports')) return 'Reports';
        return 'Insurance App';
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col">
                <Header title={getTitle(location.pathname)} />
                <main className="flex-1 p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
