'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Moon, Sun, Shield, Database, Clock, Bell, Download, RotateCcw, X, Users, Building2, FileText, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CustomSelect from '@/components/ui/CustomSelect';
import { useSettingsStore, applyDarkMode } from '@/store/settingsStore';
import { useDepartmentStore } from '@/store/departmentStore';
import { useNotificationStore } from '@/store/notificationStore';
import toast from 'react-hot-toast';
import { hospitalAPI, userAPI, departmentAPI } from '@/lib/api';

type Tab = 'general' | 'appearance' | 'queue' | 'security' | 'data';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { settings, updateSettings, resetSettings, getSettings } = useSettingsStore();
  const { departments } = useDepartmentStore();
  const { notifications } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [allData, setAllData] = useState<any>({
    hospitals: [],
    departments: [],
    doctors: [],
    users: [],
  });
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    // Apply dark mode from settings on mount
    applyDarkMode(settings.appearance.darkMode);
  }, []);

  useEffect(() => {
    // Load data summary when Data tab is active
    if (activeTab === 'data' && !dataLoaded) {
      loadDataSummary();
    }
  }, [activeTab]);

  const loadDataSummary = async () => {
    try {
      const [hospitalsRes, doctorsRes, usersRes, deptsRes] = await Promise.all([
        hospitalAPI.getAll(),
        userAPI.getDoctors(),
        userAPI.getAll(),
        departmentAPI.getByHospital('all'),
      ]);

      setAllData({
        hospitals: hospitalsRes.data.data.hospitals || [],
        departments: deptsRes.data.data.departments || Object.values(departments).flat(),
        doctors: doctorsRes.data.data.doctors || [],
        users: usersRes.data.data.users || [],
      });
      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading data summary:', error);
      // Fallback to store data
      setAllData({
        hospitals: [],
        departments: Object.values(departments).flat(),
        doctors: [],
        users: [],
      });
    }
  };

  const handleSaveGeneral = () => {
    localStorage.setItem('queuemed_settings', JSON.stringify(getSettings()));
    toast.success('General settings saved!');
  };

  const handleSaveAppearance = () => {
    applyDarkMode(settings.appearance.darkMode);
    localStorage.setItem('queuemed_settings', JSON.stringify(getSettings()));
    toast.success('Appearance settings saved!');
  };

  const handleSaveQueue = () => {
    localStorage.setItem('queuemed_settings', JSON.stringify(getSettings()));
    toast.success('Queue configuration saved!');
  };

  const handleSaveSecurity = () => {
    if (passwordData.newPassword && passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    // In a real app, you would validate current password and update on server
    localStorage.setItem('queuemed_settings', JSON.stringify(getSettings()));
    toast.success('Security settings saved!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleExportData = async () => {
    try {
      const [hospitalsRes, doctorsRes, usersRes] = await Promise.all([
        hospitalAPI.getAll(),
        userAPI.getDoctors(),
        userAPI.getAll(),
      ]);

      const hospitals = hospitalsRes.data.data.hospitals;
      const doctors = doctorsRes.data.data.doctors;
      const users = usersRes.data.data.users;
      const depts = Object.values(departments).flat();

      const exportData = {
        hospitals,
        departments: depts,
        doctors,
        users,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `queuemed-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data to defaults? This cannot be undone.')) {
      localStorage.clear();
      toast.success('Data reset successfully. Reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Shield className="w-5 h-5" /> },
    { id: 'appearance', label: 'Appearance', icon: <Moon className="w-5 h-5" /> },
    { id: 'queue', label: 'Queue Config', icon: <Clock className="w-5 h-5" /> },
    { id: 'security', label: 'Security', icon: <Bell className="w-5 h-5" /> },
    { id: 'data', label: 'Data', icon: <Database className="w-5 h-5" /> },
  ];

  const gradientPresets = [
    'from-[#0EA5E9] to-[#14B8A6]',
    'from-[#6366F1] to-[#8B5CF6]',
    'from-[#EC4899] to-[#F59E0B]',
    'from-[#10B981] to-[#0EA5E9]',
    'from-[#EF4444] to-[#F59E0B]',
    'from-[#8B5CF6] to-[#EC4899]',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50"
    >
      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Configure your QueueMed system</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary-600 to-secondary-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* General Tab */}
          {activeTab === 'general' && (
            <motion.div
              key="general"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card glass>
                <h2 className="text-xl font-bold text-gray-900 mb-6">General Settings</h2>
                <div className="space-y-4">
                  <Input
                    id="systemName"
                    type="text"
                    label="System Name"
                    value={settings.general.systemName}
                    onChange={(e) => updateSettings('general', { systemName: e.target.value })}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Language
                      </label>
                      <CustomSelect
                        options={[
                          { value: 'English', label: 'English' },
                          { value: 'Spanish', label: 'Spanish' },
                          { value: 'French', label: 'French' },
                          { value: 'German', label: 'German' },
                          { value: 'Chinese', label: 'Chinese' },
                          { value: 'Hindi', label: 'Hindi' },
                        ]}
                        value={settings.general.defaultLanguage}
                        onChange={(value) => updateSettings('general', { defaultLanguage: value })}
                        placeholder="Select language"
                      />
                    </div>

                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <CustomSelect
                        options={[
                          { value: 'UTC', label: 'UTC' },
                          { value: 'America/New_York', label: 'Eastern Time' },
                          { value: 'America/Chicago', label: 'Central Time' },
                          { value: 'America/Denver', label: 'Mountain Time' },
                          { value: 'America/Los_Angeles', label: 'Pacific Time' },
                          { value: 'Europe/London', label: 'London' },
                          { value: 'Asia/Kolkata', label: 'India' },
                        ]}
                        value={settings.general.timezone}
                        onChange={(value) => updateSettings('general', { timezone: value })}
                        placeholder="Select timezone"
                      />
                    </div>
                  </div>

                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Format
                    </label>
                    <CustomSelect
                      options={[
                        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                      ]}
                      value={settings.general.dateFormat}
                      onChange={(value) => updateSettings('general', { dateFormat: value })}
                      placeholder="Select date format"
                    />
                  </div>

                  <Button onClick={handleSaveGeneral} className="w-full">
                    <Save className="w-5 h-5" />
                    Save Changes
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <motion.div
              key="appearance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card glass>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Appearance Settings</h2>
                <div className="space-y-6">
                  {/* Dark Mode Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      {settings.appearance.darkMode ? (
                        <Moon className="w-6 h-6 text-primary-600" />
                      ) : (
                        <Sun className="w-6 h-6 text-orange-500" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">Dark Mode</p>
                        <p className="text-sm text-gray-500">Toggle dark theme</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSettings('appearance', { darkMode: !settings.appearance.darkMode })}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        settings.appearance.darkMode ? 'bg-primary-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                          settings.appearance.darkMode ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Primary Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Primary Color
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {gradientPresets.map((gradient, index) => (
                        <button
                          key={index}
                          onClick={() => updateSettings('appearance', { primaryColor: gradient.split(' ')[1].replace('to-[', '').replace(']', '') })}
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} transition-transform hover:scale-110 ${
                            settings.appearance.primaryColor === gradient.split(' ')[1].replace('to-[', '').replace(']', '')
                              ? 'ring-4 ring-primary-300'
                              : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Sidebar Style */}
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sidebar Style
                    </label>
                    <CustomSelect
                      options={[
                        { value: 'Full', label: 'Full' },
                        { value: 'Compact', label: 'Compact' },
                        { value: 'Icons Only', label: 'Icons Only' },
                      ]}
                      value={settings.appearance.sidebarStyle}
                      onChange={(value) => updateSettings('appearance', { sidebarStyle: value as 'Full' | 'Compact' | 'Icons Only' })}
                      placeholder="Select sidebar style"
                    />
                  </div>

                  {/* Animations Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center">
                        <motion.div
                          className="w-3 h-3 bg-primary-600 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Animations</p>
                        <p className="text-sm text-gray-500">Enable UI animations</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSettings('appearance', { animations: !settings.appearance.animations })}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        settings.appearance.animations ? 'bg-primary-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                          settings.appearance.animations ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  <Button onClick={handleSaveAppearance} className="w-full">
                    <Save className="w-5 h-5" />
                    Save Changes
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Queue Config Tab */}
          {activeTab === 'queue' && (
            <motion.div
              key="queue"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card glass>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Queue Configuration</h2>
                <div className="space-y-4">
                  <Input
                    id="tokenPrefix"
                    type="text"
                    label="Token Prefix"
                    value={settings.queue.tokenPrefix}
                    onChange={(e) => updateSettings('queue', { tokenPrefix: e.target.value })}
                    placeholder="e.g., TKN"
                  />

                  <Input
                    id="maxTokensPerDay"
                    type="number"
                    label="Max Tokens Per Day"
                    value={settings.queue.maxTokensPerDay}
                    onChange={(e) => updateSettings('queue', { maxTokensPerDay: parseInt(e.target.value) || 0 })}
                  />

                  <Input
                    id="tokenResetTime"
                    type="time"
                    label="Token Reset Time"
                    value={settings.queue.tokenResetTime}
                    onChange={(e) => updateSettings('queue', { tokenResetTime: e.target.value })}
                  />

                  <Input
                    id="defaultAppointmentDuration"
                    type="number"
                    label="Default Appointment Duration (minutes)"
                    value={settings.queue.defaultAppointmentDuration}
                    onChange={(e) => updateSettings('queue', { defaultAppointmentDuration: parseInt(e.target.value) || 15 })}
                  />

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">
                        <Users className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Allow Walk-ins</p>
                        <p className="text-sm text-gray-500">Accept walk-in patients</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSettings('queue', { allowWalkIns: !settings.queue.allowWalkIns })}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        settings.queue.allowWalkIns ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                          settings.queue.allowWalkIns ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  <Button onClick={handleSaveQueue} className="w-full">
                    <Save className="w-5 h-5" />
                    Save Changes
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card glass>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <h3 className="font-medium text-gray-900 mb-3">Change Password</h3>
                    <div className="space-y-3">
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword.current ? 'text' : 'password'}
                          label="Current Password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                          className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 text-sm"
                        >
                          {showPassword.current ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword.new ? 'text' : 'password'}
                          label="New Password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                          className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 text-sm"
                        >
                          {showPassword.new ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPassword.confirm ? 'text' : 'password'}
                          label="Confirm New Password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                          className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 text-sm"
                        >
                          {showPassword.confirm ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Timeout
                    </label>
                    <CustomSelect
                      options={[
                        { value: '15', label: '15 minutes' },
                        { value: '30', label: '30 minutes' },
                        { value: '60', label: '60 minutes' },
                        { value: '120', label: '120 minutes' },
                      ]}
                      value={settings.security.sessionTimeout.toString()}
                      onChange={(value) => updateSettings('security', { sessionTimeout: parseInt(value) })}
                      placeholder="Select session timeout"
                    />
                  </div>

                  <Button onClick={handleSaveSecurity} className="w-full">
                    <Save className="w-5 h-5" />
                    Save Changes
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card glass>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Data Management</h2>
                <div className="space-y-4">
                  <div className="p-6 bg-green-50 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Download className="w-6 h-6 text-green-600" />
                      <h3 className="font-medium text-gray-900">Export All Data</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Download a complete backup of all hospitals, departments, doctors, and users.
                    </p>
                    <Button onClick={handleExportData} className="bg-green-600 hover:bg-green-700">
                      <Download className="w-5 h-5" />
                      Export JSON
                    </Button>
                  </div>

                  <div className="p-6 bg-red-50 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <RotateCcw className="w-6 h-6 text-red-600" />
                      <h3 className="font-medium text-gray-900">Reset to Default Data</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Clear all data and reset the system to its initial state. This action cannot be undone.
                    </p>
                    <Button onClick={handleResetData} variant="danger">
                      <RotateCcw className="w-5 h-5" />
                      Reset All Data
                    </Button>
                  </div>

                  {/* Data Summary */}
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-medium text-gray-900 mb-3">Current Data Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <span className="text-xs text-gray-500">Hospitals</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{allData.hospitals.length}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-purple-600" />
                          <span className="text-xs text-gray-500">Departments</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{allData.departments.length}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Stethoscope className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-gray-500">Doctors</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{allData.doctors.length}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-orange-600" />
                          <span className="text-xs text-gray-500">Users</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{allData.users.length}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Notifications:</span>
                        <span className="font-medium">{notifications.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Audit Logs:</span>
                        <span className="font-medium">{(() => {
                          try {
                            return JSON.parse(localStorage.getItem('queuemed_audit_log') || '[]').length;
                          } catch {
                            return 0;
                          }
                        })()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
