import React from 'react';
import { ShieldAlert, LogOut, Laptop, Clock, AlertTriangle } from 'lucide-react';

export const SessionKickoutModal = ({ sessionInfo, onAcknowledge }) => {
  if (!sessionInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-rose-200 max-w-md w-full p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Warning Icon Badge */}
        <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600 shadow-inner">
          <ShieldAlert className="h-9 w-9 animate-pulse" />
        </div>

        {/* Title & Explanation */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold font-mono">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Single Active Session Policy</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Session Terminated
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed px-2">
            Your laboratory account was just logged in from <strong>another device or computer</strong>. For patient data confidentiality and NABL compliance, this previous workstation session has been closed.
          </p>
        </div>

        {/* New Device Details Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2.5 text-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Concurrent Login Activity
          </div>
          <div className="flex items-center space-x-2.5 text-slate-700 font-medium">
            <Laptop className="h-4 w-4 text-sky-600 shrink-0" />
            <span className="truncate">{sessionInfo.newDevice || 'Chrome Browser on Workstation'}</span>
          </div>
          <div className="flex items-center space-x-2.5 text-slate-500 font-mono text-[11px]">
            <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>
              {sessionInfo.newLoginTime 
                ? new Date(sessionInfo.newLoginTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onAcknowledge}
          className="w-full py-3 bg-gradient-to-r from-sky-900 to-indigo-900 hover:from-sky-950 hover:to-indigo-950 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all transform active:scale-98"
        >
          <LogOut className="h-4 w-4" />
          <span>Return to Login Screen</span>
        </button>

        <p className="text-[10px] text-slate-400">
          If you did not authorize this login, please contact your System Administrator immediately.
        </p>

      </div>
    </div>
  );
};
