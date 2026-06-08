'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Building2,
  Edit,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  MapPin,
  Phone,
  Mail,
  Globe,
  BedDouble,
  Clock,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CustomSelect from '@/components/ui/CustomSelect';
import { hospitalAPI, departmentAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useDepartmentStore } from '@/store/departmentStore';
import { useNotificationStore, createNotification } from '@/store/notificationStore';
import { logAudit } from '@/utils/auditLogger';
import { Department, SPECIALIZATION_CATEGORIES } from '@/types';
import { use3DTilt } from '@/hooks/use3DTilt';

// Hospital Card Component
function HospitalCard({ 
  hospital, 
  index, 
  onEdit, 
  onDelete, 
  onAddDepartment,
  onEditDepartment,
  onDeleteDepartment,
  isExpanded,
  onToggleExpand,
  departments,
  deptCount,
  doctors 
}: {
  hospital: any;
  index: number;
  onEdit: (hospital: any) => void;
  onDelete: (id: string, name: string) => void;
  onAddDepartment: (hospitalId: string) => void;
  onEditDepartment: (dept: Department) => void;
  onDeleteDepartment: (hospitalId: string, deptId: string, deptName: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  departments: Department[];
  deptCount: number;
  doctors: any[];
}) {
  const tiltProps = use3DTilt();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        glass
        className="overflow-hidden"
        {...tiltProps}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(hospital)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(hospital._id, hospital.name)}
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{hospital.name}</h3>
        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{hospital.address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{hospital.city}, {hospital.state} {hospital.pincode}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{hospital.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4 text-gray-400" />
            <span>{hospital.email}</span>
          </div>
          {hospital.websiteUrl && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Globe className="w-4 h-4 text-gray-400" />
              <span>{hospital.websiteUrl}</span>
            </div>
          )}
          {hospital.bedCapacity && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BedDouble className="w-4 h-4 text-gray-400" />
              <span>{hospital.bedCapacity} beds</span>
            </div>
          )}
          {hospital.operatingHours && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{hospital.operatingHours.open} - {hospital.operatingHours.close}</span>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{deptCount} departments</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="flex items-center gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>View Departments</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Expandable Department Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card glass className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-gray-900">Departments</h4>
                <Button
                  size="sm"
                  onClick={() => onAddDepartment(hospital._id)}
                >
                  <Plus className="w-4 h-4" />
                  Add Department
                </Button>
              </div>
              {departments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No departments yet. Add the first one!
                </p>
              ) : (
                <div className="space-y-2">
                  {departments.map((dept) => (
                    <div
                      key={dept.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{dept.name}</span>
                          <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                            {dept.specialization}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Stethoscope className="w-3 h-3" />
                            {dept.doctorCount} doctors
                          </span>
                          {dept.floorNumber && (
                            <span>Floor {dept.floorNumber}</span>
                          )}
                          {dept.headDoctorId && (
                            <span>Head: {doctors.find(d => d._id === dept.headDoctorId)?.name || 'N/A'}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditDepartment(dept)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteDepartment(hospital._id, dept.id, dept.name)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface HospitalFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  operatingHoursOpen?: string;
  operatingHoursClose?: string;
  bedCapacity?: number;
  description?: string;
  websiteUrl?: string;
}

interface DepartmentFormData {
  name: string;
  specialization: string;
  floorNumber?: string;
  roomNumbers?: string;
  maxDailyPatients?: number;
  headDoctorId?: string;
  customSpecialization?: string;
}

export default function AdminHospitalsPage() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [editingHospital, setEditingHospital] = useState<any>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [expandedHospital, setExpandedHospital] = useState<string | null>(null);
  const [selectedHospitalForDept, setSelectedHospitalForDept] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  
  const { addDepartment, updateDepartment, deleteDepartment, getDepartments, getDepartmentCount } = useDepartmentStore();
  const { addNotification } = useNotificationStore();

  const [hospitalFormData, setHospitalFormData] = useState<HospitalFormData>({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    operatingHoursOpen: '',
    operatingHoursClose: '',
    bedCapacity: undefined,
    description: '',
    websiteUrl: '',
  });

  const [departmentFormData, setDepartmentFormData] = useState<DepartmentFormData>({
    name: '',
    specialization: '',
    floorNumber: '',
    roomNumbers: '',
    maxDailyPatients: undefined,
    headDoctorId: '',
    customSpecialization: '',
  });

  useEffect(() => {
    loadHospitals();
    loadDoctors();
  }, []);

  const loadHospitals = async () => {
    try {
      const response = await hospitalAPI.getAll();
      setHospitals(response.data.data.hospitals);
    } catch (error) {
      console.error('Error loading hospitals:', error);
      toast.error('Failed to load hospitals');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await fetch('/api/users/doctors');
      const data = await response.json();
      if (data.success) {
        setDoctors(data.data.doctors);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const handleEditHospital = (hospital: any) => {
    setEditingHospital(hospital);
    setHospitalFormData({
      name: hospital.name,
      address: hospital.address,
      city: hospital.city,
      state: hospital.state,
      pincode: hospital.pincode,
      phone: hospital.phone,
      email: hospital.email,
      operatingHoursOpen: hospital.operatingHours?.open || '',
      operatingHoursClose: hospital.operatingHours?.close || '',
      bedCapacity: hospital.bedCapacity,
      description: hospital.description || '',
      websiteUrl: hospital.websiteUrl || '',
    });
    setShowHospitalModal(true);
  };

  const handleDeleteHospital = async (id: string, name: string) => {
    if (!confirm('Are you sure you want to delete this hospital?')) return;

    try {
      await hospitalAPI.delete(id);
      toast.success('Hospital deleted successfully');
      logAudit('DELETE', 'Hospital', name, `Hospital ${name} was deleted`);
      createNotification('DELETE', 'Hospital', name);
      loadHospitals();
    } catch (error) {
      toast.error('Failed to delete hospital');
    }
  };

  const handleHospitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitData = {
        ...hospitalFormData,
        operatingHours: hospitalFormData.operatingHoursOpen && hospitalFormData.operatingHoursClose
          ? { open: hospitalFormData.operatingHoursOpen, close: hospitalFormData.operatingHoursClose }
          : undefined,
      };
      delete submitData.operatingHoursOpen;
      delete submitData.operatingHoursClose;

      if (editingHospital) {
        await hospitalAPI.update(editingHospital._id, submitData);
        toast.success('Hospital updated successfully');
        logAudit('UPDATE', 'Hospital', submitData.name, `Hospital details updated`);
      } else {
        const response = await hospitalAPI.create(submitData);
        toast.success('Hospital created successfully');
        logAudit('CREATE', 'Hospital', submitData.name, `New hospital created with ID: ${response.data.data.hospital._id}`);
        createNotification('CREATE', 'Hospital', submitData.name);
      }
      setShowHospitalModal(false);
      setEditingHospital(null);
      setHospitalFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
        operatingHoursOpen: '',
        operatingHoursClose: '',
        bedCapacity: undefined,
        description: '',
        websiteUrl: '',
      });
      loadHospitals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save hospital');
    }
  };

  const handleAddDepartment = (hospitalId: string) => {
    setSelectedHospitalForDept(hospitalId);
    setEditingDepartment(null);
    setDepartmentFormData({
      name: '',
      specialization: '',
      floorNumber: '',
      roomNumbers: '',
      maxDailyPatients: undefined,
      headDoctorId: '',
      customSpecialization: '',
    });
    setShowDepartmentModal(true);
  };

  const handleEditDepartment = (dept: Department) => {
    setEditingDepartment(dept);
    setSelectedHospitalForDept(dept.hospitalId);
    setDepartmentFormData({
      name: dept.name,
      specialization: dept.specialization,
      floorNumber: dept.floorNumber || '',
      roomNumbers: dept.roomNumbers || '',
      maxDailyPatients: dept.maxDailyPatients,
      headDoctorId: dept.headDoctorId || '',
      customSpecialization: dept.specialization === 'Custom' ? dept.name : '',
    });
    setShowDepartmentModal(true);
  };

  const handleDeleteDepartment = async (hospitalId: string, departmentId: string, departmentName: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;

    try {
      deleteDepartment(hospitalId, departmentId);
      toast.success('Department deleted successfully');
      logAudit('DELETE', 'Department', departmentName, `Department ${departmentName} was deleted`);
      createNotification('DELETE', 'Department', departmentName);
    } catch (error) {
      toast.error('Failed to delete department');
    }
  };

  const handleDepartmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedHospitalForDept) {
      toast.error('No hospital selected');
      return;
    }

    const finalSpecialization = departmentFormData.specialization === 'Custom'
      ? departmentFormData.customSpecialization || 'Custom'
      : departmentFormData.specialization;

    const departmentData: Department = {
      id: editingDepartment?.id || Date.now().toString(),
      hospitalId: selectedHospitalForDept,
      name: departmentFormData.name,
      specialization: finalSpecialization,
      floorNumber: departmentFormData.floorNumber,
      roomNumbers: departmentFormData.roomNumbers,
      maxDailyPatients: departmentFormData.maxDailyPatients,
      headDoctorId: departmentFormData.headDoctorId,
      doctorCount: editingDepartment?.doctorCount || 0,
      createdAt: editingDepartment?.createdAt || new Date().toISOString(),
    };

    try {
      if (editingDepartment) {
        await departmentAPI.update(editingDepartment.id, departmentData);
        updateDepartment(selectedHospitalForDept, editingDepartment.id, departmentData);
        toast.success('Department updated successfully');
        logAudit('UPDATE', 'Department', departmentData.name, `Department details updated`);
      } else {
        const response = await departmentAPI.create({
          name: departmentData.name,
          description: `Department of ${finalSpecialization}`,
          hospitalId: selectedHospitalForDept,
        });
        departmentData.id = response.data.data.department._id;
        addDepartment(selectedHospitalForDept, departmentData);
        toast.success('Department created successfully');
        logAudit('CREATE', 'Department', departmentData.name, `New department created in hospital`);
        createNotification('CREATE', 'Department', departmentData.name);
      }
      setShowDepartmentModal(false);
      setEditingDepartment(null);
      setSelectedHospitalForDept(null);
      setDepartmentFormData({
        name: '',
        specialization: '',
        floorNumber: '',
        roomNumbers: '',
        maxDailyPatients: undefined,
        headDoctorId: '',
        customSpecialization: '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save department');
    }
  };

  const handleCloseHospitalModal = () => {
    setShowHospitalModal(false);
    setEditingHospital(null);
    setHospitalFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      email: '',
      operatingHoursOpen: '',
      operatingHoursClose: '',
      bedCapacity: undefined,
      description: '',
      websiteUrl: '',
    });
  };

  const handleCloseDepartmentModal = () => {
    setShowDepartmentModal(false);
    setEditingDepartment(null);
    setSelectedHospitalForDept(null);
    setDepartmentFormData({
      name: '',
      specialization: '',
      floorNumber: '',
      roomNumbers: '',
      maxDailyPatients: undefined,
      headDoctorId: '',
      customSpecialization: '',
    });
  };

  const toggleExpandHospital = (hospitalId: string) => {
    setExpandedHospital(expandedHospital === hospitalId ? null : hospitalId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading hospitals...</p>
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
                setEditingHospital(null);
                setHospitalFormData({
                  name: '',
                  address: '',
                  city: '',
                  state: '',
                  pincode: '',
                  phone: '',
                  email: '',
                  operatingHoursOpen: '',
                  operatingHoursClose: '',
                  bedCapacity: undefined,
                  description: '',
                  websiteUrl: '',
                });
                setShowHospitalModal(true);
              }}
            >
              <Plus className="w-5 h-5" />
              Add Hospital
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hospitals</h1>
          <p className="text-gray-600">Manage hospitals and their departments</p>
        </div>

        {hospitals.length === 0 ? (
          <Card glass hover={false}>
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hospitals yet</h3>
              <p className="text-gray-500 mb-4">Add your first hospital to get started</p>
              <Button onClick={() => setShowHospitalModal(true)}>
                <Plus className="w-5 h-5" />
                Add Hospital
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.map((hospital, index) => {
              const departments = getDepartments(hospital._id);
              const deptCount = getDepartmentCount(hospital._id);

              return (
                <HospitalCard
                  key={hospital._id}
                  hospital={hospital}
                  index={index}
                  onEdit={handleEditHospital}
                  onDelete={handleDeleteHospital}
                  onAddDepartment={handleAddDepartment}
                  onEditDepartment={handleEditDepartment}
                  onDeleteDepartment={handleDeleteDepartment}
                  isExpanded={expandedHospital === hospital._id}
                  onToggleExpand={() => toggleExpandHospital(hospital._id)}
                  departments={departments}
                  deptCount={deptCount}
                  doctors={doctors}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Add/Edit Hospital Modal */}
      <AnimatePresence>
        {showHospitalModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={handleCloseHospitalModal}
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
                    {editingHospital ? 'Edit Hospital' : 'Add New Hospital'}
                  </h2>
                  <button onClick={handleCloseHospitalModal} className="text-gray-500 hover:text-gray-700">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleHospitalSubmit} className="space-y-4">
                  <Input
                    id="name"
                    type="text"
                    label="Hospital Name"
                    placeholder="e.g., City General Hospital"
                    value={hospitalFormData.name}
                    onChange={(e) => setHospitalFormData({ ...hospitalFormData, name: e.target.value })}
                    required
                  />

                  <Input
                    id="address"
                    type="text"
                    label="Address"
                    placeholder="e.g., 123 Healthcare Avenue"
                    value={hospitalFormData.address}
                    onChange={(e) => setHospitalFormData({ ...hospitalFormData, address: e.target.value })}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      id="city"
                      type="text"
                      label="City"
                      placeholder="e.g., New York"
                      value={hospitalFormData.city}
                      onChange={(e) => setHospitalFormData({ ...hospitalFormData, city: e.target.value })}
                      required
                    />

                    <Input
                      id="state"
                      type="text"
                      label="State"
                      placeholder="e.g., NY"
                      value={hospitalFormData.state}
                      onChange={(e) => setHospitalFormData({ ...hospitalFormData, state: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      id="pincode"
                      type="text"
                      label="Pincode"
                      placeholder="e.g., 10001"
                      value={hospitalFormData.pincode}
                      onChange={(e) => setHospitalFormData({ ...hospitalFormData, pincode: e.target.value })}
                      required
                    />

                    <Input
                      id="phone"
                      type="tel"
                      label="Phone"
                      placeholder="e.g., +1 (555) 123-4567"
                      value={hospitalFormData.phone}
                      onChange={(e) => setHospitalFormData({ ...hospitalFormData, phone: e.target.value })}
                      required
                    />
                  </div>

                  <Input
                    id="email"
                    type="email"
                    label="Email"
                    placeholder="e.g., info@hospital.com"
                    value={hospitalFormData.email}
                    onChange={(e) => setHospitalFormData({ ...hospitalFormData, email: e.target.value })}
                    required
                  />

                  <Input
                    id="websiteUrl"
                    type="url"
                    label="Website URL"
                    placeholder="e.g., https://hospital.com"
                    value={hospitalFormData.websiteUrl}
                    onChange={(e) => setHospitalFormData({ ...hospitalFormData, websiteUrl: e.target.value })}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      id="operatingHoursOpen"
                      type="time"
                      label="Operating Hours Open"
                      value={hospitalFormData.operatingHoursOpen}
                      onChange={(e) => setHospitalFormData({ ...hospitalFormData, operatingHoursOpen: e.target.value })}
                    />

                    <Input
                      id="operatingHoursClose"
                      type="time"
                      label="Operating Hours Close"
                      value={hospitalFormData.operatingHoursClose}
                      onChange={(e) => setHospitalFormData({ ...hospitalFormData, operatingHoursClose: e.target.value })}
                    />
                  </div>

                  <Input
                    id="bedCapacity"
                    type="number"
                    label="Bed Capacity"
                    placeholder="e.g., 200"
                    value={hospitalFormData.bedCapacity}
                    onChange={(e) => setHospitalFormData({ ...hospitalFormData, bedCapacity: parseInt(e.target.value) })}
                  />

                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      rows={3}
                      placeholder="Brief description of the hospital..."
                      value={hospitalFormData.description}
                      onChange={(e) => setHospitalFormData({ ...hospitalFormData, description: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="ghost" className="flex-1" onClick={handleCloseHospitalModal}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" isLoading={isLoading}>
                      {editingHospital ? 'Update Hospital' : 'Create Hospital'}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add/Edit Department Modal */}
      <AnimatePresence>
        {showDepartmentModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={handleCloseDepartmentModal}
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
                    {editingDepartment ? 'Edit Department' : 'Add New Department'}
                  </h2>
                  <button onClick={handleCloseDepartmentModal} className="text-gray-500 hover:text-gray-700">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleDepartmentSubmit} className="space-y-4">
                  <Input
                    id="deptName"
                    type="text"
                    label="Department Name"
                    placeholder="e.g., Cardiology Department"
                    value={departmentFormData.name}
                    onChange={(e) => setDepartmentFormData({ ...departmentFormData, name: e.target.value })}
                    required
                  />

                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialization Category
                    </label>
                    <CustomSelect
                      options={[
                        { value: '', label: 'Select specialization...' },
                        ...SPECIALIZATION_CATEGORIES.map((spec) => ({ value: spec, label: spec })),
                      ]}
                      value={departmentFormData.specialization}
                      onChange={(value) => setDepartmentFormData({ ...departmentFormData, specialization: value })}
                      placeholder="Select specialization..."
                      required
                    />
                  </div>

                  {departmentFormData.specialization === 'Custom' && (
                    <Input
                      id="customSpecialization"
                      type="text"
                      label="Custom Specialization Name"
                      placeholder="Enter custom specialization"
                      value={departmentFormData.customSpecialization}
                      onChange={(e) => setDepartmentFormData({ ...departmentFormData, customSpecialization: e.target.value })}
                      required
                    />
                  )}

                  <Input
                    id="floorNumber"
                    type="text"
                    label="Floor Number"
                    placeholder="e.g., 3rd Floor"
                    value={departmentFormData.floorNumber}
                    onChange={(e) => setDepartmentFormData({ ...departmentFormData, floorNumber: e.target.value })}
                  />

                  <Input
                    id="roomNumbers"
                    type="text"
                    label="Room Numbers"
                    placeholder="e.g., 301-310"
                    value={departmentFormData.roomNumbers}
                    onChange={(e) => setDepartmentFormData({ ...departmentFormData, roomNumbers: e.target.value })}
                  />

                  <Input
                    id="maxDailyPatients"
                    type="number"
                    label="Max Daily Patients"
                    placeholder="e.g., 50"
                    value={departmentFormData.maxDailyPatients}
                    onChange={(e) => setDepartmentFormData({ ...departmentFormData, maxDailyPatients: parseInt(e.target.value) })}
                  />

                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Head Doctor
                    </label>
                    <CustomSelect
                      options={[
                        { value: '', label: 'Select head doctor (optional)' },
                        ...doctors.map((doctor) => ({ value: doctor._id, label: `Dr. ${doctor.name}` })),
                      ]}
                      value={departmentFormData.headDoctorId || ''}
                      onChange={(value) => setDepartmentFormData({ ...departmentFormData, headDoctorId: value })}
                      placeholder="Select head doctor (optional)"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="ghost" className="flex-1" onClick={handleCloseDepartmentModal}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      {editingDepartment ? 'Update Department' : 'Create Department'}
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
