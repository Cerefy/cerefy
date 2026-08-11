// src/components/GovernanceDashboardView.tsx
// Decision Governance Center — Enterprise compliance, approvals, and risk management
// Uses existing Cerefy Obsidian/Cyan identity

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  BarChart3,
  Users,
  FileText,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ChevronRight,
  Filter,
  ArrowUpRight,
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface GovernanceDecision {
  id: string;
  title: string;
  type: 'architecture' | 'security' | 'compliance' | 'budget' | 'process';
  status: 'pending' | 'approved' | 'rejected' | 'review';
  risk: 'low' | 'medium' | 'high' | 'critical';
  requestedBy: string;
  assignedTo: string;
  createdAt: string;
  impact: string;
  aiConfidence: number;
  aiRecommendation: 'approve' | 'reject' | 'review';
}

const sampleDecisions: GovernanceDecision[] = [
  { id: 'GOV-001', title: 'Migrate to Kubernetes for microservices', type: 'architecture', status: 'pending', risk: 'high', requestedBy: 'Solution Architect AI', assignedTo: 'Montaser', createdAt: '2h ago', impact: 'Infrastructure cost +15%, availability +99.9%', aiConfidence: 0.91, aiRecommendation: 'approve' },
  { id: 'GOV-002', title: 'Enable SSO with Azure AD', type: 'security', status: 'approved', risk: 'low', requestedBy: 'Security Agent', assignedTo: 'Sarah', createdAt: '1d ago', impact: 'Reduces auth surface, improves UX', aiConfidence: 0.97, aiRecommendation: 'approve' },
  { id: 'GOV-003', title: 'GDPR data retention policy update', type: 'compliance', status: 'review', risk: 'critical', requestedBy: 'Compliance Agent', assignedTo: 'Legal Team', createdAt: '3h ago', impact: 'Legal requirement — 30-day deadline', aiConfidence: 0.85, aiRecommendation: 'review' },
  { id: 'GOV-004', title: 'Increase AI compute budget by 40%', type: 'budget', status: 'pending', risk: 'medium', requestedBy: 'Resource Optimizer', assignedTo: 'Montaser', createdAt: '5h ago', impact: 'Enables 3x throughput, ROI in 6 months', aiConfidence: 0.88, aiRecommendation: 'approve' },
  { id: 'GOV-005', title: 'Deprecate legacy REST API v1', type: 'architecture', status: 'rejected', risk: 'medium', requestedBy: 'Developer Agent', assignedTo: 'Tech Lead', createdAt: '2d ago', impact: '12 active consumers still on v1', aiConfidence: 0.72, aiRecommendation: 'reject' },
  { id: 'GOV-006', title: 'Add encryption-at-rest for PII fields', type: 'security', status: 'approved', risk: 'high', requestedBy: 'Security Agent', assignedTo: 'DevOps', createdAt: '6h ago', impact: 'Compliance requirement, minor perf impact', aiConfidence: 0.95, aiRecommendation: 'approve' },
];

const riskColors: Record<string, { badge: 'error' | 'warning' | 'info' | 'success'; label: string }> = {
  critical: { badge: 'error', label: 'CRITICAL' },
  high: { badge: 'warning', label: 'HIGH' },
  medium: { badge: 'info', label: 'MEDIUM' },
  low: { badge: 'success', label: 'LOW' },
};

const statusConfig: Record<string, { icon: React.FC<{ className?: string; size?: number }>; color: string }> = {
  pending: { icon: Clock, color: 'text-amber-signal-strong' },
  approved: { icon: CheckCircle2, color: 'text-emerald-signal-strong' },
  rejected: { icon: XCircle, color: 'text-rose-signal-strong' },
  review: { icon: Eye, color: 'text-indigo-signal-strong' },
};

export const GovernanceDashboardView: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const [selectedDecision, setSelectedDecision] = useState<GovernanceDecision | null>(null);

  const filtered = filter === 'all' ? sampleDecisions : sampleDecisions.filter((d) => d.status === filter);

  const stats = {
    pending: sampleDecisions.filter((d) => d.status === 'pending').length,
    approved: sampleDecisions.filter((d) => d.status === 'approved').length,
    rejected: sampleDecisions.filter((d) => d.status === 'rejected').length,
    critical: sampleDecisions.filter((d) => d.risk === 'critical').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dark-text-bright flex items-center gap-2">
            <Scale className="h-5 w-5 text-cyan-signal-strong" />
            Decision Governance Center
          </h1>
          <p className="text-dark-muted text-xs font-mono mt-1">
            AI-POWERED COMPLIANCE · RISK ASSESSMENT · APPROVAL WORKFLOWS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<BarChart3 size={14} />}>Reports</Button>
          <Button variant="primary" size="sm" icon={<FileText size={14} />}>New Decision</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'PENDING REVIEW', value: stats.pending, icon: Clock, color: 'text-amber-signal-strong', bg: 'bg-amber-signal/10', border: 'border-amber-signal/20' },
          { label: 'APPROVED', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-signal-strong', bg: 'bg-emerald-signal/10', border: 'border-emerald-signal/20' },
          { label: 'REJECTED', value: stats.rejected, icon: XCircle, color: 'text-rose-signal-strong', bg: 'bg-rose-signal/10', border: 'border-rose-signal/20' },
          { label: 'CRITICAL RISK', value: stats.critical, icon: AlertTriangle, color: 'text-rose-signal-strong', bg: 'bg-rose-signal/10', border: 'border-rose-signal/20' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${stat.bg} border ${stat.border} rounded-xl px-4 py-3`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono text-dark-muted uppercase tracking-widest">{stat.label}</p>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className={`text-2xl font-bold font-mono ${stat.color} mt-1`}>{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-dark-panel/50 border border-dark-panel-raised/60 rounded-xl p-1">
        {['all', 'pending', 'review', 'approved', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filter === f
                ? 'bg-dark-panel-raised text-dark-text-bright border border-dark-panel-soft/80'
                : 'text-dark-muted hover:text-dark-text-muted'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Decision List */}
      <div className="space-y-2">
        {filtered.map((decision, idx) => {
          const StatusIcon = statusConfig[decision.status].icon;
          const risk = riskColors[decision.risk];
          return (
            <motion.div
              key={decision.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`
                bg-dark-panel/50 border border-dark-panel-raised/60 rounded-xl p-4 cursor-pointer
                hover:border-dark-panel-soft/80 transition-all group
                ${selectedDecision?.id === decision.id ? 'border-cyan-signal/30 bg-cyan-signal/5' : ''}
              `}
              onClick={() => setSelectedDecision(decision)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`mt-0.5 p-1.5 rounded-lg ${decision.status === 'approved' ? 'bg-emerald-signal/10' : decision.status === 'rejected' ? 'bg-rose-signal/10' : 'bg-dark-panel-raised/60'}`}>
                    <StatusIcon className={`h-4 w-4 ${statusConfig[decision.status].color}`} size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-dark-muted">{decision.id}</span>
                      <Badge variant={risk.badge} size="xs">{risk.label}</Badge>
                      <Badge variant="neutral" size="xs">{decision.type}</Badge>
                    </div>
                    <h3 className="text-sm font-medium text-dark-text-bright group-hover:text-cyan-signal-soft transition-colors">{decision.title}</h3>
                    <p className="text-xs text-dark-muted mt-1">{decision.impact}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-dark-muted">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {decision.requestedBy}</span>
                      <span>→</span>
                      <span>{decision.assignedTo}</span>
                      <span className="text-dark-panel-soft">·</span>
                      <span>{decision.createdAt}</span>
                    </div>
                  </div>
                </div>

                {/* AI Recommendation */}
                <div className="flex flex-col items-end gap-2 ms-4">
                  <div className="text-end">
                    <p className="text-[9px] font-mono text-dark-muted uppercase">AI RECOMMENDATION</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {decision.aiRecommendation === 'approve' && <ThumbsUp className="h-3 w-3 text-emerald-signal-strong" />}
                      {decision.aiRecommendation === 'reject' && <ThumbsDown className="h-3 w-3 text-rose-signal-strong" />}
                      {decision.aiRecommendation === 'review' && <Eye className="h-3 w-3 text-indigo-signal-strong" />}
                      <span className={`text-xs font-medium ${
                        decision.aiRecommendation === 'approve' ? 'text-emerald-signal-strong' :
                        decision.aiRecommendation === 'reject' ? 'text-rose-signal-strong' : 'text-indigo-signal-strong'
                      }`}>
                        {decision.aiRecommendation.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-1.5 bg-dark-panel-raised rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-signal-deep to-cyan-signal-strong rounded-full"
                        style={{ width: `${decision.aiConfidence * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-cyan-signal-strong">{Math.round(decision.aiConfidence * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Action buttons (show on selected) */}
              {selectedDecision?.id === decision.id && decision.status === 'pending' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 pt-3 border-t border-dark-panel-raised/60 flex items-center gap-2"
                >
                  <Button variant="primary" size="xs" icon={<ThumbsUp size={12} />}>Approve</Button>
                  <Button variant="danger" size="xs" icon={<ThumbsDown size={12} />}>Reject</Button>
                  <Button variant="ghost" size="xs" icon={<MessageSquare size={12} />}>Comment</Button>
                  <Button variant="ghost" size="xs" icon={<ArrowUpRight size={12} />}>Escalate</Button>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
