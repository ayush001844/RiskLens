import { useState, useEffect } from 'react';
import { History, Shield, Filter, Search, RefreshCw, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { auditApi } from '../api/client';
import type { AuditLog } from '../types';
import { fmtDateTime, getRoleClass } from '../utils';

export function AuditLogView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedEntity, setSelectedEntity] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await auditApi.list({ limit: 150 });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'UPDATE':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'DELETE':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'ACCEPT_RISK':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'LOGIN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'VERIFY_EVIDENCE':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  const entityTypes = ['ALL', ...Array.from(new Set(logs.map((l) => l.entity_type)))];
  const actions = ['ALL', ...Array.from(new Set(logs.map((l) => l.action)))];

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.username && log.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.entity_id && log.entity_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.change_summary && log.change_summary.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;
    const matchesEntity = selectedEntity === 'ALL' || log.entity_type === selectedEntity;

    return matchesSearch && matchesAction && matchesEntity;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Enterprise Security Audit Trail</h2>
          </div>
          <p className="text-xs text-slate-400">
            Immutable, append-only audit trail logging all modifications to risks, controls, evidence, and governance policies.
          </p>
        </div>
        <button
          onClick={loadAuditLogs}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 bg-navy-800 hover:bg-navy-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-navy-800/80 p-3.5 rounded-xl border border-slate-700/60">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by user, entity ID, summary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-navy-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Action:</span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="bg-navy-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {actions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Entity:</span>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="bg-navy-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {entityTypes.map((ent) => (
                <option key={ent} value={ent}>
                  {ent}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-navy-900/80 border-b border-slate-700/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">User & Role</th>
                <th className="py-3 px-4">Summary</th>
                <th className="py-3 px-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading audit trail records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit records match your filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-navy-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {fmtDateTime(log.timestamp)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getActionBadgeClass(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-200">{log.entity_type}</span>
                      {log.entity_id && (
                        <span className="ml-1.5 font-mono text-[11px] text-blue-400">
                          #{log.entity_id}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-300 font-medium">{log.username || 'System'}</span>
                        {log.user_role && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded ${getRoleClass(log.user_role)}`}>
                            {log.user_role}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-md truncate">
                      {log.change_summary || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-all"
                        title="Inspect change payload"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in">
          <div className="card max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto space-y-4 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  Audit Record #{selectedLog.id} Detail
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Action</span>
                <span className="font-semibold text-slate-200">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Entity</span>
                <span className="font-semibold text-slate-200">
                  {selectedLog.entity_type} {selectedLog.entity_id ? `(${selectedLog.entity_id})` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">User</span>
                <span className="font-semibold text-slate-200">
                  {selectedLog.username || 'System'} ({selectedLog.user_role || 'System'})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">IP Address</span>
                <span className="font-mono text-slate-300">{selectedLog.ip_address || '127.0.0.1'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Timestamp</span>
                <span className="font-mono text-slate-300">{fmtDateTime(selectedLog.timestamp)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Summary</span>
                <span className="text-slate-200">{selectedLog.change_summary || '—'}</span>
              </div>
            </div>

            {/* Before / After JSON comparison */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 block">State Snapshot:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Before:</span>
                  </div>
                  <pre className="p-3 bg-navy-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48">
                    {selectedLog.before_values
                      ? JSON.stringify(selectedLog.before_values, null, 2)
                      : 'null'}
                  </pre>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>After:</span>
                  </div>
                  <pre className="p-3 bg-navy-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48">
                    {selectedLog.after_values
                      ? JSON.stringify(selectedLog.after_values, null, 2)
                      : 'null'}
                  </pre>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
