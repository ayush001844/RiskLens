import React, { useState, useEffect } from 'react';
import {
  Activity, Radio, Shield, AlertTriangle, CheckCircle2, RefreshCw,
  Server, Lock, Database, Terminal, Cpu, ArrowUpRight, Zap,
  ExternalLink, Layers, CheckCheck, Clock, ShieldAlert, Sliders, Send
} from 'lucide-react';
import { telemetryApi } from '../api/client';
import type { TelemetryConnector, TelemetryEvent, TelemetryStats } from '../types';

interface Props {
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export const ContinuousControlMonitoringView: React.FC<Props> = ({ onNotify }) => {
  const [connectors, setConnectors] = useState<TelemetryConnector[]>([]);
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // Webhook modal state
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [webhookSource, setWebhookSource] = useState('aws_iam');
  const [webhookEventType, setWebhookEventType] = useState('Access Key Rotation Expiry Alert');
  const [webhookControlId, setWebhookControlId] = useState('CTL-001');
  const [webhookSeverity, setWebhookSeverity] = useState('WARNING');
  const [webhookDetails, setWebhookDetails] = useState('AWS IAM access key (AKIAIOSFODNN7EXAMPLE) exceeded 90-day statutory rotation window.');
  const [sendingWebhook, setSendingWebhook] = useState(false);

  useEffect(() => {
    loadAllTelemetry();
  }, []);

  async function loadAllTelemetry() {
    try {
      setLoading(true);
      const [connData, evData, statsData] = await Promise.all([
        telemetryApi.getConnectors(),
        telemetryApi.getEvents(),
        telemetryApi.getStats(),
      ]);
      setConnectors(connData);
      setEvents(evData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load telemetry:', err);
      onNotify?.('Failed to fetch telemetry data', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSync(connectorId: string) {
    try {
      setSyncingId(connectorId);
      const res = await telemetryApi.syncConnector(connectorId);
      onNotify?.(res.message, 'success');
      await loadAllTelemetry();
    } catch (err) {
      console.error('Failed to sync connector:', err);
      onNotify?.('Sync failed', 'error');
    } finally {
      setSyncingId(null);
    }
  }

  async function handleSendWebhook(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSendingWebhook(true);
      const res = await telemetryApi.sendWebhook(webhookSource, {
        event_type: webhookEventType,
        affected_control_id: webhookControlId,
        severity: webhookSeverity,
        details: webhookDetails,
        automated_action: 'Automated Jira ticket created · SecOps on-call alerted',
      });
      onNotify?.(res.message, 'success');
      setWebhookModalOpen(false);
      await loadAllTelemetry();
    } catch (err) {
      console.error('Failed to trigger webhook:', err);
      onNotify?.('Webhook trigger failed', 'error');
    } finally {
      setSendingWebhook(false);
    }
  }

  const filteredEvents = events.filter(evt => {
    const matchesSource = sourceFilter === 'ALL' || evt.source === sourceFilter;
    const matchesSev = severityFilter === 'ALL' || evt.severity.toUpperCase() === severityFilter.toUpperCase();
    return matchesSource && matchesSev;
  });

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Connecting to Cloud Security Telemetry Stream...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 animate-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="section-title">Continuous Control Monitoring (CCM)</h1>
            <span className="badge badge-low text-xs flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE TELEMETRY STREAM
            </span>
          </div>
          <p className="section-subtitle">
            Real-time control drift detection & automated telemetry connectors across AWS IAM, CrowdStrike Falcon, Splunk SIEM, Qualys VM & Tenable CSPM
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setWebhookModalOpen(true)}
            className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Simulate Cloud Webhook
          </button>
          <button
            onClick={loadAllTelemetry}
            className="btn btn-primary text-xs flex items-center gap-1.5 py-1.5 shadow-md shadow-accent/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync All Telemetry
          </button>
        </div>
      </div>

      {/* Top Telemetry KPI Metric Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 border-slate-700/80 bg-slate-900/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Telemetry Health Index</span>
              <span className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400">
                <Activity className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-cyan-400">{stats.telemetry_health_index_pct}%</span>
              <span className="text-xs text-slate-400">Fleet Average</span>
            </div>
            <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.telemetry_health_index_pct}%` }}
              />
            </div>
          </div>

          <div className="card p-4 border-slate-700/80 bg-slate-900/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Active Cloud Connectors</span>
              <span className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
                <Radio className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-400">{stats.healthy_connectors} / {stats.total_active_connectors}</span>
              <span className="text-xs text-slate-400">Connected</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              2 degraded connectors flagged for drift review.
            </p>
          </div>

          <div className="card p-4 border-slate-700/80 bg-slate-900/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Active Control Drift Alerts</span>
              <span className="p-1.5 rounded-md bg-red-500/10 text-red-400">
                <ShieldAlert className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-red-400">{stats.active_drift_incidents.total_open}</span>
              <span className="text-xs text-slate-400">Active Incidents</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px]">
              <span className="text-red-400 font-semibold">{stats.active_drift_incidents.critical} Critical</span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-400 font-semibold">{stats.active_drift_incidents.warning} Warning</span>
            </div>
          </div>

          <div className="card p-4 border-slate-700/80 bg-slate-900/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">CCF Auto-Sync Pipeline</span>
              <span className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400">
                <Layers className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-sm font-bold text-indigo-300">Synchronized</span>
              <span className="text-xs text-slate-400 font-mono">5.0× CCF</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Telemetry drift automatically updates statutory audit readiness scorecards.
            </p>
          </div>
        </div>
      )}

      {/* Cloud Security Connectors Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Integrated Security Telemetry Connectors</h2>
            <p className="text-xs text-slate-500">Live API polling and webhook integration across enterprise infrastructure</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">5 Configured Connectors</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectors.map(c => {
            const isDegraded = c.status === 'DEGRADED';
            const statusBadge = isDegraded ? 'badge-high' : 'badge-low';
            const healthColor = c.health_score >= 80 ? 'text-emerald-400' : c.health_score >= 60 ? 'text-amber-400' : 'text-red-400';

            return (
              <div key={c.connector_id} className="card p-4 border-slate-800 bg-slate-900/80 flex flex-col justify-between hover:border-slate-700 transition-all">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{c.provider}</span>
                      <h3 className="text-xs font-semibold text-slate-200 mt-0.5">{c.name}</h3>
                    </div>
                    <span className={`badge ${statusBadge} text-[10px] font-mono shrink-0`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Health Telemetry Score</span>
                    <span className={`text-base font-bold font-mono ${healthColor}`}>
                      {c.health_score.toFixed(1)}%
                    </span>
                  </div>

                  <div className="mt-3">
                    <p className="text-[11px] font-medium text-slate-400 mb-1">Monitored Controls:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.monitored_controls.map(ctl => (
                        <span key={ctl} className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] font-semibold">
                          {ctl}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 p-2 rounded bg-slate-950/40 border border-slate-800 text-[11px] text-slate-300 leading-snug">
                    <span className="text-slate-500 font-semibold block mb-0.5">Drift Assessment:</span>
                    {c.drift_summary}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Synced: {new Date(c.last_sync_timestamp).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={() => handleSync(c.connector_id)}
                    disabled={syncingId === c.connector_id}
                    className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3 h-3 ${syncingId === c.connector_id ? 'animate-spin text-accent' : ''}`} />
                    {syncingId === c.connector_id ? 'Syncing...' : 'Sync Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-Time Telemetry Events & Configuration Drift Stream */}
      <div className="card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Real-Time Control Drift & Telemetry Alert Feed</h2>
            <p className="text-xs text-slate-500">Live operational alerts correlated with GRC primary controls</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              className="input-field text-xs py-1.5 w-36"
            >
              <option value="ALL">All Sources</option>
              <option value="aws_iam">AWS IAM</option>
              <option value="crowdstrike_falcon">CrowdStrike</option>
              <option value="splunk_siem">Splunk SIEM</option>
              <option value="qualys_vuln">Qualys VM</option>
              <option value="tenable_cloud">Tenable CSPM</option>
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="input-field text-xs py-1.5 w-32"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/80">
                <th className="table-header py-2.5 w-24">Event ID</th>
                <th className="table-header py-2.5 w-28">Severity</th>
                <th className="table-header py-2.5 w-24">Control</th>
                <th className="table-header py-2.5 w-32">Source</th>
                <th className="table-header py-2.5">Finding & Drift Diagnostics</th>
                <th className="table-header py-2.5">Automated Remediative Action</th>
                <th className="table-header py-2.5 w-24 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map(evt => {
                const sevBadge =
                  evt.severity === 'CRITICAL' ? 'badge-critical' : evt.severity === 'WARNING' ? 'badge-high' : 'badge-info';

                return (
                  <tr key={evt.event_id} className="table-row">
                    <td className="table-cell py-3 font-mono font-semibold text-cyan-400">
                      {evt.event_id}
                    </td>
                    <td className="table-cell py-3">
                      <span className={`badge ${sevBadge} text-[10px] font-mono`}>
                        {evt.severity}
                      </span>
                    </td>
                    <td className="table-cell py-3">
                      <span className="font-mono font-semibold text-indigo-300">
                        {evt.affected_control_id}
                      </span>
                    </td>
                    <td className="table-cell py-3 font-mono text-[11px] text-slate-400">
                      {evt.source}
                    </td>
                    <td className="table-cell py-3">
                      <span className="font-semibold text-slate-200 block">{evt.title}</span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">{evt.message}</span>
                    </td>
                    <td className="table-cell py-3 text-slate-300">
                      <div className="p-1.5 rounded bg-slate-950/50 border border-slate-800 text-[11px] font-mono text-emerald-400">
                        {evt.automated_action}
                      </div>
                    </td>
                    <td className="table-cell py-3 text-right">
                      <span className={`badge ${evt.status === 'RESOLVED' ? 'badge-low' : 'badge-medium'} text-[10px] font-mono`}>
                        {evt.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulated Cloud Webhook Modal */}
      {webhookModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in">
          <div className="card w-full max-w-lg border-slate-700 bg-slate-900 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold text-slate-100">Simulate Cloud Security Webhook</h3>
              </div>
              <button
                onClick={() => setWebhookModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendWebhook} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Source Provider</label>
                  <select
                    value={webhookSource}
                    onChange={e => setWebhookSource(e.target.value)}
                    className="input-field w-full text-xs"
                  >
                    <option value="aws_iam">AWS IAM / Security Hub</option>
                    <option value="crowdstrike_falcon">CrowdStrike Falcon</option>
                    <option value="splunk_siem">Splunk SIEM</option>
                    <option value="qualys_vuln">Qualys Cloud Platform</option>
                    <option value="tenable_cloud">Tenable CSPM</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Severity</label>
                  <select
                    value={webhookSeverity}
                    onChange={e => setWebhookSeverity(e.target.value)}
                    className="input-field w-full text-xs"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="WARNING">Warning</option>
                    <option value="INFO">Info</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Affected Primary Control ID</label>
                <select
                  value={webhookControlId}
                  onChange={e => setWebhookControlId(e.target.value)}
                  className="input-field w-full text-xs font-mono"
                >
                  <option value="CTL-001">CTL-001 — Privileged Access Management (PAM)</option>
                  <option value="CTL-002">CTL-002 — Phishing-Resistant MFA</option>
                  <option value="CTL-003">CTL-003 — Data Encryption at Rest (AES-256)</option>
                  <option value="CTL-004">CTL-004 — Endpoint Detection & Response (EDR)</option>
                  <option value="CTL-005">CTL-005 — Centralized SIEM Log Aggregation</option>
                  <option value="CTL-008">CTL-008 — Vulnerability Management</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Event Type / Signature</label>
                <input
                  type="text"
                  value={webhookEventType}
                  onChange={e => setWebhookEventType(e.target.value)}
                  className="input-field w-full text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Telemetry Payload Details</label>
                <textarea
                  value={webhookDetails}
                  onChange={e => setWebhookDetails(e.target.value)}
                  rows={3}
                  className="input-field w-full text-xs resize-none"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setWebhookModalOpen(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingWebhook}
                  className="btn btn-primary text-xs flex items-center gap-1.5"
                >
                  {sendingWebhook ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Dispatching Webhook...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Trigger Telemetry Ingestion
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContinuousControlMonitoringView;
