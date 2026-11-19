import React, { useState, useEffect } from 'react';
import { Users, UserPlus, ShieldCheck, Key, Lock, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

const ROLE_BADGES = {
  admin: { label: 'Administrator', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  pathologist: { label: 'Consultant Pathologist (MD)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  technician: { label: 'Lab Technician', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  receptionist: { label: 'Front Desk / Billing', color: 'bg-sky-100 text-sky-800 border-sky-200' },
  phlebotomist: { label: 'Phlebotomist / Collector', color: 'bg-purple-100 text-purple-800 border-purple-200' }
};

export const StaffUserManagementTab = () => {
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Add User Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('technician');
  const [phone, setPhone] = useState('');
  const [signatureImage, setSignatureImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const json = await res.json();
        setUsers(json.users || []);
      }
    } catch (err) {
      console.warn('Could not fetch staff accounts:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setSignatureImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setFeedback('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          fullName: fullName.trim(),
          role,
          phone: phone.trim(),
          signatureImage
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback(`✅ Staff account for "${username}" created successfully!`);
        setShowAddModal(false);
        setUsername('');
        setPassword('');
        setFullName('');
        setPhone('');
        setSignatureImage(null);
        fetchUsers();
      } else {
        setErrorMsg(json.error || 'Failed to create user account.');
      }
    } catch (err) {
      setErrorMsg('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <span>Staff Account Management & Role-Based Access Control (RBAC)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict NABL and ISO 15189 compliance: Each technician, doctor, and receptionist logs in with separate credentials and enforced role permissions.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={fetchUsers}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            title="Refresh User List"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
            <tr>
              <th className="p-3.5">User / Full Name</th>
              <th className="p-3.5">Assigned Role</th>
              <th className="p-3.5">Contact / Phone</th>
              <th className="p-3.5">Digital Stamp</th>
              <th className="p-3.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {users.map(u => {
              const roleInfo = ROLE_BADGES[u.role] || { label: u.role, color: 'bg-slate-100 text-slate-700' };
              return (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3.5">
                    <p className="font-bold text-slate-900">{u.full_name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">@{u.username}</p>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-600">
                    {u.phone || '—'}
                  </td>
                  <td className="p-3.5">
                    {u.signature_image ? (
                      <img src={u.signature_image} alt="Signature" className="h-6 max-w-[80px] object-contain border border-slate-200 rounded p-0.5 bg-white" />
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">None</span>
                    )}
                  </td>
                  <td className="p-3.5 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-indigo-700 font-bold text-base">
                <UserPlus className="h-5 w-5" />
                <span>Create New Staff Account</span>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. dr_sharma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma (MBBS, MD)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-900"
                  >
                    <option value="receptionist">Receptionist (Billing/Reg)</option>
                    <option value="phlebotomist">Phlebotomist (Blood Draw)</option>
                    <option value="technician">Lab Technician (Testing/QC)</option>
                    <option value="pathologist">Consultant Pathologist (MD)</option>
                    <option value="admin">Administrator (Full Access)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-slate-900"
                  />
                </div>
              </div>

              {role === 'pathologist' && (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                  <label className="font-bold text-emerald-950 block">Pathologist Digital Signature Stamp (PNG)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="text-xs text-slate-500"
                  />
                  {signatureImage && (
                    <img src={signatureImage} alt="Preview" className="h-10 border border-emerald-300 rounded bg-white p-1" />
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
