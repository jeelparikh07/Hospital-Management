'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Edit,
  Trash2,
  X,
  Search,
  MoreVertical,
  Eye,
  UserCheck,
  UserX,
  Shield,
  Stethoscope,
  Heart,
  Clipboard,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CustomSelect from '@/components/ui/CustomSelect';
import { userAPI, hospitalAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useNotificationStore, createNotification } from '@/store/notificationStore';
import { logAudit } from '@/utils/auditLogger';
import { use3DTilt } from '@/hooks/use3DTilt';

// User Card Component
function UserCard({
  user,
  index,
  onEdit,
  onDelete,
  onToggleStatus,
  onView,
}: {
  user: any;
  index: number;
  onEdit: (user: any) => void;
  onDelete: (id: string, name: string) => void;
  onToggleStatus: (id: string, isActive: boolean, name: string) => void;
  onView: (id: string) => void;
}) {
  const tiltProps = use3DTilt();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'doctor':
        return <Stethoscope className="w-4 h-4" />;
      case 'patient':
        return <Heart className="w-4 h-4" />;
      case 'receptionist':
        return <Clipboard className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'doctor':
        return 'bg-blue-100 text-blue-700';
      case 'patient':
        return 'bg-green-100 text-green-700';
      case 'receptionist':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  return (
    <motion.div
      key={user._id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card
        glass
        className="relative overflow-hidden group"
        {...tiltProps}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center text-white text-lg font-bold">
                {user.name?.charAt(0) || 'U'}
              </div>
              {/* Status Indicator */}
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  user.isActive ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-xs text-gray-400">{user.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${getRoleColor(
                user.role
              )}`}
            >
              {getRoleIcon(user.role)}
              <span className="capitalize">{user.role}</span>
            </span>
            
            {/* Three-dot menu */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setActiveMenu(activeMenu === user._id ? null : user._id);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative z-30"
              >
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </button>

              <AnimatePresence>
                {activeMenu === user._id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50"
                    style={{ zIndex: 9999 }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(user);
                        setActiveMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus(user._id, user.isActive, user.name);
                        setActiveMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      {user.isActive ? (
                        <>
                          <UserX className="w-4 h-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4" />
                          Activate
                        </>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(user._id);
                        setActiveMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Profile
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(user._id, user.name);
                        setActiveMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'Admin' | 'Doctor' | 'Patient' | 'Receptionist';
  status: 'Active' | 'Inactive';
  linkedDoctorId?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  assignedHospitalId?: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [showPassword, setShowPassword] = useState(false);

  const { addNotification } = useNotificationStore();

  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'Patient',
    status: 'Active',
    linkedDoctorId: '',
    dateOfBirth: '',
    bloodGroup: '',
    emergencyContact: '',
    assignedHospitalId: '',
  });

  useEffect(() => {
    loadUsers();
    loadDoctors();
    loadHospitals();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAll();
      setUsers(response.data.data.users);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await userAPI.getDoctors();
      setDoctors(response.data.data.doctors);
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const loadHospitals = async () => {
    try {
      const response = await hospitalAPI.getAll();
      setHospitals(response.data.data.hospitals);
    } catch (error) {
      console.error('Error loading hospitals:', error);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone,
      role: (user.role as 'Admin' | 'Doctor' | 'Patient' | 'Receptionist') || 'Patient',
      status: user.isActive ? 'Active' : 'Inactive',
      linkedDoctorId: user.linkedDoctorId || '',
      dateOfBirth: user.dateOfBirth || '',
      bloodGroup: user.bloodGroup || '',
      emergencyContact: user.emergencyContact || '',
      assignedHospitalId: user.assignedHospitalId || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: string, name: string) => {
    setUserToDelete({ id, name });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await userAPI.delete(userToDelete.id);
      toast.success('User deleted successfully');
      logAudit('DELETE', 'User', userToDelete.name, `User ${userToDelete.name} was deleted`);
      createNotification('DELETE', 'User', userToDelete.name);
      loadUsers();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role.toLowerCase(),
        isActive: formData.status === 'Active',
      };

      if (formData.password && !editingUser) {
        submitData.password = formData.password;
      }

      // Role-specific fields
      if (formData.role === 'Doctor' && formData.linkedDoctorId) {
        submitData.linkedDoctorId = formData.linkedDoctorId;
      }

      if (formData.role === 'Patient') {
        if (formData.dateOfBirth) submitData.dateOfBirth = formData.dateOfBirth;
        if (formData.bloodGroup) submitData.bloodGroup = formData.bloodGroup;
        if (formData.emergencyContact) submitData.emergencyContact = formData.emergencyContact;
      }

      if (formData.role === 'Receptionist' && formData.assignedHospitalId) {
        submitData.assignedHospitalId = formData.assignedHospitalId;
      }

      if (editingUser) {
        await userAPI.update(editingUser._id, submitData);
        toast.success('User updated successfully');
        logAudit('UPDATE', 'User', submitData.name, `User role: ${submitData.role}`);
      } else {
        await userAPI.create(submitData);
        toast.success('User created successfully');
        logAudit('CREATE', 'User', submitData.name, `User created with role: ${submitData.role}`);
        createNotification('CREATE', 'User', submitData.name);
      }
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'Patient',
      status: 'Active',
      linkedDoctorId: '',
      dateOfBirth: '',
      bloodGroup: '',
      emergencyContact: '',
      assignedHospitalId: '',
    });
    setShowPassword(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    resetForm();
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean, userName: string) => {
    try {
      await userAPI.update(userId, { isActive: !currentStatus });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      logAudit('UPDATE', 'User', userName, `User status changed to ${!currentStatus ? 'Active' : 'Inactive'}`);
      loadUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

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
            <Button
              onClick={() => {
                setEditingUser(null);
                resetForm();
                setShowModal(true);
              }}
            >
              <UserPlus className="w-5 h-5" />
              Add User
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Users</h1>
          <p className="text-gray-600">Manage all users in the system</p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 placeholder-gray-400"
              style={{ color: '#111827' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="w-full sm:w-48">
            <CustomSelect
              options={[
                { value: 'All', label: 'All Roles' },
                { value: 'Admin', label: 'Admin' },
                { value: 'Doctor', label: 'Doctor' },
                { value: 'Patient', label: 'Patient' },
                { value: 'Receptionist', label: 'Receptionist' },
              ]}
              value={roleFilter}
              onChange={(value) => setRoleFilter(value)}
              placeholder="Filter by role"
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <Card glass hover={false}>
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery || roleFilter !== 'All' ? 'No users found' : 'No users yet'}
              </h3>
              <p className="text-gray-500">
                {searchQuery || roleFilter !== 'All'
                  ? 'Try adjusting your search or filters'
                  : 'Users will appear here when they register'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user, index) => (
              <UserCard
                key={user._id}
                user={user}
                index={index}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onView={(id) => router.push(`/admin/users/${id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit User Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 280, damping: 25 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Card glass hover={false} className="w-full max-w-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </h2>
                  <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      id="name"
                      type="text"
                      label="Full Name"
                      placeholder="e.g., John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />

                    <Input
                      id="email"
                      type="email"
                      label="Email"
                      placeholder="e.g., user@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  {!editingUser && (
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        label="Password"
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 text-sm"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  )}

                  <Input
                    id="phone"
                    type="tel"
                    label="Phone"
                    placeholder="e.g., +1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <CustomSelect
                        options={[
                          { value: 'Admin', label: 'Admin' },
                          { value: 'Doctor', label: 'Doctor' },
                          { value: 'Patient', label: 'Patient' },
                          { value: 'Receptionist', label: 'Receptionist' },
                        ]}
                        value={formData.role}
                        onChange={(value) => setFormData({ ...formData, role: value as 'Admin' | 'Doctor' | 'Patient' | 'Receptionist' })}
                        placeholder="Select role"
                        required
                      />
                    </div>

                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <CustomSelect
                        options={[
                          { value: 'Active', label: 'Active' },
                          { value: 'Inactive', label: 'Inactive' },
                        ]}
                        value={formData.status}
                        onChange={(value) => setFormData({ ...formData, status: value as 'Active' | 'Inactive' })}
                        placeholder="Select status"
                        required
                      />
                    </div>
                  </div>

                  {/* Role-specific fields */}
                  {formData.role === 'Doctor' && (
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Link to Doctor Profile
                      </label>
                      <CustomSelect
                        options={[
                          { value: '', label: 'Select doctor profile...' },
                          ...doctors.map((doctor) => ({ value: doctor._id, label: `Dr. ${doctor.name} - ${doctor.specialization}` })),
                        ]}
                        value={formData.linkedDoctorId || ''}
                        onChange={(value) => setFormData({ ...formData, linkedDoctorId: value })}
                        placeholder="Select doctor profile..."
                      />
                    </div>
                  )}

                  {formData.role === 'Patient' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          id="dateOfBirth"
                          type="date"
                          label="Date of Birth"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        />

                        <Input
                          id="bloodGroup"
                          type="text"
                          label="Blood Group"
                          placeholder="e.g., A+"
                          value={formData.bloodGroup}
                          onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                        />
                      </div>
                      <Input
                        id="emergencyContact"
                        type="tel"
                        label="Emergency Contact"
                        placeholder="e.g., +1 (555) 987-6543"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      />
                    </>
                  )}

                  {formData.role === 'Receptionist' && (
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assigned Hospital
                      </label>
                      <CustomSelect
                        options={[
                          { value: '', label: 'Select hospital...' },
                          ...hospitals.map((hospital) => ({ value: hospital._id, label: hospital.name })),
                        ]}
                        value={formData.assignedHospitalId || ''}
                        onChange={(value) => setFormData({ ...formData, assignedHospitalId: value })}
                        placeholder="Select hospital..."
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="ghost" className="flex-1" onClick={handleCloseModal}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      {editingUser ? 'Update User' : 'Create User'}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && userToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowDeleteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 280, damping: 25 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Card glass hover={false} className="w-full max-w-md">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Delete User</h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete <span className="font-semibold text-gray-900">{userToDelete.name}</span>?
                    <br />
                    <span className="text-sm text-gray-500">This action cannot be undone.</span>
                  </p>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1"
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      className="flex-1"
                      onClick={confirmDelete}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
