import { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  Crosshair,
  Terminal,
  Search,
  Filter,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Flame,
  Radio,
  CheckCircle2,
  Clock,
  Skull,
  Server,
  Layers,
} from 'lucide-react';
import { threatsApi, threatIntelApi } from '../api/client';
import type { ThreatScenario, ThreatIntelItem, ThreatIntelSummary } from '../types';

export function ThreatsView() {
  const [activeTab, setActiveTab] = useState<'cisa-kev' | 'mitre-scenarios'>('cisa-kev');

  // MITRE Scenarios state
  const [threats, setThreats] = useState<ThreatScenario[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [scenarioSearch, setScenarioSearch] = useState('');
  const [selectedActorCategory, setSelectedActorCategory] = useState('ALL');
  const [expandedScenarioId, setExpandedScenarioId] = useState<number | null>(null);

  // Threat Intel Feed state
  const [feedItems, setFeedItems] = useState<ThreatIntelItem[]>([]);
  const [intelSummary, setIntelSummary] = useState<ThreatIntelSummary | null>(null);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [intelSearch, setIntelSearch] = useState('');
  const [filterRansomwareOnly, setFilterRansomwareOnly] = useState(false);
  const [expandedCveId, setExpandedCveId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    loadScenarios();
    loadThreatIntel();
  }, []);

  const loadScenarios = async () => {
    try {
      setLoadingScenarios(true);
      const data = await threatsApi.list();
      setThreats(data);
    } catch (err) {
      console.error('Failed to load threat scenarios:', err);
    } finally {
      setLoadingScenarios(false);
    }
  };

  const loadThreatIntel = async () => {
    try {
      setLoadingFeed(true);
      const [feed, summary] = await Promise.all([
        threatIntelApi.getFeed(),
        threatIntelApi.getSummary(),
      ]);
      setFeedItems(feed);
      setIntelSummary(summary);
    } catch (err) {
      console.error('Failed to load threat intel feed:', err);
    } finally {
      setLoadingFeed(false);
    }
  };

  const handleSyncIntel = async () => {
    try {
      setSyncing(true);
      const res = await threatIntelApi.syncFeed();
      setSyncMessage(`Synced ${res.ingested_cves} CVEs from CISA KEV & NVD 2.0 at ${new Date(res.sync_timestamp).toLocaleTimeString()}`);
      await loadThreatIntel();
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err) {
      console.error('Failed to sync threat intel:', err);
      setSyncMessage('Failed to synchronize external feeds.');
    } finally {
      setSyncing(false);
    }
  };

  // Filtered MITRE scenarios
  const actorCategories = [
    'ALL',
    ...Array.from(new Set(threats.map((t) => t.threat_actor_category || 'Unclassified'))),
  ];

  const filteredThreats = threats.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(scenarioSearch.toLowerCase()) ||
      (t.threat_actor_category && t.threat_actor_category.toLowerCase().includes(scenarioSearch.toLowerCase())) ||
      (t.target_asset && t.target_asset.toLowerCase().includes(scenarioSearch.toLowerCase())) ||
      (t.risk_ref && t.risk_ref.toLowerCase().includes(scenarioSearch.toLowerCase())) ||
      (t.attack_techniques &&
        t.attack_techniques.some(
          (tech) =>
            tech.id.toLowerCase().includes(scenarioSearch.toLowerCase()) ||
            tech.name.toLowerCase().includes(scenarioSearch.toLowerCase())
        ));

    const matchesCategory =
      selectedActorCategory === 'ALL' || (t.threat_actor_category || 'Unclassified') === selectedActorCategory;

    return matchesSearch && matchesCategory;
  });

  const allTechniques = threats.flatMap((t) => t.attack_techniques || []);
  const uniqueTechniqueCount = new Set(allTechniques.map((tech) => tech.id)).size;

  // Filtered CISA KEV items
  const filteredFeed = feedItems.filter((item) => {
    const matchesRansomware = !filterRansomwareOnly || item.known_ransomware_campaign_use === 'Known';
    const matchesSearch =
      item.cve_id.toLowerCase().includes(intelSearch.toLowerCase()) ||
      item.title.toLowerCase().includes(intelSearch.toLowerCase()) ||
      item.product.toLowerCase().includes(intelSearch.toLowerCase()) ||
      item.threat_actor.toLowerCase().includes(intelSearch.toLowerCase()) ||
      item.target_asset_category.toLowerCase().includes(intelSearch.toLowerCase()) ||
      item.correlated_risk_id.toLowerCase().includes(intelSearch.toLowerCase());

    return matchesRansomware && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in">
      {/* Synthetic Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Threat Intelligence Feed:</strong> Real-world CISA Known Exploited Vulnerabilities (KEV) and MITRE ATT&CK attack paths correlated against Apex Financial Services synthetic asset inventory.
          </span>
        </div>
        <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          CISA BOD 22-01 Correlator
        </span>
      </div>

      {/* Main View Mode Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-700/60">
        <div className="flex items-center gap-2 bg-navy-800/90 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setActiveTab('cisa-kev')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'cisa-kev'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-300" />
            <span>CISA KEV Vulnerability Ingestion</span>
            <span className="text-[10px] font-mono bg-navy-950/60 px-1.5 py-0.2 rounded-full text-cyan-300">
              {feedItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('mitre-scenarios')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'mitre-scenarios'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-purple-300" />
            <span>MITRE ATT&CK Attack Scenarios</span>
            <span className="text-[10px] font-mono bg-navy-950/60 px-1.5 py-0.2 rounded-full text-purple-300">
              {threats.length}
            </span>
          </button>
        </div>

        {activeTab === 'cisa-kev' && (
          <div className="flex items-center gap-2">
            {syncMessage && (
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 animate-in">
                {syncMessage}
              </span>
            )}
            <button
              onClick={handleSyncIntel}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg shadow-sm shadow-blue-600/30 transition disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing Feeds...' : 'Sync CISA KEV Feed'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: CISA KEV Threat Intelligence & Asset Ingestion (Phase 11)      */}
      {/* ========================================================================= */}
      {activeTab === 'cisa-kev' && (
        <div className="space-y-6">
          {/* Executive Intelligence Briefing Deck */}
          {intelSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="bg-navy-800/90 border border-slate-700/60 rounded-xl p-3.5 space-y-1">
                <span className="text-[11px] font-medium text-slate-400">Monitored CVEs</span>
                <div className="text-xl font-bold font-mono text-slate-200">
                  {intelSummary.total_monitored_cves}
                </div>
                <span className="text-[10px] text-slate-400">NVD & Vendor Advisories</span>
              </div>

              <div className="bg-navy-800/90 border border-slate-700/60 rounded-xl p-3.5 space-y-1">
                <span className="text-[11px] font-medium text-slate-400">CISA KEV Listed</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold font-mono text-red-400">
                    {intelSummary.cisa_kev_listed_cves}
                  </span>
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                </div>
                <span className="text-[10px] text-red-400 font-semibold">Active In-The-Wild Exploits</span>
              </div>

              <div className="bg-navy-800/90 border border-slate-700/60 rounded-xl p-3.5 space-y-1">
                <span className="text-[11px] font-medium text-slate-400">Ransomware Vectors</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold font-mono text-amber-400">
                    {intelSummary.known_ransomware_vectors}
                  </span>
                  <Skull className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-[10px] text-slate-400">LockBit, ALPHV, Cl0p Vectors</span>
              </div>

              <div className="bg-navy-800/90 border border-slate-700/60 rounded-xl p-3.5 space-y-1">
                <span className="text-[11px] font-medium text-slate-400">Asset Matches</span>
                <div className="text-xl font-bold font-mono text-cyan-400">
                  {intelSummary.correlated_active_risk_matches}
                </div>
                <span className="text-[10px] text-slate-400">
                  {intelSummary.impacted_asset_count} Banking Assets Exposed
                </span>
              </div>

              <div className="bg-navy-800/90 border border-slate-700/60 rounded-xl p-3.5 space-y-1">
                <span className="text-[11px] font-medium text-slate-400">Critical Exposures</span>
                <div className="text-xl font-bold font-mono text-red-400">
                  {intelSummary.critical_asset_exposures}
                </div>
                <span className="text-[10px] text-red-400 font-semibold">Immediate Remediation Due</span>
              </div>
            </div>
          )}

          {/* Search, Filter & Tag Strip */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-navy-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search CVE ID, vendor, product, asset, actor..."
                value={intelSearch}
                onChange={(e) => setIntelSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-navy-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterRansomwareOnly(!filterRansomwareOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                  filterRansomwareOnly
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-navy-900 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                <Skull className="w-3.5 h-3.5" />
                <span>Ransomware Vectors Only</span>
              </button>
            </div>
          </div>

          {/* Vulnerability Feed Cards */}
          {loadingFeed ? (
            <div className="text-center py-16 text-slate-400">Loading threat intelligence feed...</div>
          ) : filteredFeed.length === 0 ? (
            <div className="card p-12 text-center text-slate-400">
              No vulnerabilities match your search query.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFeed.map((item) => {
                const isExpanded = expandedCveId === item.cve_id;
                const isCritical = item.exposure_level === 'Critical';
                const isHigh = item.exposure_level === 'High';

                return (
                  <div
                    key={item.cve_id}
                    className={`card p-5 border transition-all ${
                      isCritical
                        ? 'border-red-500/40 bg-gradient-to-br from-navy-900/90 to-red-950/20'
                        : isHigh
                        ? 'border-amber-500/30 bg-gradient-to-br from-navy-900/90 to-amber-950/10'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                            {item.cve_id}
                          </span>

                          {/* CVSS Score Pill */}
                          <span
                            className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded border ${
                              item.cvss_score >= 9.0
                                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            CVSS {item.cvss_score.toFixed(1)}
                          </span>

                          {/* EPSS Score Pill */}
                          <span className="text-[10px] font-mono text-slate-400 bg-navy-950 px-2 py-0.5 rounded border border-slate-800">
                            EPSS: {(item.epss_score * 100).toFixed(1)}% prob
                          </span>

                          {/* CISA KEV Badge */}
                          {item.cisa_kev_listed && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1">
                              <Flame className="w-3 h-3" /> CISA KEV Listed
                            </span>
                          )}

                          {/* Known Ransomware Campaign Use */}
                          {item.known_ransomware_campaign_use === 'Known' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                              <Skull className="w-3 h-3" /> Ransomware Weaponized
                            </span>
                          )}

                          {/* Correlation Status Badge */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isCritical
                                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                : isHigh
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {item.correlation_status}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-white">{item.title}</h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                          <span>
                            Product:{' '}
                            <strong className="text-slate-200">{item.product}</strong> ({item.vendor_project})
                          </span>
                          <span>•</span>
                          <span>
                            Threat Actor:{' '}
                            <strong className="text-purple-300">{item.threat_actor}</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-red-400">
                            <Clock className="w-3.5 h-3.5" />
                            CISA BOD Remediation Due: <strong>{item.due_date}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.linked_risk && (
                          <div className="text-right hidden sm:block">
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                              Correlated Risk
                            </div>
                            <span className="font-mono text-xs font-bold text-blue-400">
                              {item.linked_risk.risk_id} (Score: {item.linked_risk.residual_score})
                            </span>
                          </div>
                        )}

                        <button
                          onClick={() => setExpandedCveId(isExpanded ? null : item.cve_id)}
                          className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 transition-colors"
                          title={isExpanded ? 'Collapse' : 'Expand details'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded CVE Guidance & Technical Mitigation */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 text-xs animate-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-navy-900/90 border border-slate-800">
                            <span className="text-slate-400 font-semibold block mb-1">
                              Asset Correlation & Impacted Target:
                            </span>
                            <div className="flex items-center gap-2 text-slate-200 font-medium">
                              <Server className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{item.target_asset_category}</span>
                            </div>
                            {item.linked_risk && (
                              <p className="text-[11px] text-slate-400 mt-1">
                                Maps to active risk{' '}
                                <strong className="text-blue-300">{item.linked_risk.risk_id}</strong>:{' '}
                                {item.linked_risk.title} (Asset: {item.linked_risk.affected_asset})
                              </p>
                            )}
                          </div>

                          <div className="p-3 rounded-lg bg-navy-900/90 border border-slate-800">
                            <span className="text-slate-400 font-semibold block mb-1">
                              CVSS Vector String:
                            </span>
                            <code className="text-cyan-400 font-mono text-[11px] block break-all">
                              {item.cvss_vector}
                            </code>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              Added to CISA KEV on {item.date_added_to_kev}
                            </span>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">
                          <span className="text-blue-300 font-bold block mb-1 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-blue-400" />
                            Technical Mitigation Guidance:
                          </span>
                          <p className="text-slate-200 leading-relaxed font-sans">
                            {item.mitigation_guidance}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: MITRE ATT&CK Threat Scenarios                                 */}
      {/* ========================================================================= */}
      {activeTab === 'mitre-scenarios' && (
        <div className="space-y-6">
          {/* Header & Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{threats.length}</div>
                <div className="text-xs text-slate-400">Threat Scenarios</div>
              </div>
            </div>

            <div className="card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan-400">{uniqueTechniqueCount}</div>
                <div className="text-xs text-slate-400">MITRE ATT&CK Techniques</div>
              </div>
            </div>

            <div className="card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Crosshair className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">{actorCategories.length - 1}</div>
                <div className="text-xs text-slate-400">Threat Actor Profiles</div>
              </div>
            </div>

            <div className="card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">
                  {threats.filter((t) => t.risk_ref).length}
                </div>
                <div className="text-xs text-slate-400">Mapped to Risk Register</div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-navy-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search scenarios, techniques, assets..."
                value={scenarioSearch}
                onChange={(e) => setScenarioSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-navy-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-400">Actor Category:</span>
              <select
                value={selectedActorCategory}
                onChange={(e) => setSelectedActorCategory(e.target.value)}
                className="bg-navy-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {actorCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Threats List */}
          {loadingScenarios ? (
            <div className="text-center py-16 text-slate-400">Loading threat intelligence scenarios...</div>
          ) : filteredThreats.length === 0 ? (
            <div className="card p-12 text-center text-slate-400">
              No threat scenarios found matching your filter criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredThreats.map((threat) => {
                const isExpanded = expandedScenarioId === threat.id;
                return (
                  <div
                    key={threat.id}
                    className="card p-5 border border-slate-800 hover:border-slate-700 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                            {threat.scenario_id}
                          </span>
                          {threat.risk_ref && (
                            <span className="font-mono text-xs text-slate-400 bg-navy-900 px-2 py-0.5 rounded border border-slate-800">
                              Risk: {threat.risk_ref}
                            </span>
                          )}
                          {threat.threat_actor_category && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                              {threat.threat_actor_category}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-white">{threat.title}</h3>

                        {threat.target_asset && (
                          <p className="text-xs text-slate-400">
                            Target Asset: <span className="text-slate-200 font-medium">{threat.target_asset}</span>
                          </p>
                        )}
                      </div>

                      {/* MITRE ATT&CK badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(threat.attack_techniques || []).slice(0, 3).map((tech) => (
                          <a
                            key={tech.id}
                            href={`https://attack.mitre.org/techniques/${tech.id.replace('.', '/')}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-navy-900 border border-cyan-500/30 text-cyan-400 text-xs font-mono hover:bg-cyan-500/10 transition-colors"
                            title={tech.name}
                          >
                            <span>{tech.id}</span>
                            <ExternalLink className="w-3 h-3 text-cyan-500" />
                          </a>
                        ))}
                        {(threat.attack_techniques?.length || 0) > 3 && (
                          <span className="text-xs text-slate-500 font-mono">
                            +{(threat.attack_techniques?.length || 0) - 3} more
                          </span>
                        )}

                        <button
                          onClick={() => setExpandedScenarioId(isExpanded ? null : threat.id)}
                          className="ml-2 p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 transition-colors"
                          title={isExpanded ? 'Collapse' : 'Expand details'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-800 space-y-4 animate-in">
                        {/* All ATT&CK Techniques */}
                        {threat.attack_techniques && threat.attack_techniques.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-slate-300 mb-2">
                              MITRE ATT&CK Mapped Techniques:
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {threat.attack_techniques.map((tech) => (
                                <div
                                  key={tech.id}
                                  className="p-2.5 rounded-lg bg-navy-900/90 border border-slate-800 text-xs"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono font-bold text-cyan-400">
                                      {tech.id}
                                    </span>
                                    <span className="text-[10px] text-slate-500">{tech.tactic}</span>
                                  </div>
                                  <div className="text-slate-300 font-medium mt-1 truncate">
                                    {tech.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {threat.attack_preconditions && (
                            <div className="p-3 rounded-lg bg-navy-900/60 border border-slate-800/80">
                              <span className="text-slate-400 font-semibold block mb-1">
                                Attack Preconditions:
                              </span>
                              <p className="text-slate-300 leading-relaxed">{threat.attack_preconditions}</p>
                            </div>
                          )}

                          {threat.business_consequences && (
                            <div className="p-3 rounded-lg bg-navy-900/60 border border-slate-800/80">
                              <span className="text-slate-400 font-semibold block mb-1">
                                Potential Business Consequences:
                              </span>
                              <p className="text-slate-300 leading-relaxed">{threat.business_consequences}</p>
                            </div>
                          )}

                          {threat.preventive_controls && (
                            <div className="p-3 rounded-lg bg-navy-900/60 border border-slate-800/80">
                              <span className="text-emerald-400 font-semibold block mb-1">
                                Existing Preventive Controls:
                              </span>
                              <p className="text-slate-300 leading-relaxed">{threat.preventive_controls}</p>
                            </div>
                          )}

                          {threat.detection_gaps && (
                            <div className="p-3 rounded-lg bg-navy-900/60 border border-slate-800/80">
                              <span className="text-red-400 font-semibold block mb-1">
                                Identified Detection Gaps:
                              </span>
                              <p className="text-slate-300 leading-relaxed">{threat.detection_gaps}</p>
                            </div>
                          )}
                        </div>

                        {threat.recommended_mitigations && (
                          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">
                            <span className="text-blue-300 font-semibold block mb-1">
                              Recommended Tactical Mitigations:
                            </span>
                            <p className="text-slate-200 leading-relaxed">{threat.recommended_mitigations}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ThreatsView;
