import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle, ArrowRight, Sparkles, Zap, Shield, Globe, Users, Bot } from 'lucide-react';

const tiers = [
  {
    name: 'Starter',
    price: '$49',
    period: '/mo',
    description: 'For small teams getting started with AI automation',
    features: [
      '5 AI Agents',
      '1,000 tasks/month',
      'Basic analytics',
      'Email support',
      '1 workspace',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Professional',
    price: '$149',
    period: '/mo',
    description: 'For growing teams that need more power',
    features: [
      '25 AI Agents',
      '10,000 tasks/month',
      'Advanced analytics',
      'Priority support',
      '5 workspaces',
      'Custom integrations',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with custom needs',
    features: [
      'Unlimited AI Agents',
      'Unlimited tasks',
      'Full analytics suite',
      'Dedicated support',
      'Unlimited workspaces',
      'Custom development',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-on-surface mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-on-surface-variant max-w-2xl mx-auto">
            Choose the plan that fits your team. All plans include a 14-day free trial.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier, idx) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative rounded-2xl p-8 ${
                tier.popular
                  ? 'bg-on-surface text-surface-container-lowest ring-4 ring-cyan-signal scale-105'
                  : 'bg-surface-container-lowest border border-outline-soft'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-signal text-surface-container-lowest text-sm font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className={`text-2xl font-bold mb-2 ${tier.popular ? 'text-surface-container-lowest' : 'text-on-surface'}`}>
                {tier.name}
              </h3>
              <div className="mb-4">
                <span className={`text-4xl font-bold ${tier.popular ? 'text-surface-container-lowest' : 'text-on-surface'}`}>
                  {tier.price}
                </span>
                <span className={tier.popular ? 'text-outline-variant' : 'text-on-surface-muted'}>{tier.period}</span>
              </div>
              <p className={`mb-6 ${tier.popular ? 'text-outline-variant' : 'text-on-surface-variant'}`}>
                {tier.description}
              </p>
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle className={`w-5 h-5 ${tier.popular ? 'text-cyan-signal-strong' : 'text-cyan-signal-deep'}`} />
                    <span className={tier.popular ? 'text-outline-soft' : 'text-on-surface-variant'}>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/register')}
                className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                  tier.popular
                    ? 'bg-cyan-signal text-surface-container-lowest hover:bg-cyan-signal-deep'
                    : 'bg-on-surface text-surface-container-lowest hover:bg-on-surface-muted-strong'
                }`}
              >
                {tier.cta}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
