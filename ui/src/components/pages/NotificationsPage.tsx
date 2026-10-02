import React, { useState } from 'react';
import { 
  Bell, 
  Send, 
  MessageSquare, 
  Mail, 
  Webhook, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ShieldAlert, 
  Clock, 
  Check, 
  X, 
  Sliders, 
  Database, 
  HardDrive, 
  DollarSign, 
  ExternalLink,
  RefreshCw,
  Plus
} from 'lucide-react';

interface NotificationChannel {
  id: string;
  name: string;
  type: 'telegram' | 'slack' | 'email' | 'webhook';
  destination: string;
  enabled: boolean;
  status: 'connected' | 'error' | 'pending';
}

interface AlertRule {
  id: string;
  title: string;
  category: 'deployments' | 'resources' | 'backups' | 'budget';
  description: string;
  enabled: boolean;
  severity: 'critical' | 'warning' | 'info';
}

interface DispatchLog {
  id: string;
  timestamp: string;
  event: string;
  channel: string;
  channelType: 'telegram' | 'slack' | 'email' | 'webhook';
  status: 'delivered' | 'failed';
  details: string;
}

export const NotificationsPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'channels' | 'rules' | 'logs'>('channels');
  const [testSentChannel, setTestSentChannel] = useState<string | null>(null);

  // 1. Mock State for Notification Channels
  const [channels, setChannels] = useState<NotificationChannel[]>([
    {
      id: 'ch-1',
      name: 'DevOps Telegram Bot',
      type: 'telegram',
      destination: 'Chat ID: -1001928374',
      enabled: true,
      status: 'connected'
    },
    {
      id: 'ch-2',
      name: 'Slack #db-alerts',
      type: 'slack',
      destination: 'https://hooks.slack.com/services/T00/B00/XXXX',
      enabled: true,
      status: 'connected'
    },
    {
      id: 'ch-3',
      name: 'Admin Email Digest',
      type: 'email',
      destination: 'bodya@databasik.io',
      enabled: true,
      status: 'connected'
    },
    {
      id: 'ch-4',
      name: 'Datadog Webhook',
      type: 'webhook',
      destination: 'https://api.datadoghq.com/api/v1/events',
      enabled: false,
      status: 'pending'
    }
  ]);

  // 2. Mock State for Alert Rules
  const [rules, setRules] = useState<AlertRule[]>([
    {
      id: 'r-1',
      title: 'Database Deployment Failures',
      category: 'deployments',
      description: 'Trigger instant critical alert when a K8s CustomResource or Helm release fails to start',
      enabled: true,
      severity: 'critical'
    },
    {
      id: 'r-2',
      title: 'Resource Quota Exceeded (80%+)',
      category: 'resources',
      description: 'Send warning notification when total CPU, RAM or PVC Storage crosses 80% quota limit',
      enabled: true,
      severity: 'warning'
    },
    {
      id: 'r-3',
      title: 'Point-in-Time Backup Completion',
      category: 'backups',
      description: 'Send info dispatch when scheduled WAL/Snapshot backup completes successfully',
      enabled: true,
      severity: 'info'
    },
    {
      id: 'r-4',
      title: 'Monthly Budget Guardrail Warning',
      category: 'budget',
      description: 'Trigger alert when estimated cloud spend reaches 80% of defined monthly budget',
      enabled: true,
      severity: 'warning'
    },
    {
      id: 'r-5',
      title: 'Database Instance Day-2 Scaling',
      category: 'deployments',
      description: 'Notify team when CPU/RAM scaling or config update is applied to an active database',
      enabled: false,
      severity: 'info'
    }
  ]);

  // 3. Mock State for Dispatch History Logs
  const [logs] = useState<DispatchLog[]>([
    {
      id: 'log-101',
      timestamp: '2026-08-18 19:10:42',
      event: 'Resource Quota Warning (CPU 82% Used)',
      channel: 'Slack #db-alerts',
      channelType: 'slack',
      status: 'delivered',
      details: 'HTTP 200 OK - Message delivered to #db-alerts'
    },
    {
      id: 'log-102',
      timestamp: '2026-08-18 18:45:12',
      event: 'PostgreSQL Backup Snapshot Created',
      channel: 'DevOps Telegram Bot',
      channelType: 'telegram',
      status: 'delivered',
      details: 'Telegram API 200 - Snapshot pg-prod-20260818.tar.gz'
    },
    {
      id: 'log-103',
      timestamp: '2026-08-18 16:30:00',
      event: 'Database Scaling Completed (users-db)',
      channel: 'Admin Email Digest',
      channelType: 'email',
      status: 'delivered',
      details: 'SMTP 250 - Delivered to bodya@databasik.io'
    },
    {
      id: 'log-104',
      timestamp: '2026-08-18 14:15:00',
      event: 'Custom Webhook Dispatch Failure',
      channel: 'Datadog Webhook',
      channelType: 'webhook',
      status: 'failed',
      details: 'HTTP 504 Gateway Timeout'
    }
  ]);

  const toggleChannel = (id: string) => {
    setChannels(channels.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  };

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const sendTestDispatch = (channelName: string) => {
    setTestSentChannel(channelName);
    setTimeout(() => {
      setTestSentChannel(null);
    }, 3000);
  };

  const getChannelIcon = (type: NotificationChannel['type']) => {
    switch (type) {
      case 'telegram': return <Send className="w-5 h-5 text-sky-400" />;
      case 'slack': return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case 'email': return <Mail className="w-5 h-5 text-amber-400" />;
      case 'webhook': return <Webhook className="w-5 h-5 text-purple-400" />;
    }
  };

  const getSeverityBadge = (severity: AlertRule['severity']) => {
    switch (severity) {
      case 'critical':
        return <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[11px] font-bold uppercase tracking-wider">Critical</span>;
      case 'warning':
        return <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-bold uppercase tracking-wider">Warning</span>;
      case 'info':
        return <span className="px-2.5 py-1 rounded-lg bg-brand-blue/10 text-brand-sky border border-brand-blue/30 text-[11px] font-bold uppercase tracking-wider">Info</span>;
    }
  };

  return (
    <div className="space-y-8 text-slate-100 pb-12">
      {/* 1. Header Banner & Navigation */}
      <div className="flex items-center justify-between bg-bg-card border border-accent-darkBorder p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-blue via-brand-sky to-brand-cyan flex items-center justify-center text-white shadow-lg shadow-brand-blue/30">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Notification & Alert Service</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-channel delivery (Slack, Telegram, Email, Webhooks), event subscription rules, and dispatch history
            </p>
          </div>
        </div>

        {/* Sub-Tab Navigation Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-bg-main border border-accent-darkBorder rounded-xl">
          <button
            onClick={() => setActiveSubTab('channels')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'channels'
                ? 'bg-brand-blue text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-accent-darkHover'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Delivery Channels ({channels.filter(c => c.enabled).length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('rules')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'rules'
                ? 'bg-brand-blue text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-accent-darkHover'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Alert Rules ({rules.filter(r => r.enabled).length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'logs'
                ? 'bg-brand-blue text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-accent-darkHover'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Dispatch Logs</span>
          </button>
        </div>
      </div>

      {/* 2. CHANNELS SUB-TAB */}
      {activeSubTab === 'channels' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Active Notification Delivery Channels</h3>
              <p className="text-xs text-slate-400">Configure messaging destinations for critical platform alerts and updates</p>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs shadow-lg shadow-brand-blue/30 transition-all">
              <Plus className="w-4 h-4" />
              <span>Add New Channel</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {channels.map((ch) => (
              <div key={ch.id} className="bg-bg-card border border-accent-darkBorder p-6 rounded-2xl shadow-xl space-y-4 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-bg-main border border-accent-darkBorder flex items-center justify-center shadow-md">
                      {getChannelIcon(ch.type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">{ch.name}</h4>
                      <span className="text-xs text-slate-400 font-mono">{ch.destination}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleChannel(ch.id)}
                    className={`w-12 h-6 rounded-full transition-colors p-1 ${
                      ch.enabled ? 'bg-brand-blue' : 'bg-slate-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      ch.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Status:</span>
                    <span className="text-emerald-400 font-bold capitalize">{ch.status}</span>
                  </div>

                  <button
                    onClick={() => sendTestDispatch(ch.name)}
                    disabled={!ch.enabled}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      testSentChannel === ch.name
                        ? 'bg-emerald-500 text-white'
                        : ch.enabled
                        ? 'bg-bg-main hover:bg-accent-darkHover border border-accent-darkBorder text-slate-300'
                        : 'opacity-50 cursor-not-allowed bg-bg-main border border-accent-darkBorder text-slate-600'
                    }`}
                  >
                    {testSentChannel === ch.name ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Test Dispatched!</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-brand-sky" />
                        <span>Send Test Alert</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. ALERT RULES SUB-TAB */}
      {activeSubTab === 'rules' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Event Subscription Triggers & Rules</h3>
            <p className="text-xs text-slate-400">Define which system events send notifications to configured delivery channels</p>
          </div>

          <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-4">
            {rules.map((rule) => (
              <div key={rule.id} className="p-5 bg-bg-main border border-accent-darkBorder rounded-xl flex items-center justify-between hover:border-slate-700 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-blue/10 border border-brand-blue/30 text-brand-sky flex items-center justify-center mt-1">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-white text-base">{rule.title}</h4>
                      {getSeverityBadge(rule.severity)}
                    </div>
                    <p className="text-xs text-slate-400 max-w-xl">{rule.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <span className="text-xs font-bold text-slate-400 capitalize bg-bg-card px-3 py-1.5 rounded-lg border border-slate-800">
                    Category: {rule.category}
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleRule(rule.id)}
                    className={`w-12 h-6 rounded-full transition-colors p-1 ${
                      rule.enabled ? 'bg-brand-blue' : 'bg-slate-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      rule.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. DISPATCH LOGS SUB-TAB */}
      {activeSubTab === 'logs' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Recent Notification Dispatch Audit Trail</h3>
            <p className="text-xs text-slate-400">Complete log of recent alert dispatches sent across connected channels</p>
          </div>

          <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-4">
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="p-4 bg-bg-main border border-accent-darkBorder rounded-xl flex items-center justify-between hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                      log.status === 'delivered'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}>
                      {log.status === 'delivered' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{log.event}</h4>
                      <span className="text-xs text-slate-500">{log.timestamp} • Target: <strong className="text-slate-300">{log.channel}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <span className="text-xs font-mono text-slate-400 bg-bg-card px-3 py-1.5 rounded-lg border border-slate-800">
                      {log.details}
                    </span>

                    <span className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider ${
                      log.status === 'delivered'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
