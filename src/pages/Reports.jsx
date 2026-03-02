import React, { useEffect, useState } from 'react';
import { getAdminStats } from '../api/claimsApi';
import api from '../api/axiosConfig';
import {
  Users, UserCheck, Shield, FileText, Clock, CheckCircle2, XCircle, DollarSign,
  TrendingUp, BarChart3, RefreshCw, AlertCircle
} from 'lucide-react';

// ─── Tiny stat card ───────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, subLabel }) => (
  <div className={`bg-gradient-to-br ${color} p-5 rounded-2xl shadow-lg`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        {subLabel && <p className="text-white/70 text-xs mt-1">{subLabel}</p>}
      </div>
      <div className="bg-white/20 p-3 rounded-xl">
        <Icon className="text-white" size={24} />
      </div>
    </div>
  </div>
);

// ─── Horizontal bar row ───────────────────────────────────────────────────────
const BarRow = ({ label, value, total, color }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm text-gray-700 mb-1 font-medium">
        <span>{label}</span>
        <span>{value} <span className="text-gray-400">({pct}%)</span></span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── Role badge ───────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const map = {
    ADMIN: 'bg-purple-100 text-purple-700',
    AGENT: 'bg-blue-100 text-blue-700',
    CUSTOMER: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[role] ?? 'bg-gray-100 text-gray-600'}`}>
      {role}
    </span>
  );
};

// ─── Main Reports page ────────────────────────────────────────────────────────
export default function Reports() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, usersResp] = await Promise.all([
        getAdminStats(),
        api.get('/users'),
      ]);
      setStats(statsData);
      setUsers(Array.isArray(usersResp.data) ? usersResp.data : []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      setError('Failed to load stats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <RefreshCw className="animate-spin" size={32} />
          <p className="font-medium">Loading admin stats…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-red-500">
          <AlertCircle size={40} />
          <p className="font-medium">{error}</p>
          <button
            onClick={fetchAll}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    totalClaims = 0, totalAmount = 0,
    byStatus = {}, byType = {},
    totalUsers = 0, totalCustomers = 0, totalAgents = 0, totalAdmins = 0,
    recentClaims = [],
  } = stats || {};

  const approved = byStatus['APPROVED'] ?? 0;
  const rejected = byStatus['REJECTED'] ?? 0;
  const pending = byStatus['SUBMITTED'] ?? 0;
  const inReview = byStatus['IN_REVIEW'] ?? 0;

  return (
    <div className="space-y-8">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Admin Reports &amp; Analytics</h2>
          {lastRefreshed && (
            <p className="text-xs text-gray-400 mt-1">
              Last refreshed: {lastRefreshed.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600 shadow-sm transition"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* ── User KPI cards ─────────────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">User Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Users" value={totalUsers} color="from-indigo-500 to-indigo-600" />
          <StatCard icon={UserCheck} label="Customers" value={totalCustomers} color="from-emerald-500 to-emerald-600" />
          <StatCard icon={Shield} label="Agents" value={totalAgents} color="from-blue-500 to-blue-600" />
          <StatCard icon={Shield} label="Admins" value={totalAdmins} color="from-purple-500 to-purple-600" />
        </div>
      </section>

      {/* ── Claims KPI cards ───────────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Claims Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FileText} label="Total Claims" value={totalClaims} color="from-gray-700 to-gray-800" />
          <StatCard icon={CheckCircle2} label="Approved" value={approved} color="from-green-500 to-teal-500" />
          <StatCard icon={Clock} label="Pending" value={pending + inReview} color="from-amber-500 to-orange-500" subLabel={`${pending} submitted · ${inReview} in review`} />
          <StatCard icon={XCircle} label="Rejected" value={rejected} color="from-red-500 to-rose-500" />
        </div>
      </section>

      {/* ── Total Amount banner ────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <DollarSign className="text-white" size={28} />
          </div>
          <div>
            <p className="text-white/70 text-sm font-medium">Total Claim Amount Filed</p>
            <p className="text-white text-3xl font-bold">
              ₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
        <div className="hidden md:block text-right text-white/60 text-sm">
          <p>Avg per claim</p>
          <p className="text-white text-lg font-semibold">
            ₹{totalClaims > 0 ? Math.round(totalAmount / totalClaims).toLocaleString('en-IN') : 0}
          </p>
        </div>
      </div>

      {/* ── Breakdown charts (status + type) ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Claims by Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-indigo-500" />
            <h3 className="font-semibold text-gray-800">Claims by Status</h3>
          </div>
          {totalClaims === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No claims yet</p>
          ) : (
            <>
              <BarRow label="Approved" value={approved} total={totalClaims} color="bg-green-500" />
              <BarRow label="Submitted" value={pending} total={totalClaims} color="bg-amber-400" />
              <BarRow label="In Review" value={inReview} total={totalClaims} color="bg-blue-400" />
              <BarRow label="Rejected" value={rejected} total={totalClaims} color="bg-red-400" />
            </>
          )}
        </div>

        {/* Claims by Type */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={18} className="text-purple-500" />
            <h3 className="font-semibold text-gray-800">Claims by Type</h3>
          </div>
          {Object.keys(byType).length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No data</p>
          ) : (
            Object.entries(byType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count], i) => {
                const colours = ['bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-pink-500', 'bg-orange-400'];
                return (
                  <BarRow key={type} label={type} value={count} total={totalClaims} color={colours[i % colours.length]} />
                );
              })
          )}
        </div>
      </div>

      {/* ── Registered Users table ─────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users size={18} className="text-gray-500" />
          <h3 className="font-semibold text-gray-800">Registered Users ({users.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
                <th className="pb-3 font-semibold">Name</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold">Policy #</th>
                <th className="pb-3 font-semibold">Phone</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="py-3 font-medium text-gray-800">{u.name || '—'}</td>
                  <td className="py-3 text-gray-500">{u.email}</td>
                  <td className="py-3"><RoleBadge role={u.role} /></td>
                  <td className="py-3 text-gray-500 font-mono text-xs">{u.policyNumber || '—'}</td>
                  <td className="py-3 text-gray-500">{u.phoneNumber || '—'}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
