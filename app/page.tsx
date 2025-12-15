'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSystemSettings } from '@/lib/api/settings';
import { 
  Users, 
  Receipt, 
  TrendingUp, 
  Shield, 
  Clock, 
  BarChart3,
  CheckCircle2,
  ArrowRight,
  PlayCircle,
  School,
  Wallet,
  CalendarCheck,
  FileText,
  Sparkles,
  Star,
  MapPin,
  Phone,
  MessageCircle,
  Mail
} from 'lucide-react';

export default function Home() {
  // Fetch system settings for dynamic values
  const { data: settings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: getSystemSettings,
  });

  const videoUrl = settings?.tutorial_video_url || '';
  const supportEmail = settings?.support_email || 'mohinderpunia82@gmail.com';
  const supportMobile = settings?.support_mobile || '+91 95182 33053';
  const supportAddress = settings?.support_address || 'Pal Nagar, Kachwa Road, Karnal, Haryana (India)';
  const trialDays = settings?.trial_period_days || 7;
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const features = [
    {
      icon: Users,
      title: "Student Management",
      description: "Comprehensive student profiles with attendance tracking, academic records, and parent communication.",
      color: "#223E97"
    },
    {
      icon: Receipt,
      title: "Fee Management",
      description: "Automated billing, payment tracking, digital receipts, and instant notifications for parents.",
      color: "#18C3A8"
    },
    {
      icon: Wallet,
      title: "Staff Payroll",
      description: "Streamlined salary management with automatic calculations, deductions, and digital pay slips.",
      color: "#3EB489"
    },
    {
      icon: CalendarCheck,
      title: "Attendance System",
      description: "Real-time attendance marking, reports, and analytics for both students and staff members.",
      color: "#223E97"
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Powerful insights with customizable reports, charts, and data visualization tools.",
      color: "#18C3A8"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Bank-level security with role-based access control and automated data backups.",
      color: "#3EB489"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Register Your School",
      description: "Quick and easy registration process with essential details"
    },
    {
      number: "02",
      title: "Set Up Classes & Staff",
      description: "Add your classrooms, students, and staff members"
    },
    {
      number: "03",
      title: "Configure Fee Structure",
      description: "Define fee components and payment schedules"
    },
    {
      number: "04",
      title: "Start Managing",
      description: "Begin tracking attendance, fees, and generating reports"
    }
  ];

  const benefits = [
    "Save Time per week on administrative tasks",
    "Reduce paperwork by 100% with digital records",
    "Instant fee payment notifications",
    "Real-time attendance tracking",
    "Automated salary calculations",
    "24/7 access from anywhere"
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <img src="/logo.png" alt="FeeAdmin" className="h-8 w-auto" />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4"
          >
            <Link 
              href="/login"
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{ color: '#223E97' }}
            >
              Sign In
            </Link>
            <Link 
              href="/register"
              className="px-6 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:shadow-lg"
              style={{ background: 'linear-gradient(to right, #223E97, #18C3A8)' }}
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ backgroundColor: 'rgba(24, 195, 168, 0.1)', border: '1px solid rgba(24, 195, 168, 0.3)' }}
            >
              <Sparkles className="w-4 h-4" style={{ color: '#18C3A8' }} />
              <span className="text-sm font-medium" style={{ color: '#18C3A8' }}>Smart School Management Platform</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-[#223E97] to-[#18C3A8] bg-clip-text text-transparent">
                Simplify School Management
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto" style={{ color: '#1A1F36', opacity: 0.7 }}>
              Complete solution for managing students, fees, staff, and attendance. 
              <br />
              Save time, reduce paperwork, and focus on what matters most - <span className="font-semibold" style={{ color: '#18C3A8' }}>education</span>.
            </p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link 
                href="/register"
                className="group px-8 py-4 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                style={{ background: 'linear-gradient(to right, #223E97, #18C3A8)' }}
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="#demo"
                className="px-8 py-4 bg-white rounded-xl font-semibold text-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                style={{ color: '#223E97', border: '2px solid #223E97' }}
              >
                <PlayCircle className="w-5 h-5" />
                Watch Demo
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="grid md:grid-cols-4 gap-6 mt-16"
          >
            {[
              { label: "Schools", value: "500+", icon: School },
              { label: "Students", value: "50K+", icon: Users },
              { label: "Success Rate", value: "100%", icon: Star },
              { label: "Uptime", value: "100%", icon: Shield }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                className="bg-white p-6 rounded-xl shadow-md text-center"
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3" style={{ color: '#18C3A8' }} />
                <div className="text-3xl font-bold mb-1" style={{ color: '#223E97' }}>{stat.value}</div>
                <div className="text-sm" style={{ color: '#64748b' }}>{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#1A1F36' }}>
              Everything Your School Needs
            </h2>
            <p className="text-xl" style={{ color: '#64748b' }}>
              Comprehensive tools designed specifically for educational institutions
            </p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-100"
              >
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${feature.color}15` }}
                >
                  <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: '#1A1F36' }}>
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4" style={{ backgroundColor: '#F5F7FA' }}>
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#1A1F36' }}>
              Get Started in Minutes
            </h2>
            <p className="text-xl" style={{ color: '#64748b' }}>
              Simple 4-step process to transform your school management
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8 md:gap-4 relative">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="relative"
              >
                <div className="relative z-10 bg-white p-6 rounded-2xl shadow-md">
                  <div 
                    className="text-5xl font-bold mb-4 opacity-20"
                    style={{ color: '#223E97' }}
                  >
                    {step.number}
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#1A1F36' }}>
                    {step.title}
                  </h3>
                  <p className="text-sm" style={{ color: '#64748b' }}>
                    {step.description}
                  </p>
                </div>
                
                {/* Line connector */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 left-full w-4 h-0.5 -translate-y-1/2" style={{ backgroundColor: '#18C3A8' }} />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section id="demo" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#1A1F36' }}>
              See FeeAdmin in Action
            </h2>
            <p className="text-xl" style={{ color: '#64748b' }}>
              Watch how schools are transforming their management with our platform
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: '#1A1F36', aspectRatio: '16/9' }}
          >
            {videoUrl ? (
              <video
                controls
                className="w-full h-full object-cover"
                poster="/video-thumbnail.jpg"
              >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              /* Video Placeholder */
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <PlayCircle className="w-24 h-24 mx-auto mb-4" style={{ color: '#18C3A8' }} />
                  <p className="text-white text-lg">Demo Video Coming Soon</p>
                  <p className="text-gray-400 text-sm mt-2">Full platform walkthrough</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4" style={{ backgroundColor: '#F5F7FA' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: '#1A1F36' }}>
                Why Schools Choose FeeAdmin
              </h2>
              <p className="text-lg mb-8" style={{ color: '#64748b' }}>
                Join hundreds of schools that have already transformed their administrative processes
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: '#3EB489' }} />
                    <span className="text-lg" style={{ color: '#1A1F36' }}>{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-white p-8 rounded-2xl shadow-xl">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#223E9710' }}>
                      <Clock className="w-6 h-6" style={{ color: '#223E97' }} />
                    </div>
                    <div>
                      <div className="font-bold text-2xl" style={{ color: '#223E97' }}>Save Time</div>
                      <div className="text-sm" style={{ color: '#64748b' }}>Every week</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#18C3A810' }}>
                      <TrendingUp className="w-6 h-6" style={{ color: '#18C3A8' }} />
                    </div>
                    <div>
                      <div className="font-bold text-2xl" style={{ color: '#18C3A8' }}>100%</div>
                      <div className="text-sm" style={{ color: '#64748b' }}>Less paperwork</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3EB48910' }}>
                      <FileText className="w-6 h-6" style={{ color: '#3EB489' }} />
                    </div>
                    <div>
                      <div className="font-bold text-2xl" style={{ color: '#3EB489' }}>100%</div>
                      <div className="text-sm" style={{ color: '#64748b' }}>Digital records</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#223E97] to-[#18C3A8]">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your School?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join hundreds of schools already using FeeAdmin. Start your free trial today!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-4 bg-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                style={{ color: '#223E97' }}
              >
                Start Free Trial
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-all"
              >
                Sign In
              </Link>
            </div>

            <p className="text-white/70 text-sm mt-6">
              No credit card required • {trialDays}-day free trial • Cancel anytime
            </p>

            {/* Contact Details */}
            <div className="mt-12 pt-8 border-t border-white/20">
              <h3 className="text-2xl font-bold text-white mb-6">Get in Touch</h3>
              <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-left">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">Address</h4>
                      <p className="text-white/80 text-sm">
                        {supportAddress}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-left">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">Contact</h4>
                      <a 
                        href={`https://wa.me/${supportMobile.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/80 text-sm hover:text-white transition-colors flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 w-4" />
                        {supportMobile}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-left">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">Email</h4>
                      <a 
                        href={`mailto:${supportEmail}`}
                        className="text-white/80 text-sm hover:text-white transition-colors break-all"
                      >
                        {supportEmail}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
