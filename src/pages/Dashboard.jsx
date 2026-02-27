import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllClaims, getMyClaims, deleteClaim } from '../api/claimsApi';
import { Link } from 'react-router-dom';
import { FileText, PlusSquare, TrendingUp, Clock, CheckCircle2, DollarSign, Trash2, MessageSquare } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    amount: 0,
    pending: 0,
    approved: 0
  });
  const [recentClaims, setRecentClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let data = [];
        if (user?.role === 'CUSTOMER') {
          data = await getMyClaims();
        } else {
          data = await getAllClaims();
        }

        // Ensure data is an array
        if (!Array.isArray(data)) {
          console.error('Claims data is not an array:', data);
          data = [];
        }

        const total = data.length;
        const amount = data.reduce((sum, c) => sum + (c.amount || 0), 0);
        const pending = data.filter(c => c.status === 'SUBMITTED' || c.status === 'IN_REVIEW').length;
        const approved = data.filter(c => c.status === 'APPROVED').length;

        setStats({ total, amount, pending, approved });
        // Get last 5 claims
        setRecentClaims(data.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate)).slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Set empty data on error
        setStats({ total: 0, amount: 0, pending: 0, approved: 0 });
        setRecentClaims([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading) return <div className="p-8">Loading stats...</div>;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Claims Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">
                {user?.role === 'AGENT' || user?.role === 'ADMIN' ? 'Total Claims' : 'Your Claims'}
              </p>
              <p className="text-4xl font-bold text-white mt-2">{stats.total}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <FileText className="text-white" size={28} />
            </div>
          </div>
        </div>

        {/* Total Amount Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium uppercase tracking-wide">Total Amount</p>
              <p className="text-4xl font-bold text-white mt-2">₹{stats.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <DollarSign className="text-white" size={28} />
            </div>
          </div>
        </div>

        {/* Pending Claims Card */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium uppercase tracking-wide">Pending</p>
              <p className="text-4xl font-bold text-white mt-2">{stats.pending}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Clock className="text-white" size={28} />
            </div>
          </div>
        </div>

        {/* Approved Claims Card */}
        <div className="bg-gradient-to-br from-green-500 to-teal-500 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium uppercase tracking-wide">Approved</p>
              <p className="text-4xl font-bold text-white mt-2">{stats.approved}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <CheckCircle2 className="text-white" size={28} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
          {user?.role === 'CUSTOMER' && (
            <Link to="/new-claim" className="flex items-center text-blue-600 hover:underline">
              <PlusSquare size={18} className="mr-2" />
              New Claim
            </Link>
          )}
          <Link to="/claims" className="flex items-center text-gray-500 hover:text-gray-700">
            View All
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-sm">
                <th className="pb-3 font-medium">Policy #</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
                {user?.role === 'CUSTOMER' && <th className="pb-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {recentClaims.map(claim => (
                <React.Fragment key={claim.id}>
                  <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="py-4 font-medium text-gray-800">{claim.policyNumber}</td>
                    <td className="py-4 text-gray-600">{claim.claimType?.name || '-'}</td>
                    <td className="py-4 text-gray-600">₹{claim.amount}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium 
                                              ${claim.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          claim.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="py-4 text-gray-500 text-sm">
                      {new Date(claim.submissionDate).toLocaleDateString()}
                    </td>
                    {user?.role === 'CUSTOMER' && (
                      <td className="py-4">
                        <button
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this claim?')) {
                              try {
                                await deleteClaim(claim.id);
                                // Refresh data
                                window.location.reload();
                              } catch (error) {
                                alert('Failed to delete claim: ' + (error.response?.data?.message || error.message));
                              }
                            }
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Delete claim"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
                  </tr>

                  {/* Agent Response Row - Shows only if there's a response */}
                  {claim.agentResponse && (claim.status === 'APPROVED' || claim.status === 'REJECTED') && (
                    <tr className="border-b border-gray-50">
                      <td colSpan={user?.role === 'CUSTOMER' ? "6" : "5"} className="py-3 px-4">
                        <div className={`flex items-start gap-3 p-4 rounded-lg border-l-4 ${claim.status === 'APPROVED'
                          ? 'bg-green-50 border-green-500'
                          : 'bg-red-50 border-red-500'
                          }`}>
                          <MessageSquare size={20} className={claim.status === 'APPROVED' ? 'text-green-600 flex-shrink-0' : 'text-red-600 flex-shrink-0'} />
                          <div className="flex-1">
                            <p className={`text-sm font-semibold mb-1 ${claim.status === 'APPROVED' ? 'text-green-800' : 'text-red-800'
                              }`}>
                              Agent Response:
                            </p>
                            <p className="text-sm text-gray-700">{claim.agentResponse}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {recentClaims.length === 0 && (
                <tr>
                  <td colSpan={user?.role === 'CUSTOMER' ? "6" : "5"} className="py-8 text-center text-gray-400">
                    <FileText size={48} className="mx-auto mb-2 opacity-20" />
                    No recent claims found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
