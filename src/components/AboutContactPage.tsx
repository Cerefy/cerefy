import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, MapPin, Phone, Send, MessageSquare } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-on-surface mb-4">Contact Us</h1>
          <p className="text-xl text-on-surface-variant">
            Have questions? We'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-start gap-4">
              <Mail className="w-6 h-6 text-cyan-signal-deep mt-1" />
              <div>
                <h3 className="font-semibold text-on-surface">Email</h3>
                <p className="text-on-surface-variant">support@cerefy.io</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <MapPin className="w-6 h-6 text-cyan-signal-deep mt-1" />
              <div>
                <h3 className="font-semibold text-on-surface">Location</h3>
                <p className="text-on-surface-variant">San Francisco, CA</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="w-6 h-6 text-cyan-signal-deep mt-1" />
              <div>
                <h3 className="font-semibold text-on-surface">Phone</h3>
                <p className="text-on-surface-variant">+1 (555) 123-4567</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-surface-container-lowest rounded-xl p-8 border border-outline-soft"
          >
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Name</label>
                <input type="text" className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-cyan-signal focus:border-transparent" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Email</label>
                <input type="email" className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-cyan-signal focus:border-transparent" placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Message</label>
                <textarea rows={4} className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-cyan-signal focus:border-transparent" placeholder="How can we help?" />
              </div>
              <button type="submit" className="w-full bg-on-surface text-surface-container-lowest py-3 rounded-lg font-semibold hover:bg-on-surface-muted-strong transition-colors flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </form>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-16"
        >
          <button
            onClick={() => navigate('/register')}
            className="bg-cyan-signal-deep text-surface-container-lowest px-8 py-4 rounded-lg font-semibold inline-flex items-center gap-2 hover:bg-cyan-signal-muted transition-colors"
          >
            Start Free Trial
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-on-surface mb-4">About Cerefy</h1>
          <p className="text-xl text-on-surface-variant max-w-2xl mx-auto">
            Building the future of enterprise AI automation.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-lowest rounded-xl p-8 border border-outline-soft mb-8"
        >
          <h2 className="text-2xl font-bold text-on-surface mb-4">Our Mission</h2>
          <p className="text-on-surface-variant leading-relaxed">
            Cerefy is the Enterprise AI Implementation Operating System. We enable organizations to deploy, 
            manage, and scale AI agents across their entire workflow. Our platform combines LangGraph orchestration, 
            enterprise memory, and real-time collaboration to transform how businesses operate.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-lowest rounded-xl p-8 border border-outline-soft mb-8"
        >
          <h2 className="text-2xl font-bold text-on-surface mb-4">Our Values</h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-cyan-signal mt-2" />
              <div>
                <h3 className="font-semibold text-on-surface">Security First</h3>
                <p className="text-on-surface-variant">SOC2-compliant with end-to-end encryption</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-cyan-signal mt-2" />
              <div>
                <h3 className="font-semibold text-on-surface">Innovation</h3>
                <p className="text-on-surface-variant">Cutting-edge AI research applied to real-world problems</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-cyan-signal mt-2" />
              <div>
                <h3 className="font-semibold text-on-surface">Customer Success</h3>
                <p className="text-on-surface-variant">Dedicated support for enterprise customers</p>
              </div>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};
