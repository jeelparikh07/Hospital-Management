'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft, UserCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function SignupPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    hospitalId: '',
    department: '',
    specialization: '',
  });

  const roles = [
    { value: 'patient', label: 'Patient' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'receptionist', label: 'Receptionist' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const registerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        hospitalId: formData.hospitalId || undefined,
        department: formData.department || undefined,
        specialization: formData.specialization || undefined,
      };

      const response = await authAPI.register(registerData);
      const { user, token } = response.data.data;

      // Store token
      localStorage.setItem('token', token);

      // Update auth store
      login(user, token);

      toast.success('Account created successfully!');

      // Redirect based on role
      const roleRoutes = {
        patient: '/patient/dashboard',
        doctor: '/doctor/dashboard',
        receptionist: '/reception/dashboard',
        admin: '/admin/dashboard',
      };

      router.push(roleRoutes[user.role as keyof typeof roleRoutes]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone) {
        toast.error('Please fill in all fields');
        return;
      }
      if (!formData.email.includes('@')) {
        toast.error('Please enter a valid email');
        return;
      }
    }
    if (step === 2) {
      if (!formData.password || !formData.confirmPassword) {
        toast.error('Please fill in all fields');
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 xl:px-0">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-lg"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <Card glass hover={false} className="py-10 px-6 sm:px-10">
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-3 mb-5"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center shadow-lg">
                <Activity className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Create Account</h1>
            <p className="text-gray-600">Join thousands of users managing their healthcare journey</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <motion.div
                key={s}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`w-3 h-3 rounded-full transition-colors ${
                  s <= step ? 'bg-gradient-to-r from-primary-600 to-secondary-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Input
                  id="name"
                  type="text"
                  label="Full Name"
                  placeholder="John Doe"
                  icon={<User className="w-5 h-5" />}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  id="email"
                  type="email"
                  label="Email Address"
                  placeholder="you@example.com"
                  icon={<Mail className="w-5 h-5" />}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Input
                  id="phone"
                  type="tel"
                  label="Phone Number"
                  placeholder="+1 (555) 000-0000"
                  icon={<Phone className="w-5 h-5" />}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <Select
                  label="I am a"
                  options={roles}
                  value={formData.role}
                  onChange={(value) => setFormData({ ...formData, role: value })}
                />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="••••••••"
                  icon={<Lock className="w-5 h-5" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  label="Confirm Password"
                  placeholder="••••••••"
                  icon={<Lock className="w-5 h-5" />}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                {formData.role === 'doctor' && (
                  <>
                    <Input
                      id="specialization"
                      type="text"
                      label="Specialization"
                      placeholder="e.g., Cardiology, Pediatrics"
                      icon={<UserCheck className="w-5 h-5" />}
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    />
                    <Input
                      id="department"
                      type="text"
                      label="Department"
                      placeholder="e.g., Medicine"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </>
                )}

                <div className="glass-card rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name:</span>
                      <span className="text-gray-900">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="text-gray-900">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Role:</span>
                      <span className="text-gray-900 capitalize">{formData.role}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex gap-3">
              {step > 1 && (
                <Button type="button" variant="secondary" onClick={prevStep} className="flex-1">
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button type="button" onClick={nextStep} className="flex-1">
                  Continue
                </Button>
              ) : (
                <Button type="submit" isLoading={isLoading} className="flex-1">
                  Create Account
                </Button>
              )}
            </div>
          </form>

          <div className="mt-10 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
