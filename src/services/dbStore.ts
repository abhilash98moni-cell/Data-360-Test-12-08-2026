import fs from 'fs';
import path from 'path';
import { getSupabaseServerClient, isSupabaseServerConfigured } from '../lib/supabaseServer.js';

export interface AuditLogEntry {
  id: string;
  event_type: string;
  target_user_email?: string;
  user_name?: string;
  user_email?: string;
  user_role?: string;
  organization?: string;
  action?: string;
  ip_address?: string;
  details: any;
  created_at: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'system_audit_logs.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('Could not create data dir:', e);
  }
}

// Default baseline sample records
const DEFAULT_SAMPLE_GL_RECORDS = [
  {
    id: 'TX-8041',
    originalRow: 2,
    date: '2026-04-03',
    voucherNo: 'TX-8041',
    accountNumber: 'GL-6100',
    accountDescription: 'Professional & Legal Fees',
    description: 'Quarterly compliance audit advisory - Baker & McKenzie LLP',
    narration: 'Legal and compliance retainer payment for Midwest distribution network',
    debit: 48500.00,
    credit: 0.00,
    balance: 48500.00,
    testingClassification: ['3rd Party Disbursement'],
    testingStatus: 'Tested - Pass',
    testingReference: 'REF-3PD-001',
    attributeResults: {
      'Authorized approval signature present': 'Pass',
      'Contract / Engagement agreement verified': 'Pass',
      'Invoice mathematically verified': 'Pass',
      'Proof of payment matched bank statement': 'Pass'
    },
    evidenceFields: {
      'Vendor Invoice': 'INV-2026-9812.pdf',
      'Bank Statement Reference': 'WIRE-9920192',
      'Approval Email': 'sarah.jenkins@apex.com (Approved Apr 4)'
    },
    exceptions: ''
  },
  {
    id: 'TX-8042',
    originalRow: 3,
    date: '2026-04-12',
    voucherNo: 'TX-8042',
    accountNumber: 'GL-6250',
    accountDescription: 'Staff Travel & Reimbursements',
    description: 'Executive travel reimbursement - Regional Operations Lead - John Davis',
    narration: 'Flight tickets, hotel lodging, and per diem for Midwest supplier visits',
    debit: 3420.50,
    credit: 0.00,
    balance: 51920.50,
    testingClassification: ['Employee Disbursement & Reimbursement'],
    testingStatus: 'Tested - Pass',
    testingReference: 'REF-EMP-001',
    attributeResults: {
      'Expense report itemized receipts attached': 'Pass',
      'Manager authorization obtained prior to travel': 'Pass',
      'Per diem rates compliant with corporate travel policy': 'Pass',
      'Expense reimbursement paid to correct employee bank account': 'Pass'
    },
    evidenceFields: {
      'Expense Report ID': 'EXP-2026-04-JD',
      'Receipts Bundle': 'JD_Travel_Receipts_April.pdf',
      'Manager Sign-off': 'Signed by Marcus Vance (Director)'
    },
    exceptions: ''
  },
  {
    id: 'TX-8043',
    originalRow: 4,
    date: '2026-04-18',
    voucherNo: 'TX-8043',
    accountNumber: 'GL-4010',
    accountDescription: 'Commercial Product Revenue',
    description: 'Bulk electronics shipment order - Apex Order #ORD-99120',
    narration: 'Commercial distribution invoice for 450 units smart sensor displays',
    debit: 0.00,
    credit: 128450.00,
    balance: -76529.50,
    testingClassification: ['Sales Testing'],
    testingStatus: 'Tested - Pass',
    testingReference: 'REF-SALES-001',
    attributeResults: {
      'Customer Purchase Order verified': 'Pass',
      'Sales Invoice matches PO pricing': 'Pass',
      'Shipping Bill of Lading (BOL) confirmed delivered': 'Pass',
      'Payment received and cleared within credit terms': 'Pass'
    },
    evidenceFields: {
      'Purchase Order #': 'PO-MDT-2026-091',
      'Sales Invoice': 'INV-APEX-88219.pdf',
      'Bill of Lading': 'BOL-FEDEX-992109'
    },
    exceptions: ''
  },
  {
    id: 'TX-8044',
    originalRow: 5,
    date: '2026-05-02',
    voucherNo: 'TX-8044',
    accountNumber: 'GL-6150',
    accountDescription: 'Third Party Logistics & Freight',
    description: 'Expedited freight services - FastTrack Logistics Inc',
    narration: 'Intermodal freight transfer from Detroit warehouse to Chicago terminal',
    debit: 19800.00,
    credit: 0.00,
    balance: -56729.50,
    testingClassification: ['3rd Party Disbursement'],
    testingStatus: 'Pending Classification',
    testingReference: '',
    attributeResults: {},
    evidenceFields: {},
    exceptions: ''
  },
  {
    id: 'TX-8045',
    originalRow: 6,
    date: '2026-05-15',
    voucherNo: 'TX-8045',
    accountNumber: 'GL-6250',
    accountDescription: 'Staff Travel & Reimbursements',
    description: 'Field engineer accommodation & client training meals - Elena Rostova',
    narration: 'Technical training session on-site at Midwest distributor facility',
    debit: 1845.00,
    credit: 0.00,
    balance: -54884.50,
    testingClassification: ['Employee Disbursement & Reimbursement'],
    testingStatus: 'Pending Classification',
    testingReference: '',
    attributeResults: {},
    evidenceFields: {},
    exceptions: ''
  },
  {
    id: 'TX-8046',
    originalRow: 7,
    date: '2026-05-22',
    voucherNo: 'TX-8046',
    accountNumber: 'GL-4010',
    accountDescription: 'Commercial Product Revenue',
    description: 'Wholesale component distribution - Midwest Trading Co. PO #8812',
    narration: 'Scheduled monthly batch order fulfillment',
    debit: 0.00,
    credit: 87600.00,
    balance: -142484.50,
    testingClassification: ['Sales Testing'],
    testingStatus: 'Pending Classification',
    testingReference: '',
    attributeResults: {},
    evidenceFields: {},
    exceptions: ''
  },
  {
    id: 'TX-8047',
    originalRow: 8,
    date: '2026-06-05',
    voucherNo: 'TX-8047',
    accountNumber: 'GL-6300',
    accountDescription: 'Marketing & Promotional Allowances',
    description: 'Co-op distributor marketing campaign rebate - Midwest Trading',
    narration: 'Q1 promotional catalog co-sponsorship rebate credit',
    debit: 12500.00,
    credit: 0.00,
    balance: -129984.50,
    testingClassification: ['3rd Party Disbursement'],
    testingStatus: 'Pending Classification',
    testingReference: '',
    attributeResults: {},
    evidenceFields: {},
    exceptions: ''
  },
  {
    id: 'TX-8048',
    originalRow: 9,
    date: '2026-06-18',
    voucherNo: 'TX-8048',
    accountNumber: 'GL-5010',
    accountDescription: 'Cost of Goods Sold - Finished Goods',
    description: 'Component inventory transfer adjustment',
    narration: 'Standard inventory cost allocation',
    debit: 34100.00,
    credit: 0.00,
    balance: -95884.50,
    testingClassification: ['N/A'],
    testingStatus: 'Tested - Pass',
    testingReference: 'REF-NA-001',
    attributeResults: {},
    evidenceFields: {},
    exceptions: ''
  }
];

function initializeDefaultDatabase(): AuditLogEntry[] {
  const initialTime = new Date('2026-04-01T10:00:00.000Z').toISOString();
  const defaultFileId = 'drive_gl_midwest_2026_canonical';

  const defaultEvidenceEntry: AuditLogEntry = {
    id: defaultFileId,
    event_type: 'EVIDENCE_FILE',
    target_user_email: 'Apex Electronics Corp::Midwest Trading Co.',
    user_name: 'Lead Auditor Sarah Jenkins',
    user_email: 'sarah.jenkins@apex.com',
    user_role: 'Auditor',
    organization: 'Apex Electronics Corp',
    action: 'Uploaded General Ledger Population',
    ip_address: '127.0.0.1',
    created_at: initialTime,
    details: {
      client_name: 'Apex Electronics Corp',
      audit_id: 'eng-101',
      audit_code: 'AUD-2026-001',
      distributor_name: 'Midwest Trading Co.',
      requirement_ref: 'SAMPLING',
      requirement_title: 'FY2026 General Ledger Full Population',
      section: 'Sampling',
      file_name: 'Midwest_Trading_GL_FY2026_Full.xlsx',
      file_size_mb: 2.4,
      file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      google_drive_file_id: defaultFileId,
      google_drive_folder_id: 'folder_gl_sampling_01',
      storage_path: 'Apex/eng-101/Midwest Trading Co./Sampling',
      version: 1,
      uploaded_by: 'Lead Auditor Sarah Jenkins',
      uploaded_at: initialTime,
      status: 'AVAILABLE',
      review_status: 'ACCEPTED',
      uploader_role: 'Auditor',
      audit_period: 'FY 2025-26',
      document_type: 'SAMPLING_POPULATION',
      document_usage: ['SAMPLING_POPULATION'],
      samplingEnabled: true,
      samplingStatus: 'ADDED',
      glMapping: {
        date: 'Date',
        voucherNo: 'VoucherNo',
        accountNumber: 'AccountNumber',
        accountDescription: 'AccountDescription',
        description: 'Description',
        narration: 'Narration',
        debit: 'Debit',
        credit: 'Credit',
        balance: 'Balance'
      },
      records_count: DEFAULT_SAMPLE_GL_RECORDS.length,
      parsed_records: DEFAULT_SAMPLE_GL_RECORDS,
      source: 'Auditor Upload'
    }
  };

  const defaultStateEntry: AuditLogEntry = {
    id: 'state_sampling_midwest_eng101',
    event_type: 'SAMPLING_STATE',
    target_user_email: 'Apex Electronics Corp::Midwest Trading Co.',
    user_name: 'System',
    user_email: 'system@data360.com',
    user_role: 'System',
    organization: 'Apex Electronics Corp',
    action: 'Active Sampling Population State',
    ip_address: '127.0.0.1',
    created_at: initialTime,
    details: {
      distributorId: 'Midwest Trading Co.',
      auditId: 'eng-101',
      clientName: 'Apex Electronics Corp',
      activePopulationId: defaultFileId,
      activePopulationName: 'Midwest_Trading_GL_FY2026_Full.xlsx',
      activeTab: 'GL',
      updatedAt: initialTime
    }
  };

  return [defaultEvidenceEntry, defaultStateEntry];
}

class ResilientDbStore {
  private inMemoryLogs: AuditLogEntry[] = [];
  private isLoaded = false;

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.inMemoryLogs = parsed;
          this.isLoaded = true;
          return;
        }
      }
    } catch (e) {
      console.warn('Could not read db store from disk:', e);
    }

    // Initialize with baseline data
    this.inMemoryLogs = initializeDefaultDatabase();
    this.saveToDisk();
    this.isLoaded = true;
  }

  private saveToDisk() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.inMemoryLogs, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not save db store to disk:', e);
    }
  }

  public async getAuditLogs(eventType?: string): Promise<AuditLogEntry[]> {
    if (!this.isLoaded) this.loadFromDisk();

    if (isSupabaseServerConfigured()) {
      try {
        const client = getSupabaseServerClient();
        let query = client.from('system_audit_logs').select('*').order('created_at', { ascending: false });
        if (eventType) {
          query = query.eq('event_type', eventType);
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          // Merge Supabase entries into local memory store
          for (const row of data) {
            const idx = this.inMemoryLogs.findIndex(l => l.id === row.id);
            if (idx >= 0) {
              this.inMemoryLogs[idx] = row;
            } else {
              this.inMemoryLogs.unshift(row);
            }
          }
          this.saveToDisk();
          return data;
        }
      } catch (err) {
        console.warn('Supabase query failed, using resilient disk database store:', err);
      }
    }

    if (eventType) {
      return this.inMemoryLogs.filter(l => l.event_type === eventType);
    }
    return [...this.inMemoryLogs];
  }

  public async insertAuditLog(entry: Partial<AuditLogEntry>): Promise<AuditLogEntry> {
    if (!this.isLoaded) this.loadFromDisk();

    const newId = entry.id || `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const fullEntry: AuditLogEntry = {
      id: newId,
      event_type: entry.event_type || 'SYSTEM_EVENT',
      target_user_email: entry.target_user_email || '',
      user_name: entry.user_name || 'System User',
      user_email: entry.user_email || 'user@data360.com',
      user_role: entry.user_role || 'Auditor',
      organization: entry.organization || 'Apex Electronics Corp',
      action: entry.action || 'Log Entry',
      ip_address: entry.ip_address || '127.0.0.1',
      details: entry.details || {},
      created_at: entry.created_at || new Date().toISOString()
    };

    // Save in memory and disk
    const existingIdx = this.inMemoryLogs.findIndex(l => l.id === fullEntry.id);
    if (existingIdx >= 0) {
      this.inMemoryLogs[existingIdx] = fullEntry;
    } else {
      this.inMemoryLogs.unshift(fullEntry);
    }
    this.saveToDisk();

    // Sync with Supabase if configured
    if (isSupabaseServerConfigured()) {
      try {
        const client = getSupabaseServerClient();
        await client.from('system_audit_logs').insert(fullEntry);
      } catch (err) {
        console.warn('Supabase insert skipped or failed:', err);
      }
    }

    return fullEntry;
  }

  public async updateAuditLog(id: string, updates: Partial<AuditLogEntry>): Promise<AuditLogEntry | null> {
    if (!this.isLoaded) this.loadFromDisk();

    const idx = this.inMemoryLogs.findIndex(l => l.id === id);
    if (idx >= 0) {
      this.inMemoryLogs[idx] = {
        ...this.inMemoryLogs[idx],
        ...updates,
        details: {
          ...(this.inMemoryLogs[idx].details || {}),
          ...(updates.details || {})
        }
      };
      this.saveToDisk();

      if (isSupabaseServerConfigured()) {
        try {
          const client = getSupabaseServerClient();
          await client.from('system_audit_logs').update(this.inMemoryLogs[idx]).eq('id', id);
        } catch (err) {
          console.warn('Supabase update failed:', err);
        }
      }
      return this.inMemoryLogs[idx];
    }
    return null;
  }

  public async getSamplingState(distributorId?: string, auditId?: string): Promise<any> {
    const logs = await this.getAuditLogs('SAMPLING_STATE');
    const normDist = (distributorId || '').toLowerCase().trim();
    const normAudit = (auditId || '').toLowerCase().trim();

    const found = logs.find(l => {
      const d = l.details || {};
      const dDist = (d.distributorId || d.distributor_name || '').toLowerCase().trim();
      const dAudit = (d.auditId || d.audit_id || '').toLowerCase().trim();

      const matchDist = !distributorId || distributorId === 'All Distributors' || dDist === normDist || dDist.includes(normDist);
      const matchAudit = !auditId || auditId === 'All Audits' || dAudit === normAudit;
      return matchDist && matchAudit;
    });

    if (found && found.details) {
      return found.details;
    }

    // If not found, return latest state or default state
    if (logs.length > 0 && logs[0].details) {
      return logs[0].details;
    }

    return null;
  }

  public async setSamplingState(stateDetails: any): Promise<void> {
    const { distributorId, auditId, clientName, activePopulationId, activePopulationName, activeTab } = stateDetails;
    const logs = await this.getAuditLogs('SAMPLING_STATE');

    const found = logs.find(l => {
      const d = l.details || {};
      return (
        (!distributorId || d.distributorId === distributorId) &&
        (!auditId || d.auditId === auditId)
      );
    });

    const updatedState = {
      distributorId: distributorId || 'Midwest Trading Co.',
      auditId: auditId || 'eng-101',
      clientName: clientName || 'Apex Electronics Corp',
      activePopulationId,
      activePopulationName,
      activeTab: activeTab || 'GL',
      updatedAt: new Date().toISOString()
    };

    if (found) {
      await this.updateAuditLog(found.id, {
        details: { ...found.details, ...updatedState }
      });
    } else {
      await this.insertAuditLog({
        event_type: 'SAMPLING_STATE',
        target_user_email: `${clientName || 'Apex Electronics Corp'}::${distributorId || 'distributor'}`,
        details: updatedState
      });
    }
  }

  public async getSamplingPopulations(distributorId?: string, auditId?: string, clientName?: string): Promise<any[]> {
    const logs = await this.getAuditLogs('EVIDENCE_FILE');

    const all = logs
      .map(row => {
        let r = row.details || {};
        if (typeof r === 'string') {
          try { r = JSON.parse(r); } catch (e) {}
        }
        return {
          id: row.id,
          clientName: r.client_name || r.clientName || 'Apex Electronics Corp',
          auditId: r.audit_id || r.auditId || 'eng-101',
          auditCode: r.audit_code || r.auditCode || 'AUD-2026-001',
          distributorName: r.distributor_name || r.distributorName || 'Midwest Trading Co.',
          requestRef: r.requirement_ref || r.requestRef || 'SAMPLING',
          requestTitle: r.requirement_title || r.requestTitle || 'General Ledger Population',
          section: r.section || 'Sampling',
          fileName: r.file_name || r.fileName || 'General_Ledger.xlsx',
          fileSizeMB: Number(r.file_size_mb || r.fileSizeMB || 1.5),
          fileType: r.file_type || r.fileType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          googleDriveFileId: r.google_drive_file_id || r.googleDriveFileId || r.storage_path || row.id,
          uploadedBy: r.uploaded_by || r.uploadedBy || 'Auditor User',
          uploadedDate: r.uploaded_at ? new Date(r.uploaded_at).toLocaleString() : (r.uploadedDate || new Date().toLocaleString()),
          status: r.review_status || r.status || 'AVAILABLE',
          samplingEnabled: r.samplingEnabled ?? true,
          samplingStatus: r.samplingStatus || 'ADDED',
          documentUsage: Array.isArray(r.document_usage) ? r.document_usage : (Array.isArray(r.documentUsage) ? r.documentUsage : ['SAMPLING_POPULATION']),
          glMapping: r.glMapping || r.gl_mapping,
          recordCount: r.records_count || r.recordCount || (Array.isArray(r.parsed_records) ? r.parsed_records.length : 0),
          hasParsedRecords: Array.isArray(r.parsed_records) && r.parsed_records.length > 0
        };
      })
      .filter(p => {
        const usage = p.documentUsage || [];
        const hasSampling = p.samplingEnabled === true || usage.includes('SAMPLING_POPULATION') || p.requestRef === 'SAMPLING' || p.section === 'Sampling';
        return hasSampling;
      });

    // Match distributor & audit
    let filtered = all.filter(p => {
      const matchDist = !distributorId || distributorId === 'All Distributors' || p.distributorName === distributorId;
      const matchAudit = !auditId || auditId === 'All Audits' || p.auditId === auditId;
      const matchClient = !clientName || clientName === 'All Clients' || p.clientName === clientName;
      return matchDist && matchAudit && matchClient;
    });

    if (filtered.length === 0 && all.length > 0) {
      filtered = all;
    }

    return filtered;
  }

  public async getPopulationRecords(fileId?: string, distributorId?: string, auditId?: string): Promise<{
    fileId: string | null;
    fileName: string | null;
    glMapping: any;
    records: any[];
    recordCount: number;
  }> {
    const logs = await this.getAuditLogs('EVIDENCE_FILE');

    let targetRow: AuditLogEntry | undefined;

    if (fileId) {
      targetRow = logs.find(row => {
        const d = row.details || {};
        return (
          row.id === fileId ||
          d.google_drive_file_id === fileId ||
          d.storage_path === fileId ||
          d.file_name === fileId
        );
      });
    }

    if (!targetRow) {
      targetRow = logs.find(row => {
        const d = row.details || {};
        const isMatch = (
          (!distributorId || distributorId === 'All Distributors' || d.distributor_name === distributorId || d.distributorName === distributorId) &&
          (!auditId || auditId === 'All Audits' || d.audit_id === auditId || d.auditId === auditId)
        );
        const hasSampling = d.samplingEnabled === true || (Array.isArray(d.document_usage) && d.document_usage.includes('SAMPLING_POPULATION')) || d.requirement_ref === 'SAMPLING';
        return isMatch && hasSampling;
      });
    }

    if (!targetRow && logs.length > 0) {
      targetRow = logs[0];
    }

    if (!targetRow) {
      return {
        fileId: null,
        fileName: null,
        glMapping: {},
        records: [],
        recordCount: 0
      };
    }

    const details = targetRow.details || {};
    const records = Array.isArray(details.parsed_records) ? details.parsed_records : [];

    return {
      fileId: details.google_drive_file_id || targetRow.id,
      fileName: details.file_name || 'General_Ledger.xlsx',
      glMapping: details.glMapping || details.gl_mapping || {},
      records,
      recordCount: records.length
    };
  }

  public async saveSamplingTransactions(
    items: any[],
    activePopulationId?: string,
    distributorId: string = 'Midwest Trading Co.',
    auditId: string = 'eng-101',
    clientName: string = 'Apex Electronics Corp'
  ): Promise<number> {
    if (!this.isLoaded) this.loadFromDisk();

    // 1. Update or insert GL_SAMPLE entries
    const existingSamples = await this.getAuditLogs('GL_SAMPLE');

    for (const item of items) {
      const sampleId = item.sampleId || item.id;
      const distId = item.distributorId || distributorId;
      const audId = item.auditId || auditId;
      if (!sampleId) continue;

      const found = existingSamples.find(d => {
        const det = d.details || {};
        return (
          (det.sampleId === sampleId || det.id === sampleId || (det.voucherNo && item.voucherNo && det.voucherNo !== '—' && det.voucherNo === item.voucherNo)) &&
          (!distId || distId === 'All Distributors' || det.distributorId === distId) &&
          (!audId || audId === 'All Audits' || det.auditId === audId)
        );
      });

      const cleanItem = {
        ...item,
        sampleId,
        distributorId: distId,
        auditId: audId,
        updatedAt: new Date().toISOString()
      };

      if (found) {
        await this.updateAuditLog(found.id, {
          details: { ...found.details, ...cleanItem }
        });
      } else {
        await this.insertAuditLog({
          event_type: 'GL_SAMPLE',
          target_user_email: `${distId || 'distributor'}`,
          details: cleanItem
        });
      }
    }

    // 2. Update EVIDENCE_FILE parsed_records so that getPopulationRecords returns the saved classifications immediately
    const evidenceLogs = await this.getAuditLogs('EVIDENCE_FILE');

    for (const evRow of evidenceLogs) {
      const evDetails = evRow.details || {};
      const isTarget = (
        (activePopulationId && (evRow.id === activePopulationId || evDetails.google_drive_file_id === activePopulationId || evDetails.storage_path === activePopulationId)) ||
        (evDetails.distributor_name === distributorId && evDetails.audit_id === auditId) ||
        !activePopulationId // if no activePopulationId specified, update matching
      );

      if (isTarget && Array.isArray(evDetails.parsed_records)) {
        let hasChanges = false;
        const updatedRecords = evDetails.parsed_records.map((rec: any) => {
          const matchItem = items.find(it => (
            (it.sampleId && (it.sampleId === rec.id || it.sampleId === rec.sampleId)) ||
            (it.id && (it.id === rec.id || it.id === rec.sampleId)) ||
            (it.voucherNo && rec.voucherNo && it.voucherNo !== '—' && it.voucherNo === rec.voucherNo)
          ));

          if (matchItem) {
            hasChanges = true;
            return {
              ...rec,
              testingClassification: matchItem.testingClassification,
              testingStatus: matchItem.testingStatus,
              testingReference: matchItem.testingReference,
              attributeResults: matchItem.attributeResults,
              evidenceFields: matchItem.evidenceFields,
              exceptions: matchItem.exceptions
            };
          }
          return rec;
        });

        if (hasChanges) {
          await this.updateAuditLog(evRow.id, {
            details: {
              ...evDetails,
              parsed_records: updatedRecords
            }
          });
        }
      }
    }

    // 3. Update SAMPLING_STATE activePopulationId
    if (activePopulationId) {
      await this.setSamplingState({
        distributorId,
        auditId,
        clientName,
        activePopulationId
      });
    }

    return items.length;
  }
}

export const dbStore = new ResilientDbStore();
