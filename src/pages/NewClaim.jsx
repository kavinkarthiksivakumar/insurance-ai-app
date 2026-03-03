import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createClaim, getClaimTypes } from '../api/claimsApi';
import { uploadDocument } from '../api/documentsApi';
import { Upload, X, CheckCircle } from 'lucide-react';

const NewClaim = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [types, setTypes] = useState([]);
  const [formData, setFormData] = useState({
    policyNumber: '',
    claimTypeId: '',
    amount: '',
    description: ''
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedClaimId, setSubmittedClaimId] = useState(null);

  // Auto-fill the policy number from the logged-in customer's profile
  useEffect(() => {
    if (user?.policyNumber) {
      setFormData(prev => ({ ...prev, policyNumber: user.policyNumber }));
    }
  }, [user]);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await getClaimTypes();
        if (res && res.length > 0) {
          setTypes(res);
        } else {
          setTypes([
            { id: 1, name: 'Auto Insurance' },
            { id: 2, name: 'Home Insurance' },
            { id: 3, name: 'Health Insurance' },
            { id: 4, name: 'Travel Insurance' }
          ]);
        }
      } catch (e) {
        setTypes([
          { id: 1, name: 'Auto Insurance' },
          { id: 2, name: 'Home Insurance' },
          { id: 3, name: 'Health Insurance' },
        ]);
      }
    };
    fetchTypes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Special handling for policyNumber field
    if (name === 'policyNumber') {
      // Ensure it always starts with "POL-"
      if (!value.startsWith('POL-')) {
        setFormData({ ...formData, policyNumber: 'POL-' });
        return;
      }

      // Extract the digits part after "POL-"
      const digitsOnly = value.slice(4).replace(/\D/g, ''); // Remove non-digit characters

      // Limit to 8 digits
      const limitedDigits = digitsOnly.slice(0, 8);

      setFormData({ ...formData, policyNumber: 'POL-' + limitedDigits });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create Claim
      const claim = await createClaim({
        ...formData,
        amount: parseFloat(formData.amount),
        claimTypeId: parseInt(formData.claimTypeId)
      });

      // 2. Upload Files
      if (claim && claim.id && files.length > 0) {
        for (const file of files) {
          await uploadDocument(claim.id, file);
        }
      }

      // 3. Mark as submitted — show success banner
      setSubmittedClaimId(claim.id);
      setSubmitted(true);
    } catch (error) {
      console.error('Claim submission error:', error);

      let errorMessage = 'Failed to submit claim. Please check your inputs.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data) {
        errorMessage = typeof error.response.data === 'string'
          ? error.response.data
          : error.response.data.error || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">File a New Claim</h2>


      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Policy Number</label>
              <input
                type="text"
                name="policyNumber"
                required
                readOnly
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                value={formData.policyNumber}
                onChange={handleChange}
                placeholder="Auto-filled from your account"
              />
              <p className="text-xs text-gray-500 mt-1">Your policy number is auto-filled from your account.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Claim Type</label>
              <select
                name="claimTypeId"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.claimTypeId}
                onChange={handleChange}
              >
                <option value="">Select Type</option>
                {types.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Claim Amount (₹)</label>
            <input
              type="number"
              name="amount"
              required
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Incident Description</label>
            <textarea
              name="description"
              required
              rows="4"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.description}
              onChange={handleChange}
              placeholder="Please describe what happened..."
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supporting Documents</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
              <input
                type="file"
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
              <Upload className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 text-sm">Click to upload or drag and drop</p>
              <p className="text-gray-400 text-xs mt-1">Images, PDF (Max 10MB)</p>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                    <span className="truncate">{file.name}</span>
                    <button type="button" onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>

      {/* Success banner — shown after claim submitted */}
      {submitted && (
        <div className="mt-8 bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
          <h3 className="text-xl font-bold text-green-800 mb-2">Claim Submitted Successfully!</h3>
          <p className="text-green-700 mb-1">Your claim <strong>#{submittedClaimId}</strong> has been received.</p>
          <p className="text-sm text-green-600 mb-6">
            Our team will review your documents and update you on the status shortly.
            You can track your claim status from the dashboard.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default NewClaim;
