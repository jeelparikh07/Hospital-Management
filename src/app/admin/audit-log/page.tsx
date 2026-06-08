'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  FileText,
  Shield,
  Building2,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CustomSelect from '@/components/ui/CustomSelect';
import { getAuditLogs, deleteAuditLog, exportAuditLogs } from '@/utils/auditLogger';
import { AuditEntry } from '@/types';

type ActionFilter = 'all' | 'CREATE' | 'UPDATE' | 'DELETE';
type EntityFilter = 'all' | 'Hospital' | 'Doctor' | 'User' | 'Department';

const ITEMS_PER_PAGE = 20;

export default function AdminAuditLogPage() {
  const router = useRouter();
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [logToDelete, setLogToDelete] = useState<AuditEntry | null>(null);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = () => {
    const logs = getAuditLogs();
    setAuditLogs(logs);
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || log.entityType === entityFilter;
    return matchesSearch && matchesAction && matchesEntity;
  });

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-700';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-700';
      case 'DELETE':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'Hospital':
        return <Building2 className="w-4 h-4" />;
      case 'Doctor':
        return <Stethoscope className="w-4 h-4" />;
      case 'User':
        return <Users className="w-4 h-4" />;
      case 'Department':
        return <FileText className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = (log: AuditEntry) => {
    setLogToDelete(log);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (logToDelete) {
      deleteAuditLog(logToDelete.id);
      loadAuditLogs();
      setShowDeleteModal(false);
      setLogToDelete(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedRow(null);
  };

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
            <Button onClick={exportAuditLogs}>
              <Download className="w-5 h-5" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Log</h1>
          <p className="text-gray-600">Track all system activities and changes</p>
        </div>

        {/* Filters */}
        <Card glass className="mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="w-full">
              <CustomSelect
                options={[
                  { value: 'all', label: 'All Actions' },
                  { value: 'CREATE', label: 'Create' },
                  { value: 'UPDATE', label: 'Update' },
                  { value: 'DELETE', label: 'Delete' },
                ]}
                value={actionFilter}
                onChange={(value) => {
                  setActionFilter(value as ActionFilter);
                  setCurrentPage(1);
                }}
                placeholder="Filter by action"
              />
            </div>
            <div className="w-full">
              <CustomSelect
                options={[
                  { value: 'all', label: 'All Entities' },
                  { value: 'Hospital', label: 'Hospital' },
                  { value: 'Doctor', label: 'Doctor' },
                  { value: 'User', label: 'User' },
                  { value: 'Department', label: 'Department' },
                ]}
                value={entityFilter}
                onChange={(value) => {
                  setEntityFilter(value as EntityFilter);
                  setCurrentPage(1);
                }}
                placeholder="Filter by entity"
              />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {paginatedLogs.length} of {filteredLogs.length} entries
            </p>
            {filteredLogs.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => {
                setSearchQuery('');
                setActionFilter('all');
                setEntityFilter('all');
                setCurrentPage(1);
              }}>
                <X className="w-4 h-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </Card>

        {/* Audit Log Table */}
        <Card glass>
          {paginatedLogs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No audit logs found</h3>
              <p className="text-gray-500">
                {auditLogs.length === 0
                  ? 'No activities have been recorded yet'
                  : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Timestamp</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Action</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Entity</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Details</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log, index) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          {getEntityIcon(log.entityType)}
                          <span>{log.entityType}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {log.entityName}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">
                        {log.details}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                          >
                            {expandedRow === log.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(log)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Expanded Row Details */}
          <AnimatePresence>
            {paginatedLogs.map((log) =>
              expandedRow === log.id ? (
                <motion.div
                  key={`expanded-${log.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-gray-50 border-b border-gray-100">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">Full Timestamp</p>
                        <p className="font-medium text-gray-900">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Performed By</p>
                        <p className="font-medium text-gray-900">{log.performedBy}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-gray-500 mb-1">Full Details</p>
                        <p className="font-medium text-gray-900">{log.details}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null
            )}
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && logToDelete && (
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
            >
              <Card glass hover={false} className="w-full max-w-md">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Log Entry</h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete this audit log entry?
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
