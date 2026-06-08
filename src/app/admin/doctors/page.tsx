'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Stethoscope,
  UserPlus,
  Edit,
  Trash2,
  X,
  Building2,
  MapPin,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Clock,
  FileText,
  Eye,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CustomSelect from '@/components/ui/CustomSelect';
import { userAPI, hospitalAPI, departmentAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useNotificationStore, createNotification } from '@/store/notificationStore';
import { logAudit } from '@/utils/auditLogger';
import { use3DTilt } from '@/hooks/use3DTilt';
import { SPECIALIZATION_CATEGORIES } from '@/types';

// Doctor Card Component
function DoctorCard({
  doctor,
  index,
  hospitals,
  departments,
  onEdit,
  onDelete,
  onView,
}: {
  doctor: any;
  index: number;
  hospitals: any[];
  departments: any[];
  onEdit: (doctor: any) => void;
  onDelete: (id: string, name: string) => void;
  onView: (id: string) => void;
}) {
  const tiltProps = use3DTilt();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700';
      case 'Inactive':
        return 'bg-gray-100 text-gray-700';
      case 'On Leave':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  return (
    <motion.div
      key={doctor._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        glass
        className="relative overflow-hidden group"
        {...tiltProps}
      >
        {/* Hover Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(doctor)}
            className="bg-white/90 hover:bg-white shadow-sm"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(doctor._id, doctor.name)}
            className="bg-white/90 hover:bg-white shadow-sm"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(doctor._id)}
            className="bg-white/90 hover:bg-white shadow-sm"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {doctor.avatar ? (
              <img src={doctor.avatar} alt={doctor.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              doctor.name?.charAt(0) || 'D'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate">Dr. {doctor.name}</h3>
            <p className="text-sm text-gray-500 truncate">{doctor.specialization}</p>
            <p className="text-xs text-gray-400 truncate">{doctor.email}</p>

            {/* Hospital & Department */}
            <div className="mt-3 space-y-1">
              {doctor.hospitalId ? (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Building2 className="w-3 h-3 text-gray-400" />
                  <span className="truncate">
                    {hospitals.find((h) => h._id === doctor.hospitalId)?.name || 'Not Assigned'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Building2 className="w-3 h-3" />
                  <span>Not Assigned</span>
                </div>
              )}
              {doctor.departmentId ? (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="truncate">
                    {departments.find((d) => d._id === doctor.departmentId)?.name || 'Not Assigned'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span>Not Assigned</span>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="mt-3">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(doctor.status || 'Active')}`}>
                {doctor.status || 'Active'}
              </span>
            </div>

            {/* Additional Info */}
            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-500">
              {doctor.yearsOfExperience && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{doctor.yearsOfExperience} yrs exp</span>
                </div>
              )}
              {doctor.consultationFee && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  <span>${doctor.consultationFee}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

interface DoctorFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  specialization: string;
  hospitalId: string;
  departmentId: string;
  licenseNumber: string;
  yearsOfExperience: number;
  consultationFee: number;
  availableDays: string[];
  workingHoursStart: string;
  workingHoursEnd: string;
  bio: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  avatar?: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdminDoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);
  const [selectedHospital, setSelectedHospital] = useState<string>('');
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const { addNotification } = useNotificationStore();

  const [formData, setFormData] = useState<DoctorFormData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: '',
    hospitalId: '',
    departmentId: '',
    licenseNumber: '',
    yearsOfExperience: 0,
    consultationFee: 0,
    availableDays: [],
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    bio: '',
    status: 'Active',
    avatar: '',
  });

  useEffect(() => {
    loadDoctors();
    loadHospitals();
  }, []);

  useEffect(() => {
    if (selectedHospital) {
      loadDepartments(selectedHospital);
    } else {
      setDepartments([]);
    }
  }, [selectedHospital]);

  const loadDoctors = async () => {
    try {
      const response = await userAPI.getDoctors();
      setDoctors(response.data.data.doctors);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setIsLoading(false);
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

  const loadDepartments = async (hospitalId: string) => {
    try {
      const response = await departmentAPI.getByHospital(hospitalId);
      setDepartments(response.data.data.departments || []);
    } catch (error) {
      console.error('Error loading departments:', error);
      setDepartments([]);
    }
  };

  const handleEdit = (doctor: any) => {
    setEditingDoctor(doctor);
    setSelectedHospital(doctor.hospitalId || '');
    setFormData({
      name: doctor.name,
      email: doctor.email,
      password: '',
      phone: doctor.phone,
      specialization: doctor.specialization,
      hospitalId: doctor.hospitalId || '',
      departmentId: doctor.departmentId || '',
      licenseNumber: doctor.licenseNumber || '',
      yearsOfExperience: doctor.yearsOfExperience || 0,
      consultationFee: doctor.consultationFee || 0,
      availableDays: doctor.availableDays || [],
      workingHoursStart: doctor.workingHours?.start || '09:00',
      workingHoursEnd: doctor.workingHours?.end || '17:00',
      bio: doctor.bio || '',
      status: doctor.status || 'Active',
      avatar: doctor.avatar || '',
    });
    setAvatarPreview(doctor.avatar || '');
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;

    try {
      await userAPI.delete(id);
      toast.success('Doctor deleted successfully');
      logAudit('DELETE', 'Doctor', name, `Doctor ${name} was deleted`);
      createNotification('DELETE', 'Doctor', name);
      loadDoctors();
    } catch (error) {
      toast.error('Failed to delete doctor');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        specialization: formData.specialization,
        hospitalId: formData.hospitalId,
        departmentId: formData.departmentId,
        licenseNumber: formData.licenseNumber,
        yearsOfExperience: formData.yearsOfExperience,
        consultationFee: formData.consultationFee,
        availableDays: formData.availableDays,
        workingHours: {
          start: formData.workingHoursStart,
          end: formData.workingHoursEnd,
        },
        bio: formData.bio,
        status: formData.status,
        role: 'doctor' as const,
      };

      if (formData.password && !editingDoctor) {
        submitData.password = formData.password;
      }

      if (formData.avatar) {
        submitData.avatar = formData.avatar;
      }

      if (editingDoctor) {
        await userAPI.update(editingDoctor._id, submitData);
        toast.success('Doctor updated successfully');
        logAudit('UPDATE', 'Doctor', submitData.name, `Doctor details updated`);
      } else {
        await userAPI.create(submitData);
        toast.success('Doctor created successfully');
        logAudit('CREATE', 'Doctor', submitData.name, `New doctor created with specialization: ${submitData.specialization}`);
        createNotification('CREATE', 'Doctor', submitData.name);
      }
      setShowModal(false);
      setEditingDoctor(null);
      resetForm();
      loadDoctors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save doctor');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      specialization: '',
      hospitalId: '',
      departmentId: '',
      licenseNumber: '',
      yearsOfExperience: 0,
      consultationFee: 0,
      availableDays: [],
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00',
      bio: '',
      status: 'Active',
      avatar: '',
    });
    setSelectedHospital('');
    setDepartments([]);
    setAvatarPreview('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDoctor(null);
    resetForm();
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        setFormData((prev) => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading doctors...</p>
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
                setEditingDoctor(null);
                resetForm();
                setShowModal(true);
              }}
            >
              <UserPlus className="w-5 h-5" />
              Add Doctor
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctors</h1>
          <p className="text-gray-600">Manage doctors and their specializations</p>
        </div>

        {doctors.length === 0 ? (
          <Card glass hover={false}>
            <div className="text-center py-12">
              <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No doctors yet</h3>
              <p className="text-gray-500">Add doctors to manage their queues</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor, index) => (
              <DoctorCard
                key={doctor._id}
                doctor={doctor}
                index={index}
                hospitals={hospitals}
                departments={departments}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={(id) => router.push(`/admin/doctors/${id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Doctor Modal */}
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
              <Card glass hover={false} className="w-full max-w-2xl my-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
                  </h2>
                  <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  {/* Profile Photo Upload */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        formData.name.charAt(0) || 'D'
                      )}
                    </div>
                    <div>
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl cursor-pointer hover:bg-primary-700 transition-colors">
                        <Upload className="w-4 h-4" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      id="name"
                      type="text"
                      label="Full Name"
                      placeholder="e.g., John Smith"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />

                    <Input
                      id="email"
                      type="email"
                      label="Email"
                      placeholder="e.g., doctor@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  {!editingDoctor && (
                    <Input
                      id="password"
                      type="password"
                      label="Password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
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
                        Specialization
                      </label>
                      <CustomSelect
                        options={[
                          { value: '', label: 'Select specialization...' },
                          ...SPECIALIZATION_CATEGORIES.map((spec) => ({ value: spec, label: spec })),
                        ]}
                        value={formData.specialization}
                        onChange={(value) => setFormData({ ...formData, specialization: value })}
                        placeholder="Select specialization..."
                        required
                      />
                    </div>

                    <Input
                      id="licenseNumber"
                      type="text"
                      label="License Number"
                      placeholder="e.g., MD12345"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      id="yearsOfExperience"
                      type="number"
                      label="Years of Experience"
                      placeholder="e.g., 10"
                      value={formData.yearsOfExperience}
                      onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                    />

                    <Input
                      id="consultationFee"
                      type="number"
                      label="Consultation Fee ($)"
                      placeholder="e.g., 100"
                      value={formData.consultationFee}
                      onChange={(e) => setFormData({ ...formData, consultationFee: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  {/* Hospital & Department Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign Hospital *
                      </label>
                      <CustomSelect
                        options={[
                          { value: '', label: 'Select hospital...' },
                          ...hospitals.map((hospital) => ({ value: hospital._id, label: hospital.name })),
                        ]}
                        value={selectedHospital}
                        onChange={(value) => {
                          setSelectedHospital(value);
                          setFormData({ ...formData, hospitalId: value, departmentId: '' });
                        }}
                        placeholder="Select hospital..."
                        required
                      />
                    </div>

                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign Department *
                      </label>
                      <CustomSelect
                        options={[
                          { value: '', label: 'Select department...' },
                          ...departments.map((dept) => ({ value: dept._id, label: dept.name })),
                        ]}
                        value={formData.departmentId}
                        onChange={(value) => setFormData({ ...formData, departmentId: value })}
                        placeholder="Select department..."
                        required
                        disabled={!selectedHospital}
                      />
                    </div>
                  </div>

                  {/* Available Days */}
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Days
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            formData.availableDays.includes(day)
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      id="workingHoursStart"
                      type="time"
                      label="Working Hours Start"
                      value={formData.workingHoursStart}
                      onChange={(e) => setFormData({ ...formData, workingHoursStart: e.target.value })}
                    />

                    <Input
                      id="workingHoursEnd"
                      type="time"
                      label="Working Hours End"
                      value={formData.workingHoursEnd}
                      onChange={(e) => setFormData({ ...formData, workingHoursEnd: e.target.value })}
                    />
                  </div>

                  {/* Status */}
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <CustomSelect
                      options={[
                        { value: 'Active', label: 'Active' },
                        { value: 'Inactive', label: 'Inactive' },
                        { value: 'On Leave', label: 'On Leave' },
                      ]}
                      value={formData.status}
                      onChange={(value) => setFormData({ ...formData, status: value as 'Active' | 'Inactive' | 'On Leave' })}
                      placeholder="Select status"
                      required
                    />
                  </div>

                  {/* Bio */}
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      rows={3}
                      placeholder="Brief bio about the doctor..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="ghost" className="flex-1" onClick={handleCloseModal}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      {editingDoctor ? 'Update Doctor' : 'Create Doctor'}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
