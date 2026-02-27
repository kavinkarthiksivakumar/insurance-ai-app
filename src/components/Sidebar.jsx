import React from 'react';
import { NavLink } from 'react-router-dom';
import { FileText, LayoutDashboard, PlusSquare, BarChart3, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center space-x-3 px-6 py-3 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer ${isActive ? "bg-gray-800 text-white border-r-4 border-blue-500" : ""}`
    }
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </NavLink>
);

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <div className="w-64 bg-gray-900 h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <div className="flex items-center space-x-3 text-white mb-8">
          <img src="/logo.svg" alt="Insure Flow Logo" className="w-8 h-8" />
          <h1 className="text-xl font-bold">Insure Flow</h1>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        {user?.role === 'CUSTOMER' && (
          <NavItem to="/new-claim" icon={PlusSquare} label="New Claim" />
        )}
        <NavItem to="/claims" icon={FileText} label="Claims" />
        {/* Reports/Profile placeholders */}
        {user?.role === 'ADMIN' && (
          <NavItem to="/reports" icon={BarChart3} label="Reports" />
        )}
      </nav>

      <div className="p-6 border-t border-gray-800">
        <div className="flex items-center space-x-3 text-gray-400">
          <User size={20} />
          <div className="flex flex-col">
            <span className="text-sm text-white font-medium">{user?.name || user?.email}</span>
            <span className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
