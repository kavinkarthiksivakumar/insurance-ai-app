import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllClaims, getMyClaims, updateClaimStatus, getClaimDetails } from '../api/claimsApi';
import { FileText, Shield, Filter } from 'lucide-react';
import AgentClaimWorkspace from '../components/AgentClaimWorkspace';

const StatusBadge = ({ status }) => {
  const cfg = {
    APPROVED: 'bg-green-100 text-green-700 border-green-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
    SUBMITTED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    IN_REVIEW: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cfg[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  );
};

const Claims = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [workspaceClaim, setWorkspaceClaim] = useState(null);
  const [workspaceDetails, setWorkspaceDetails] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  const fetchClaims = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = user?.role === 'CUSTOMER' ? await getMyClaims() : await getAllClaims();
      setClaims(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching claims:', err);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const openWorkspace = async (claim) => {
    setWorkspaceLoading(true);
    try {
      const details = await getClaimDetails(claim.id);
      setWorkspaceClaim(claim);
      setWorkspaceDetails(details);
    } catch {
      alert('Could not load claim details.');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleApprove = async (id, responseText) => {
    await updateClaimStatus(id, 'APPROVED', responseText);
    fetchClaims();
  };

  const handleReject = async (id, responseText) => {
    await updateClaimStatus(id, 'REJECTED', responseText);
    fetchClaims();
  };

  const filteredClaims = filter === 'ALL' ? claims : claims.filter(c => c.status === filter);
  const isAgent = user?.role === 'AGENT' || user?.role === 'ADMIN';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-gray-500">Loading claims…</p>
      </div>
    </div>
  );

  return (
    <div>
      {/* Agent Workspace Modal */}
      {workspaceClaim && workspaceDetails && (
        <AgentClaimWorkspace
          claim={workspaceClaim}
          claimDetails={workspaceDetails}
          user={user}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => { setWorkspaceClaim(null); setWorkspaceDetails(null); }}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            {isAgent ? 'Claims Management' : 'My Claims'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-400"
          >
            <option value="ALL">All Status</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-500 text-sm">Policy #</th>
              {isAgent && <th className="p-4 font-semibold text-gray-500 text-sm">Customer</th>}
              <th className="p-4 font-semibold text-gray-500 text-sm">Type</th>
              <th className="p-4 font-semibold text-gray-500 text-sm">Amount</th>
              <th className="p-4 font-semibold text-gray-500 text-sm">Status</th>
              <th className="p-4 font-semibold text-gray-500 text-sm">Date</th>
              <th className="p-4 font-semibold text-gray-500 text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClaims.map(claim => (
              <tr key={claim.id} className="border-b border-gray-50 hover:bg-blue-50 transition-colors">
                <td className="p-4 font-mono font-medium text-sm text-gray-800">{claim.policyNumber}</td>
                {isAgent && (
                  <td className="p-4 text-gray-600 text-sm">
                    {claim.customer?.name || claim.customer?.email || '—'}
                  </td>
                )}
                <td className="p-4 text-sm text-gray-700">{claim.claimType?.name || '—'}</td>
                <td className="p-4 font-semibold text-gray-900">₹{claim.amount?.toLocaleString()}</td>
                <td className="p-4"><StatusBadge status={claim.status} /></td>
                <td className="p-4 text-sm text-gray-500">
                  {new Date(claim.submissionDate).toLocaleDateString('en-IN')}
                </td>
                <td className="p-4">
                  {isAgent ? (
                    <button
                      onClick={() => openWorkspace(claim)}
                      disabled={workspaceLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-60"
                    >
                      <Shield size={14} />
                      {workspaceLoading ? 'Loading…' : 'Review'}
                    </button>
                  ) : (
                    <div className="text-xs text-gray-500">
                      {claim.agentResponse ? (
                        <span className={`font-medium ${claim.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'}`}>
                          {claim.status === 'APPROVED' ? '✓ Approved' : '✗ Rejected'}
                        </span>
                      ) : (
                        <span className="text-yellow-600">⏳ Pending review</span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredClaims.length === 0 && (
              <tr>
                <td colSpan={isAgent ? 7 : 6} className="p-12 text-center text-gray-400">
                  <FileText size={36} className="mx-auto mb-3 opacity-30" />
                  <p>No claims found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Customer: show agent response if available */}
      {!isAgent && filteredClaims.some(c => c.agentResponse) && (
        <div className="mt-4 space-y-3">
          {filteredClaims.filter(c => c.agentResponse).map(c => (
            <div
              key={c.id}
              className={`p-4 rounded-xl border-2 ${c.status === 'APPROVED' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
            >
              <p className="font-bold text-sm mb-1">
                {c.status === 'APPROVED' ? '✓' : '✗'} Claim #{c.id} — Agent Response:
              </p>
              <p className="text-gray-700 text-sm">{c.agentResponse}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Claims;
