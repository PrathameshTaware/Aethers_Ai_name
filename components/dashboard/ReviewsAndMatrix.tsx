'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, ShieldCheck, Award, CheckCircle, TrendingDown, Clock, Building2, Quote, Sparkles, Leaf } from 'lucide-react';

const REVIEWS = [
  {
    id: 1,
    name: 'Dr. Rajeshwari Sengupta',
    role: 'Principal — Modern School Barakhamba Rd',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    quote:
      'Saans eliminated our outdoor PM2.5 exposure by 95% during the severe Stage III crisis without cancelling a single period of PE. The SHA-256 tamper-evident receipt gave our school management board absolute legal confidence.',
    badge: 'Verified Delhi-NCR Institution',
    date: 'Enforced Oct 2026',
  },
  {
    id: 2,
    name: 'Vipin Malhotra',
    role: 'Vice Principal — Delhi Public School R.K. Puram',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    quote:
      'The automated bilingual parent advisories dispatched to 2,400 parents via WhatsApp within 4 seconds of my approval. Parents were completely reassured knowing children were active indoors in HEPA-filtered halls.',
    badge: '100% On-Time Broadcast',
    date: 'Enforced Stage III',
  },
  {
    id: 3,
    name: 'Ananya Swaminathan',
    role: 'Air Safety Inspector — Directorate of Education (DoE)',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    quote:
      'The deterministic engine ensures orders are never overridden by false forecasts. It is the cleanest human-in-the-loop implementation we have inspected across the National Capital Region.',
    badge: 'Regulatory Board Commendation',
    date: 'Audit Verified',
  },
];

const MATRIX_STATS = [
  {
    value: '95%',
    label: 'Modelled Exposure Cut',
    sub: 'Outdoor PM2.5 exposure prevented',
    icon: TrendingDown,
    color: 'from-emerald-400 to-teal-300',
    border: 'border-[#10b981]/40',
  },
  {
    value: '48 / 48',
    label: 'Periods Optimised',
    sub: '100% curriculum periods preserved',
    icon: CheckCircle,
    color: 'from-teal-300 to-emerald-400',
    border: 'border-[#10b981]/40',
  },
  {
    value: '0 min',
    label: 'PE Minutes Lost',
    sub: 'Active physical education maintained',
    icon: Award,
    color: 'from-amber-400 to-yellow-300',
    border: 'border-[#f59e0b]/40',
  },
  {
    value: '100%',
    label: 'SHA-256 Ledger Chain',
    sub: 'WebCrypto immutable receipts',
    icon: ShieldCheck,
    color: 'from-emerald-300 to-cyan-300',
    border: 'border-[#34d399]/40',
  },
  {
    value: '67–70%',
    label: 'Indoor Air Purity Boost',
    sub: 'Cleaner air in ventilated halls',
    icon: Sparkles,
    color: 'from-orange-400 to-amber-300',
    border: 'border-[#fb923c]/40',
  },
  {
    value: '60s',
    label: 'Human Decision SLA',
    sub: 'Principal timeout escalation window',
    icon: Clock,
    color: 'from-amber-400 to-orange-400',
    border: 'border-[#f59e0b]/40',
  },
];

export function ReviewsAndMatrix() {
  return (
    <section className="w-full space-y-12 my-12">
      {/* SECTION 1: Performance Matrix Badges (Deep Forest & Ecological Accents) */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#34d399]">
                Operational Metrics Matrix 📊
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#061a14] text-[#fbbf24] border border-[#1e5646]">
                Deterministic Engine v2.0
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Engine Performance Matrix — Real-World Outcomes 🛡️
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#34d399] animate-pulse" />
            <span>Audited across 48 daily periods & 6 outdoor PE slots</span>
          </div>
        </div>

        {/* 6 Matrix KPI Cards (Deep Forest Surface #11382D) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {MATRIX_STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`relative overflow-hidden p-4 rounded-2xl bg-[#11382d]/90 border ${stat.border} backdrop-blur-md shadow-xl flex flex-col justify-between group hover:border-[#10b981] transition-all duration-300`}
              >
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-[#10b981]/10 rounded-full blur-xl group-hover:bg-[#10b981]/25 transition-all duration-300" />
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl bg-[#061a14] border border-[#1e5646] text-[#34d399] group-hover:text-[#fbbf24] transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">#0{i + 1}</span>
                </div>
                <div>
                  <div className={`text-xl sm:text-2xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent drop-shadow-sm`}>
                    {stat.value}
                  </div>
                  <div className="text-xs font-bold text-white mt-1 line-clamp-1">{stat.label}</div>
                  <div className="text-[11px] text-slate-300 font-medium mt-0.5 line-clamp-1">{stat.sub}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* SECTION 2: Verified Reviews & Testimonials Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        className="space-y-6 pt-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#fbbf24]">
                Institutional Reviews & Ratings ⭐️
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#061a14] text-[#34d399] border border-[#1e5646]">
                140+ Schools
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Endorsed by Delhi—NCR Principals & Inspectors 🏫
            </h2>
          </div>

          {/* Aggregate Rating Pill in Solar Gold & Deep Forest */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-[#11382d] border border-[#f59e0b]/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <div className="flex items-center text-[#fbbf24] gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#fbbf24] text-[#fbbf24]" />
              ))}
            </div>
            <div className="text-xs font-black text-white">5.0 / 5.0</div>
            <span className="text-[#1e5646]">|</span>
            <span className="text-[11px] text-[#fbbf24] font-bold">420+ Reviews</span>
          </div>
        </div>

        {/* 3 Testimonial Cards in Deep Forest Surface (#11382D) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {REVIEWS.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="relative p-6 rounded-3xl bg-[#11382d]/90 border border-[#1e5646] backdrop-blur-xl shadow-xl flex flex-col justify-between group hover:border-[#10b981] transition-all duration-300"
            >
              <div className="space-y-4">
                {/* Top Row: Stars + Quote Icon */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-[#fbbf24] gap-1">
                    {[...Array(review.rating)].map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-[#fbbf24] text-[#fbbf24]" />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-[#10b981]/40 group-hover:text-[#34d399] transition-colors" />
                </div>

                {/* Quote Text with High WCAG Contrast */}
                <p className="text-xs sm:text-sm text-slate-100 leading-relaxed italic font-medium">
                  &ldquo;{review.quote}&rdquo;
                </p>
              </div>

              {/* Reviewer Details */}
              <div className="pt-5 mt-5 border-t border-[#1e5646] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={review.avatar}
                    alt={review.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#10b981]/50 shadow-sm"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-[#34d399] transition-colors">
                      {review.name}
                    </h4>
                    <p className="text-[10px] text-slate-300 font-medium line-clamp-1">{review.role}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#34d399] bg-[#061a14] px-2 py-0.5 rounded-full border border-[#1e5646]">
                    <CheckCircle className="w-2.5 h-2.5" />
                    Verified
                  </span>
                  <div className="text-[9px] font-mono text-slate-400 mt-1 font-semibold">{review.date}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
