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
    <div className="min-h-screen bg-[#f9f9f9] pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-zinc-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
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
                  ? 'bg-zinc-900 text-white ring-4 ring-cyan-500 scale-105'
                  : 'bg-white border border-zinc-200'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className={`text-2xl font-bold mb-2 ${tier.popular ? 'text-white' : 'text-zinc-900'}`}>
                {tier.name}
              </h3>
              <div className="mb-4">
                <span className={`text-4xl font-bold ${tier.popular ? 'text-white' : 'text-zinc-900'}`}>
                  {tier.price}
                </span>
                <span className={tier.popular ? 'text-zinc-300' : 'text-zinc-500'}>{tier.period}</span>
              </div>
              <p className={`mb-6 ${tier.popular ? 'text-zinc-300' : 'text-zinc-600'}`}>
                {tier.description}
              </p>
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle className={`w-5 h-5 ${tier.popular ? 'text-cyan-400' : 'text-cyan-600'}`} />
                    <span className={tier.popular ? 'text-zinc-200' : 'text-zinc-700'}>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/register')}
                className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                  tier.popular
                    ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                    : 'bg-zinc-900 text-white hover:bg-zinc-800'
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
