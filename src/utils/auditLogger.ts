import { AuditEntry } from '@/types';

export const logAudit = (
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  entityType: 'Hospital' | 'Doctor' | 'User' | 'Department',
  entityName: string,
  details: string
): AuditEntry => {
  const entry: AuditEntry = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    action,
    entityType,
    entityName,
    details,
    performedBy: 'Admin User',
  };

  try {
    const existing = JSON.parse(
      localStorage.getItem('queuemed_audit_log') || '[]'
    );
    localStorage.setItem(
      'queuemed_audit_log',
      JSON.stringify([entry, ...existing])
    );
  } catch (error) {
    console.error('Failed to save audit log:', error);
  }

  return entry;
};

export const getAuditLogs = (): AuditEntry[] => {
  try {
    return JSON.parse(localStorage.getItem('queuemed_audit_log') || '[]');
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return [];
  }
};

export const deleteAuditLog = (id: string): void => {
  try {
    const existing = JSON.parse(
      localStorage.getItem('queuemed_audit_log') || '[]'
    );
    const filtered = existing.filter((entry: AuditEntry) => entry.id !== id);
    localStorage.setItem('queuemed_audit_log', JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete audit log entry:', error);
  }
};

export const exportAuditLogs = (): void => {
  try {
    const existing = JSON.parse(
      localStorage.getItem('queuemed_audit_log') || '[]'
    );
    
    // Convert to CSV
    const headers = ['Timestamp', 'Action', 'Entity Type', 'Name', 'Details', 'Performed By'];
    const csvRows = [headers.join(',')];
    
    existing.forEach((entry: AuditEntry) => {
      const row = [
        entry.timestamp,
        entry.action,
        entry.entityType,
        `"${entry.entityName.replace(/"/g, '""')}"`,
        `"${entry.details.replace(/"/g, '""')}"`,
        `"${entry.performedBy}"`,
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  } catch (error) {
    console.error('Failed to export audit logs:', error);
  }
};
