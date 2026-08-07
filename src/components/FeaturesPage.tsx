import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bot, Shield, Zap, Globe, Users, Brain, Database, Lock, ArrowRight } from 'lucide-react';

const features = [
  { icon: Bot, title: 'AI Agents', desc: 'Deploy autonomous agents that learn and adapt to your workflows' },
  { icon: Brain, title: 'Enterprise Memory', desc: 'Persistent knowledge graph that grows with your organization' },
  { icon: Shield, title: 'Security First', desc: 'SOC2-compliant with end-to-end encryption and RBAC' },
  { icon: Zap, title: 'Real-time', desc: 'Sub-second latency with WebSocket-powered collaboration' },
  { icon: Globe, title: 'Integrations', desc: 'Connect with 100+ tools including Slack, GitHub, and Jira' },
  { icon: Database, title: 'Knowledge Graph', desc: 'Neo4j-powered graph database for complex relationships' },
  { icon: Users, title: 'Team Collaboration', desc: 'Multi-tenant workspaces with granular permissions' },
  { icon: Lock, title: 'Compliance', desc: 'GDPR, HIPAA, and SOC2 compliant out of the box' },
];

export const FeaturesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f9f9f9] pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-zinc-900 mb-4">Everything You Need</h1>
          <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
            A complete AI operating system for modern enterprises.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-xl p-6 border border-zinc-200 hover:border-cyan-300 hover:shadow-lg transition-all"
            >
              <feature.icon className="w-10 h-10 text-cyan-600 mb-4" />
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">{feature.title}</h3>
              <p className="text-zinc-600 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-16"
        >
          <button
            onClick={() => navigate('/register')}
            className="bg-zinc-900 text-white px-8 py-4 rounded-lg font-semibold inline-flex items-center gap-2 hover:bg-zinc-800 transition-colors"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};
