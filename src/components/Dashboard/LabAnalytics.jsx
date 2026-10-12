import React from 'react';
import { useLab } from '../../context/LabContext';
import {
  Users,
  IndianRupee,
  TestTube2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  FileText,
  Activity,
  Flame,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';

export const LabAnalytics = () => {
  const { patients, setActiveTab, setSelectedPatientId } = useLab();

  // Metrics
  const totalPatients = (patients || []).length;
  const totalRevenue = (patients || []).reduce((acc, p) => acc + (p?.billing?.paidAmount || 0), 0);
  const pendingCollection = (patients || []).filter(p => p?.status === 'REGISTERED' || (p?.samples && p.samples.some(s => s.status === 'PENDING_COLLECTION'))).length;
  const inTesting = (patients || []).filter(p => p?.status === 'IN_TESTING' || p?.status === 'COLLECTED').length;
  const pendingApproval = (patients || []).filter(p => p?.status === 'PENDING_APPROVAL').length;
  const authorized = (patients || []).filter(p => p?.status === 'AUTHORIZED').length;
  const urgentCount = (patients || []).filter(p => p?.urgentTat).length;

  // Department Load Chart Data
  const deptData = [
    { name: 'Hematology', samples: 14, tatAvg: '1.2h', fill: '#8b5cf6' },
    { name: 'Biochemistry', samples: 22, tatAvg: '2.4h', fill: '#f59e0b' },
    { name: 'Immunology', samples: 9, tatAvg: '3.1h', fill: '#0ea5e9' },
    { name: 'Clinical Path', samples: 6, tatAvg: '0.8h', fill: '#10b981' },
    { name: 'Microbiology', samples: 4, tatAvg: '24.0h', fill: '#f43f5e' }
  ];

  // Status Distribution Pie
  const statusData = [
    { name: 'Registered', value: pendingCollection, color: '#94a3b8' },
    { name: 'Testing', value: inTesting, color: '#f59e0b' },
    { name: 'Dr Review', value: pendingApproval, color: '#f43f5e' },
    { name: 'Authorized', value: authorized, color: '#10b981' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-lg shadow-sky-950/20">
        <div>
          <div className="flex items-center space-x-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" />
            <span>Modern Diagnostic Intelligence • ISO 15189:2022 Compliant</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Laboratory Operational Hub</h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Real-time NABL compliance tracking, analyzer queue status, urgent sample prioritization, and doctor sign-off workflows.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('registration')}
            className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all flex items-center space-x-2 shrink-0"
          >
            <span>+ New Patient Intake</span>
          </button>
          <button
            onClick={() => setActiveTab('doctor')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs border border-white/20 transition-all flex items-center space-x-2 shrink-0"
          >
            <span>Sign-off Queue ({pendingApproval})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Today's Intake</span>
            <Users className="h-4 w-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalPatients}</p>
          <div className="flex items-center space-x-1 text-[11px] text-emerald-600 font-medium mt-1">
            <TrendingUp className="h-3 w-3" />
            <span>+18% vs yesterday</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Paid Revenue</span>
            <IndianRupee className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">₹{totalRevenue.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Live POS & B2B collections</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Phleb</span>
            <TestTube2 className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-700 mt-2">{pendingCollection}</p>
          <span className="text-[11px] text-purple-600/80 font-medium mt-1 block">Awaiting sample draw</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>In Testing</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{inTesting}</p>
          <span className="text-[11px] text-amber-600/80 font-medium mt-1 block">On analyzer worklist</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-rose-700 text-xs font-bold">
            <span>Pending Review</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{pendingApproval}</p>
          <span className="text-[11px] text-rose-600/80 font-semibold mt-1 block">Doctor sign-off needed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-bold">
            <span>Reports Ready</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{authorized}</p>
          <span className="text-[11px] text-emerald-600/80 font-medium mt-1 block">Ready for WhatsApp/PDF</span>
        </div>

      </div>

      {/* Analytics Charts & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Department Workload Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Departmental Workload & Turnaround Time</h2>
              <p className="text-xs text-slate-500">Live sample volume per laboratory department today</p>
            </div>
            <span className="text-xs bg-slate-100 font-semibold text-slate-700 px-2.5 py-1 rounded-lg">
              Avg TAT: 2.8 hrs
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="samples" radius={[6, 6, 0, 0]} name="Samples Processed">
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Lab Status Ratio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Patient Pipeline Breakdown</h2>
            <p className="text-xs text-slate-500">Current state of today's accessions</p>
          </div>

          <div className="h-44 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {statusData.map(item => (
              <div key={item.name} className="flex items-center space-x-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-600 truncate">{item.name}:</span>
                <span className="font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Live Patient Flow Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Active Patient Queue</h2>
            <p className="text-xs text-slate-500">End-to-end diagnostic tracking from intake to sign-off</p>
          </div>
          <div className="flex items-center space-x-2">
            {urgentCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                <Flame className="h-3 w-3 mr-1 fill-rose-600" /> {urgentCount} Urgent STAT Cases
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Patient / UHID</th>
                <th className="px-4 py-3">Age / Sex</th>
                <th className="px-4 py-3">Referral / Source</th>
                <th className="px-4 py-3">Assigned Tests</th>
                <th className="px-4 py-3">Sample Tubes</th>
                <th className="px-4 py-3">Workflow Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!patients || patients.length === 0) ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">No Patient Records Yet</p>
                    <p className="text-xs text-slate-400 mt-1">Register your first patient via the Test Registration tab to track live clinical workflows.</p>
                  </td>
                </tr>
              ) : (
                patients.map(p => {
                  const isUrgent = p?.urgentTat;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-2">
                        {isUrgent && <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>}
                        <div>
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="text-[11px] font-mono text-slate-400">{p.uhid}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {p.age} {p.ageType} • {p.gender}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-slate-800 font-medium">{p.referringDoctor}</p>
                      <span className="text-[10px] text-slate-400">{p.b2bCenter}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(p.tests || []).map((tId, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                            {typeof tId === 'string' ? tId.replace('TEST_', '') : (tId?.name || tId?.testId || 'Test')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-1">
                        {(p.samples || []).map(s => (
                          <span
                            key={s.barcode}
                            title={`${s.vialName} (${s.status})`}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              s.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                              s.status === 'COLLECTED' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                              'bg-slate-100 text-slate-600 border-slate-300'
                            }`}
                          >
                            {s.type}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {p.status === 'REGISTERED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          Registered
                        </span>
                      )}
                      {p.status === 'COLLECTED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                          Sample Drawn
                        </span>
                      )}
                      {p.status === 'IN_TESTING' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                          In Testing
                        </span>
                      )}
                      {p.status === 'PENDING_APPROVAL' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 animate-pulse">
                          Pending Doctor Review
                        </span>
                      )}
                      {p.status === 'AUTHORIZED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center w-fit space-x-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Authorized</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {p.status === 'AUTHORIZED' ? (
                          <button
                            onClick={() => {
                              setSelectedPatientId(p.id);
                              setActiveTab('reports');
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-xs flex items-center space-x-1"
                          >
                            <FileText className="h-3 w-3" />
                            <span>View Report</span>
                          </button>
                        ) : p.status === 'PENDING_APPROVAL' ? (
                          <button
                            onClick={() => {
                              setSelectedPatientId(p.id);
                              setActiveTab('doctor');
                            }}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-xs flex items-center space-x-1"
                          >
                            <span>Sign Off</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedPatientId(p.id);
                              setActiveTab('worklist');
                            }}
                            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg font-bold text-xs flex items-center space-x-1"
                          >
                            <span>Enter Results</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

const SparkleIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);
