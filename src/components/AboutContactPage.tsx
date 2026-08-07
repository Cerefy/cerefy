import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, MapPin, Phone, Send, MessageSquare } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f9f9f9] pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-zinc-900 mb-4">Contact Us</h1>
          <p className="text-xl text-zinc-600">
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
              <Mail className="w-6 h-6 text-cyan-600 mt-1" />
              <div>
                <h3 className="font-semibold text-zinc-900">Email</h3>
                <p className="text-zinc-600">support@cerefy.io</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <MapPin className="w-6 h-6 text-cyan-600 mt-1" />
              <div>
                <h3 className="font-semibold text-zinc-900">Location</h3>
                <p className="text-zinc-600">San Francisco, CA</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="w-6 h-6 text-cyan-600 mt-1" />
              <div>
                <h3 className="font-semibold text-zinc-900">Phone</h3>
                <p className="text-zinc-600">+1 (555) 123-4567</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-8 border border-zinc-200"
          >
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Name</label>
                <input type="text" className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                <input type="email" className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Message</label>
                <textarea rows={4} className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" placeholder="How can we help?" />
              </div>
              <button type="submit" className="w-full bg-zinc-900 text-white py-3 rounded-lg font-semibold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2">
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
            className="bg-cyan-600 text-white px-8 py-4 rounded-lg font-semibold inline-flex items-center gap-2 hover:bg-cyan-700 transition-colors"
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
    <div className="min-h-screen bg-[#f9f9f9] pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-zinc-900 mb-4">About Cerefy</h1>
          <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
            Building the future of enterprise AI automation.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-8 border border-zinc-200 mb-8"
        >
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">Our Mission</h2>
          <p className="text-zinc-600 leading-relaxed">
            Cerefy is the Enterprise AI Implementation Operating System. We enable organizations to deploy, 
            manage, and scale AI agents across their entire workflow. Our platform combines LangGraph orchestration, 
            enterprise memory, and real-time collaboration to transform how businesses operate.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-8 border border-zinc-200 mb-8"
        >
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">Our Values</h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-cyan-500 mt-2" />
              <div>
                <h3 className="font-semibold text-zinc-900">Security First</h3>
                <p className="text-zinc-600">SOC2-compliant with end-to-end encryption</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-cyan-500 mt-2" />
              <div>
                <h3 className="font-semibold text-zinc-900">Innovation</h3>
                <p className="text-zinc-600">Cutting-edge AI research applied to real-world problems</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-cyan-500 mt-2" />
              <div>
                <h3 className="font-semibold text-zinc-900">Customer Success</h3>
                <p className="text-zinc-600">Dedicated support for enterprise customers</p>
              </div>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};
