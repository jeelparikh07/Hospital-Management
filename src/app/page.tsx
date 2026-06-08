'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import { 
  Clock, 
  Users, 
  Bell, 
  Activity, 
  CheckCircle, 
  ArrowRight,
  Play,
  Star,
  Zap,
  Shield,
  TrendingUp,
  Menu,
  X
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useState } from 'react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const features = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Real-Time Queue Tracking',
      description: 'Track your position in the queue with live updates and accurate wait time predictions.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: 'Smart Notifications',
      description: 'Get notified when your turn is approaching. No more waiting in crowded halls.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Multi-Role Support',
      description: 'Dedicated interfaces for patients, doctors, receptionists, and administrators.',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: 'AI Wait Prediction',
      description: 'Machine learning algorithms predict accurate wait times based on historical data.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure & Private',
      description: 'Enterprise-grade security to protect patient data and privacy.',
      color: 'from-indigo-500 to-blue-500',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Analytics Dashboard',
      description: 'Comprehensive insights into hospital operations and patient flow.',
      color: 'from-teal-500 to-cyan-500',
    },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Book Your Token',
      description: 'Select your hospital, department, and doctor. Get a digital token instantly.',
      icon: <CheckCircle className="w-8 h-8" />,
    },
    {
      step: '02',
      title: 'Track Your Queue',
      description: 'Monitor your position in real-time with accurate wait time estimates.',
      icon: <Clock className="w-8 h-8" />,
    },
    {
      step: '03',
      title: 'Get Notified',
      description: 'Receive alerts when your turn is approaching. Arrive just in time.',
      icon: <Bell className="w-8 h-8" />,
    },
    {
      step: '04',
      title: 'Consult Doctor',
      description: 'Walk in for your consultation when called. No more waiting.',
      icon: <Users className="w-8 h-8" />,
    },
  ];

  const stats = [
    { value: '50+', label: 'Hospitals' },
    { value: '10K+', label: 'Daily Patients' },
    { value: '500+', label: 'Doctors' },
    { value: '60%', label: 'Wait Time Reduced' },
  ];

  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Chief Medical Officer',
      hospital: 'City General Hospital',
      content: 'This system has transformed how we manage patient flow. Wait times reduced by 60% and patient satisfaction is at an all-time high.',
      avatar: 'SJ',
    },
    {
      name: 'Michael Chen',
      role: 'Hospital Administrator',
      hospital: 'Metro Healthcare',
      content: 'The analytics dashboard gives us incredible insights. We can now optimize staff allocation based on real-time data.',
      avatar: 'MC',
    },
    {
      name: 'Dr. Emily Rodriguez',
      role: 'Senior Physician',
      hospital: 'Community Medical Center',
      content: 'As a doctor, I love how streamlined the consultation process has become. Patients arrive on time, and the workflow is smooth.',
      avatar: 'ER',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 overflow-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">QueueMed</span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-gray-600 hover:text-primary-600 transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-primary-600 transition-colors">
                How It Works
              </Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-primary-600 transition-colors">
                Testimonials
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-primary-600 transition-colors">
                Pricing
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/20"
          >
            <div className="px-4 py-4 space-y-4">
              <Link href="#features" className="block text-gray-600 hover:text-primary-600">Features</Link>
              <Link href="#how-it-works" className="block text-gray-600 hover:text-primary-600">How It Works</Link>
              <Link href="#testimonials" className="block text-gray-600 hover:text-primary-600">Testimonials</Link>
              <Link href="#pricing" className="block text-gray-600 hover:text-primary-600">Pricing</Link>
              <div className="pt-4 flex flex-col gap-2">
                <Link href="/login">
                  <Button variant="ghost" className="w-full">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Animated Background Elements */}
        <motion.div
          style={{ y, opacity }}
          className="absolute inset-0 overflow-hidden"
        >
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-full blur-3xl" />
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm mb-8"
            >
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Revolutionizing Healthcare Wait Times</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold font-display mb-6 leading-tight">
              <span className="text-gray-900">Say Goodbye to</span>
              <br />
              <span className="gradient-text">Long Waiting Times</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
              Smart Hospital Queue Management System that lets patients book tokens online, 
              track their queue in real-time, and get notified when their turn is near.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto group">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto group">
                  <Play className="w-5 h-5" />
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Illustration */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="relative max-w-5xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary-500 rounded-3xl blur-2xl opacity-20 transform rotate-1" />
              <div className="relative glass-card rounded-3xl p-8 shadow-2xl">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Phone Mockup */}
                  <div className="md:col-span-1">
                    <div className="bg-gray-900 rounded-3xl p-4 shadow-2xl">
                      <div className="bg-white rounded-2xl overflow-hidden">
                        <div className="h-4 bg-gray-100 flex items-center justify-center gap-2">
                          <div className="w-12 h-4 bg-gray-300 rounded-b-lg" />
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl" />
                          <div className="h-8 bg-gray-100 rounded-lg" />
                          <div className="h-8 bg-gray-100 rounded-lg" />
                          <div className="h-24 bg-gray-50 rounded-xl" />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Dashboard Preview */}
                  <div className="md:col-span-2">
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <div className="text-sm text-gray-500">Current Token</div>
                          <div className="text-4xl font-bold gradient-text">A042</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Your Token</div>
                          <div className="text-2xl font-bold text-gray-900">A056</div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '65%' }}
                            transition={{ delay: 1.5, duration: 1 }}
                            className="h-full bg-gradient-to-r from-primary-600 to-secondary-500 rounded-full"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-green-50 rounded-xl">
                            <div className="text-2xl font-bold text-green-600">14</div>
                            <div className="text-xs text-gray-500">Ahead</div>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded-xl">
                            <div className="text-2xl font-bold text-blue-600">35</div>
                            <div className="text-xs text-gray-500">Mins Wait</div>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-xl">
                            <div className="text-2xl font-bold text-purple-600">Live</div>
                            <div className="text-xs text-gray-500">Status</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
              <span className="gradient-text">Powerful Features</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to streamline your hospital's patient flow
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className="h-full group" hover>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in just a few simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary-500 to-transparent -translate-y-1/2 z-0" />
                )}
                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-600 to-secondary-500 text-white mb-6 shadow-lg">
                    {step.icon}
                  </div>
                  <div className="text-sm font-bold text-primary-600 mb-2">STEP {step.step}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
              Loved by <span className="gradient-text">Healthcare Professionals</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what our customers have to say
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <Card className="h-full" hover>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                      <div className="text-sm text-primary-600">{testimonial.hospital}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
              Simple, Transparent <span className="gradient-text">Pricing</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your hospital's needs
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '$99',
                description: 'Perfect for small clinics',
                features: ['Up to 3 doctors', 'Basic queue management', 'Email support', 'Mobile app access'],
              },
              {
                name: 'Professional',
                price: '$299',
                description: 'Ideal for medium hospitals',
                features: ['Up to 20 doctors', 'Advanced analytics', 'Priority support', 'Custom integrations', 'SMS notifications'],
                popular: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                description: 'For large healthcare networks',
                features: ['Unlimited doctors', 'AI predictions', '24/7 support', 'White-label solution', 'Dedicated account manager'],
              },
            ].map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <Card
                  className={`h-full relative ${plan.popular ? 'border-2 border-primary-600 scale-105' : ''}`}
                  hover={false}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-primary-600 to-secondary-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-500 mb-4">{plan.description}</p>
                    <div className="text-5xl font-bold gradient-text">{plan.price}</div>
                    {plan.price !== 'Custom' && <span className="text-gray-500">/month</span>}
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.popular ? 'primary' : 'secondary'}>
                    {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 animated-gradient opacity-10" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
              Ready to Transform Your <span className="gradient-text">Hospital?</span>
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Join 50+ hospitals already using QueueMed to reduce wait times and improve patient satisfaction.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Schedule Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">QueueMed</span>
              </div>
              <p className="text-gray-400">
                Revolutionizing healthcare queue management with smart technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#testimonials" className="hover:text-white transition-colors">Testimonials</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 QueueMed. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
