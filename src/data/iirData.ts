import { IIRRequestItem, IIRAuditTrail } from '../types';

export const INITIAL_IIR_REQUESTS: IIRRequestItem[] = [
  // CATEGORY 1: Distributor General Information
  {
    id: 'iir-1.1',
    refNumber: '1.1',
    category: 'Distributor General Information',
    categoryNumber: 1,
    title: 'Organization chart',
    description: 'Provide complete corporate org chart detailing executive leadership, sales, compliance, and finance hierarchy.',
    isMandatory: true,
    responseType: 'File + text',
    allowedFileTypes: ['PDF', 'Excel', 'Word', 'ZIP'],
    maxSizeMB: 25,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'Org chart as of Q2 2026',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-101',
        evidenceId: 'EVD-101-ORG',
        fileName: 'Midwest_OrgChart_FY26.pdf',
        fileSizeMB: 3.4,
        fileType: 'PDF',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-07-28 10:14:22',
        version: 1,
        hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        status: 'Accepted'
      }
    ],
    comments: [
      {
        id: 'cmt-1',
        author: 'John Miller',
        role: 'Distributor',
        timestamp: '2026-07-28 10:15:00',
        message: 'Please note VP of Sales was updated effective June 1st.'
      },
      {
        id: 'cmt-2',
        author: 'Sarah Jenkins',
        role: 'Auditor',
        timestamp: '2026-07-29 09:30:12',
        message: 'Received and verified against corporate registration.'
      }
    ],
    lastUpdated: '2026-07-29 09:30:12',
    reviewerComment: 'Verified and accepted by Audit Lead.',
    sampleMaterialEnabled: true,
    referenceMaterial: {
      id: 'ref-1.1',
      tenant: 'Apex Electronics Corp',
      client: 'Apex Electronics Corp',
      auditId: 'AUD-FY26-001',
      requirementId: 'iir-1.1',
      requirementVersion: 1,
      referenceType: 'Instruction / Guidance Document',
      fileName: 'Org_Chart_Sample_Structure_Guidance.pdf',
      fileSizeMB: 1.8,
      fileType: 'PDF',
      description: 'Use this sample guidance document to format executive leadership and branch office reporting lines.',
      uploadedBy: 'Sarah Jenkins (Audit Lead)',
      uploadDate: '2026-07-20 14:00:00',
      fileVersion: 1,
      status: 'Active',
      displayToDistributor: true,
      versionHistory: [
        {
          version: 1,
          fileName: 'Org_Chart_Sample_Structure_Guidance.pdf',
          fileSizeMB: 1.8,
          fileType: 'PDF',
          uploadDate: '2026-07-20 14:00:00',
          uploadedBy: 'Sarah Jenkins (Audit Lead)',
          description: 'Initial reference structure guideline for Org Chart submission.'
        }
      ]
    }
  },
  {
    id: 'iir-1.2',
    refNumber: '1.2',
    category: 'Distributor General Information',
    categoryNumber: 1,
    title: 'Distributor agreement',
    description: 'Signed distributor agreement copy, current version.',
    isMandatory: true,
    responseType: 'File only',
    allowedFileTypes: ['PDF', 'Word'],
    maxSizeMB: 25,
    status: 'Completed',
    reviewerStatus: 'Pending Review',
    textResponse: '',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-102',
        evidenceId: 'EVD-102-AGR',
        fileName: 'Distributor_Agreement_2026.pdf',
        fileSizeMB: 1.1,
        fileType: 'PDF',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-07-29 14:02:10',
        version: 1,
        hash: '7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504d978c183',
        status: 'Uploaded'
      }
    ],
    comments: [],
    lastUpdated: '2026-07-29 14:02:10'
  },
  {
    id: 'iir-1.3',
    refNumber: '1.3',
    category: 'Distributor General Information',
    categoryNumber: 1,
    title: 'Business Model',
    description: 'Overview of business model, territory distribution rights, key logistics hubs, and warehousing network.',
    isMandatory: false,
    allowedFileTypes: ['PDF', 'Word', 'PowerPoint'],
    maxSizeMB: 50,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'We operate 3 regional warehouses in Chicago, Detroit, and Indianapolis supporting 450 sub-retailers.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-103',
        evidenceId: 'EVD-103-BM',
        fileName: 'Distributor_Logistics_Overview.pdf',
        fileSizeMB: 5.2,
        fileType: 'PDF',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-07-29 15:20:00',
        version: 1,
        hash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
        status: 'Accepted'
      }
    ],
    comments: [],
    lastUpdated: '2026-07-29 15:20:00'
  },
  {
    id: 'iir-1.4',
    refNumber: '1.4',
    category: 'Distributor General Information',
    categoryNumber: 1,
    title: 'Employee Master',
    description: 'Active employee listing including employee ID, name, designation, department, hire date, and location.',
    isMandatory: true,
    allowedFileTypes: ['Excel', 'CSV'],
    maxSizeMB: 20,
    status: 'Completed',
    reviewerStatus: 'Pending Review',
    textResponse: 'Active payroll active headcount listing 184 employees as of Q2 end.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-104',
        evidenceId: 'EVD-104-EMP',
        fileName: 'Midwest_Trading_Employee_Master_2026.xlsx',
        fileSizeMB: 2.1,
        fileType: 'Excel',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-07-30 08:45:11',
        version: 1,
        hash: 'cb56d08b3a0136c40f6d4d7d9150e472028a10123120f878345719921c324e6a',
        status: 'Uploaded'
      }
    ],
    comments: [],
    lastUpdated: '2026-07-30 08:45:11',
    sampleMaterialEnabled: true,
    referenceMaterial: {
      id: 'ref-1.4',
      tenant: 'Apex Electronics Corp',
      client: 'Apex Electronics Corp',
      auditId: 'AUD-FY26-001',
      requirementId: 'iir-1.4',
      requirementVersion: 1,
      referenceType: 'Blank Template',
      fileName: 'Employee_Master_Standard_Template.xlsx',
      fileSizeMB: 0.4,
      fileType: 'Excel',
      description: 'Standardized Excel template. Please keep header row intact (Emp ID, Name, Dept, Location, Joining Date).',
      uploadedBy: 'Sarah Jenkins (Audit Lead)',
      uploadDate: '2026-07-21 10:15:00',
      fileVersion: 1,
      status: 'Active',
      displayToDistributor: true,
      versionHistory: []
    }
  },
  {
    id: 'iir-1.5',
    refNumber: '1.5',
    category: 'Distributor General Information',
    categoryNumber: 1,
    title: 'Business Conduct Policy',
    description: 'Copy of Code of Business Conduct, Anti-Bribery & Corruption (ABC) Policy, and Whistleblower procedures.',
    isMandatory: true,
    allowedFileTypes: ['PDF', 'Word'],
    maxSizeMB: 20,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'Code of conduct handbook signed by all personnel upon hiring.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-105',
        evidenceId: 'EVD-105-ABC',
        fileName: 'Midwest_Ethics_AntiBribery_Policy.pdf',
        fileSizeMB: 1.2,
        fileType: 'PDF',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-07-30 09:12:00',
        version: 1,
        hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        status: 'Accepted'
      }
    ],
    comments: [],
    lastUpdated: '2026-07-30 09:12:00'
  },
  {
    id: 'iir-1.6',
    refNumber: '1.6',
    category: 'Distributor General Information',
    categoryNumber: 1,
    title: 'Travel & Expense Policy',
    description: 'Formal policy outlining per diem limits, entertainment approvals, and HCP hospitality spending caps.',
    isMandatory: true,
    allowedFileTypes: ['PDF', 'Word'],
    maxSizeMB: 20,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'T&E policy v3.1 effective Jan 2025.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-106',
        evidenceId: 'EVD-106-TEP',
        fileName: 'Travel_Expense_Policy_2025.pdf',
        fileSizeMB: 0.9,
        fileType: 'PDF',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-07-30 11:00:15',
        version: 1,
        hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        status: 'Accepted'
      }
    ],
    comments: [],
    lastUpdated: '2026-07-30 11:00:15'
  },
  {
    id: 'iir-1.7',
    refNumber: '1.7',
    category: 'Distributor General Information',
    categoryNumber: 1,
    title: 'Related Companies',
    description: 'List of affiliated entities, parent companies, subsidiaries, and sister companies sharing common ownership.',
    isMandatory: false,
    allowedFileTypes: ['PDF', 'Excel'],
    maxSizeMB: 15,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'No sister trading entities exist within the audit jurisdiction.',
    noUploadExplanation: '',
    uploadedFiles: [],
    comments: [],
    lastUpdated: '2026-07-30 11:30:00'
  },
  {
    id: 'iir-1.8',
    refNumber: '1.8',
    category: 'Distributor General Information',
    categoryNumber: 1,
    title: 'Brands & Manufacturers',
    description: 'List of all principal brand authorization agreements and exclusive distribution territory contracts.',
    isMandatory: true,
    allowedFileTypes: ['PDF', 'ZIP'],
    maxSizeMB: 50,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'Primary distributor agreement with Apex Electronics attached.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-108',
        evidenceId: 'EVD-108-AGR',
        fileName: 'Apex_Distributor_Agreement_Signed.pdf',
        fileSizeMB: 8.5,
        fileType: 'PDF',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-07-30 14:10:00',
        version: 1,
        hash: 'a2f8c5b091e6b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
        status: 'Accepted'
      }
    ],
    comments: [],
    lastUpdated: '2026-07-30 14:10:00'
  },
  {
    id: 'iir-1.9',
    refNumber: '1.9',
    category: 'Distributor General Information',
    categoryNumber: 1,
    title: 'Articles of Association',
    description: 'Certified Articles of Incorporation, Memorandum of Association, and tax registration certificate.',
    isMandatory: true,
    allowedFileTypes: ['PDF'],
    maxSizeMB: 20,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'Articles of incorporation and state tax registration.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-109',
        evidenceId: 'EVD-109-ART',
        fileName: 'Midwest_Articles_of_Incorporation.pdf',
        fileSizeMB: 4.1,
        fileType: 'PDF',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-07-30 16:00:00',
        version: 1,
        hash: 'f1e2d3c4b5a69876543210fedcba9876543210fedcba9876543210fedcba9876',
        status: 'Accepted'
      }
    ],
    comments: [],
    lastUpdated: '2026-07-30 16:00:00'
  },

  // CATEGORY 2: Financial Information
  {
    id: 'iir-2.1',
    refNumber: '2.1',
    category: 'Financial Information',
    categoryNumber: 2,
    title: 'Chart of Accounts',
    description: 'Complete General Ledger Chart of Accounts with account numbers, descriptions, and account types.',
    isMandatory: true,
    allowedFileTypes: ['Excel', 'CSV'],
    maxSizeMB: 20,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'SAP Chart of accounts dump for FY25 and FY26.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-201',
        evidenceId: 'EVD-201-COA',
        fileName: 'GL_ChartOfAccounts_Midwest_FY26.xlsx',
        fileSizeMB: 2.8,
        fileType: 'Excel',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-07-31 09:10:22',
        version: 1,
        hash: 'b10a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a',
        status: 'Accepted'
      }
    ],
    comments: [],
    lastUpdated: '2026-07-31 09:10:22'
  },
  {
    id: 'iir-2.2',
    refNumber: '2.2',
    category: 'Financial Information',
    categoryNumber: 2,
    title: 'Trial Balance',
    description: 'Audited or final Monthly Trial Balance for all 12 months of the audit period.',
    isMandatory: true,
    allowedFileTypes: ['Excel', 'CSV', 'PDF'],
    maxSizeMB: 30,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'Monthly trial balances extracted directly from ERP.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-202',
        evidenceId: 'EVD-202-TB',
        fileName: 'FY25_FY26_Monthly_Trial_Balance.xlsx',
        fileSizeMB: 7.4,
        fileType: 'Excel',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-07-31 11:30:00',
        version: 1,
        hash: 'c23b4a5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3b',
        status: 'Accepted'
      }
    ],
    comments: [],
    lastUpdated: '2026-07-31 11:30:00'
  },
  {
    id: 'iir-2.3',
    refNumber: '2.3',
    category: 'Financial Information',
    categoryNumber: 2,
    title: 'Sales Report',
    description: 'Detailed SKU-level sales transaction register including customer name, date, invoice #, qty, list price, and net price.',
    isMandatory: true,
    allowedFileTypes: ['Excel', 'CSV', 'ZIP'],
    maxSizeMB: 100,
    status: 'Completed',
    reviewerStatus: 'Pending Review',
    textResponse: 'Full 18,200 invoice line register uploaded as requested.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-203',
        evidenceId: 'EVD-203-SLS',
        fileName: 'Sales_Register_18200_Invoices_FY26.csv',
        fileSizeMB: 14.2,
        fileType: 'CSV',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-07-31 14:05:10',
        version: 1,
        hash: 'd34c5b6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e',
        status: 'Uploaded'
      }
    ],
    comments: [],
    lastUpdated: '2026-07-31 14:05:10'
  },
  {
    id: 'iir-2.4',
    refNumber: '2.4',
    category: 'Financial Information',
    categoryNumber: 2,
    title: 'Sales Financial Data',
    description: 'Reconciliation of gross revenue to net recognized revenue including discounts, volume rebates, and returns.',
    isMandatory: true,
    allowedFileTypes: ['Excel'],
    maxSizeMB: 25,
    status: 'Completed',
    reviewerStatus: 'Clarification Required',
    textResponse: 'Reconciliation table uploaded.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-204',
        evidenceId: 'EVD-204-SFD',
        fileName: 'Gross_To_Net_Revenue_Reconcile.xlsx',
        fileSizeMB: 3.1,
        fileType: 'Excel',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-07-31 15:40:00',
        version: 1,
        hash: 'e45d6c7b8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d',
        status: 'Uploaded'
      }
    ],
    comments: [
      {
        id: 'cmt-204',
        author: 'Sarah Jenkins',
        role: 'Auditor',
        timestamp: '2026-08-01 08:20:00',
        message: 'Line item 14 shows a $184,000 unallocated rebate reserve adjustment. Please upload backup schedule.'
      }
    ],
    lastUpdated: '2026-08-01 08:20:00',
    reviewerComment: 'Please clarify unallocated rebate reserve calculation in Schedule B.'
  },
  {
    id: 'iir-2.5',
    refNumber: '2.5',
    category: 'Financial Information',
    categoryNumber: 2,
    title: 'Bank Accounts',
    description: 'List of all corporate bank accounts, bank names, account numbers, authorized signers, and annual bank confirmations.',
    isMandatory: true,
    allowedFileTypes: ['PDF', 'Excel'],
    maxSizeMB: 20,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'Bank account listing and authorized signer matrix attached.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-205',
        evidenceId: 'EVD-205-BNK',
        fileName: 'Corporate_Bank_Accounts_Authorized_Signers.pdf',
        fileSizeMB: 1.5,
        fileType: 'PDF',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-07-31 16:30:00',
        version: 1,
        hash: 'f56e7d8c9b0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c',
        status: 'Accepted'
      }
    ],
    comments: [],
    lastUpdated: '2026-07-31 16:30:00'
  },
  {
    id: 'iir-2.6',
    refNumber: '2.6',
    category: 'Financial Information',
    categoryNumber: 2,
    title: 'Debit Notes',
    description: 'Register of all debit notes issued to principal manufacturers for co-op advertising, price protection, and rebates.',
    isMandatory: true,
    allowedFileTypes: ['Excel', 'CSV'],
    maxSizeMB: 30,
    status: 'Completed',
    reviewerStatus: 'Pending Review',
    textResponse: 'Debit note listing for FY26 totaling $4.2M in claims.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-206',
        evidenceId: 'EVD-206-DBN',
        fileName: 'Debit_Notes_Register_FY26.xlsx',
        fileSizeMB: 4.8,
        fileType: 'Excel',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-08-01 09:00:15',
        version: 1,
        hash: '067f8e9d0c1b2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
        status: 'Uploaded'
      }
    ],
    comments: [],
    lastUpdated: '2026-08-01 09:00:15'
  },
  {
    id: 'iir-2.7',
    refNumber: '2.7',
    category: 'Financial Information',
    categoryNumber: 2,
    title: 'Analytical Ledger',
    description: 'General Ledger detail for Accounts Payable, Sales Discounts (Acc. 5040), and Marketing Accruals (Acc. 5120).',
    isMandatory: true,
    allowedFileTypes: ['Excel', 'CSV', 'ZIP'],
    maxSizeMB: 50,
    status: 'Partially Completed',
    reviewerStatus: 'Pending Review',
    textResponse: 'AP and Sales Discount ledgers uploaded. Marketing accrual GL dump is currently being exported from ERP.',
    noUploadExplanation: 'Marketing accrual GL dump is exceeding standard export size limit. ERP team is splitting file into 2 parts.',
    uploadedFiles: [
      {
        id: 'file-207',
        evidenceId: 'EVD-207-GL',
        fileName: 'GL_AP_Discounts_Extract_Part1.xlsx',
        fileSizeMB: 18.5,
        fileType: 'Excel',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-08-01 10:15:00',
        version: 1,
        hash: '178a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
        status: 'Uploaded'
      }
    ],
    comments: [],
    lastUpdated: '2026-08-01 10:15:00'
  },
  {
    id: 'iir-2.8',
    refNumber: '2.8',
    category: 'Financial Information',
    categoryNumber: 2,
    title: 'Credit Card Listing',
    description: 'Listing of corporate credit cards issued to employees, credit limits, and monthly statements for sample testing.',
    isMandatory: false,
    allowedFileTypes: ['PDF', 'Excel'],
    maxSizeMB: 20,
    status: 'Pending',
    reviewerStatus: 'Pending Review',
    textResponse: '',
    noUploadExplanation: '',
    uploadedFiles: [],
    comments: [],
    lastUpdated: '2026-07-28 08:00:00'
  },

  // CATEGORY 3: Customer Information
  {
    id: 'iir-3.1',
    refNumber: '3.1',
    category: 'Customer Information',
    categoryNumber: 3,
    title: 'Government Contracts',
    description: 'List of all active contracts with government entities, public hospitals, or state-owned enterprises.',
    isMandatory: true,
    allowedFileTypes: ['PDF', 'Excel'],
    maxSizeMB: 30,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: '2 active public tender supply contracts with Illinois Dept of Health.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-301',
        evidenceId: 'EVD-301-GOV',
        fileName: 'Govt_Health_Dept_Contracts_2025_2026.pdf',
        fileSizeMB: 6.2,
        fileType: 'PDF',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-07-31 13:20:00',
        version: 1,
        hash: '289b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
        status: 'Accepted'
      }
    ],
    comments: [],
    lastUpdated: '2026-07-31 13:20:00'
  },
  {
    id: 'iir-3.2',
    refNumber: '3.2',
    category: 'Customer Information',
    categoryNumber: 3,
    title: 'Sub-distributors',
    description: 'Directory of sub-distributors or secondary wholesalers utilized in remote or rural territories.',
    isMandatory: false,
    allowedFileTypes: ['Excel', 'CSV'],
    maxSizeMB: 15,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'We do not engage sub-distributors; all sales are direct to licensed retail outlets.',
    noUploadExplanation: '',
    uploadedFiles: [],
    comments: [],
    lastUpdated: '2026-07-31 14:00:00'
  },
  {
    id: 'iir-3.3',
    refNumber: '3.3',
    category: 'Customer Information',
    categoryNumber: 3,
    title: 'Customer Master',
    description: 'Complete Customer Master database containing customer code, legal name, tax ID, credit tier, and delivery address.',
    isMandatory: true,
    allowedFileTypes: ['Excel', 'CSV'],
    maxSizeMB: 25,
    status: 'Completed',
    reviewerStatus: 'Pending Review',
    textResponse: 'Customer master file containing 1,240 active retail customer accounts.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-303',
        evidenceId: 'EVD-303-CUST',
        fileName: 'Customer_Master_Database_1240_Accounts.xlsx',
        fileSizeMB: 3.9,
        fileType: 'Excel',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-08-01 08:30:00',
        version: 1,
        hash: '390c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
        status: 'Uploaded'
      }
    ],
    comments: [],
    lastUpdated: '2026-08-01 08:30:00'
  },

  // CATEGORY 4: Accounts Payable
  {
    id: 'iir-4.1',
    refNumber: '4.1',
    category: 'Accounts Payable',
    categoryNumber: 4,
    title: 'Vendor Master',
    description: 'Complete Accounts Payable Vendor Master list including vendor name, tax ID, bank routing details, and creation date.',
    isMandatory: true,
    allowedFileTypes: ['Excel', 'CSV'],
    maxSizeMB: 20,
    status: 'Completed',
    reviewerStatus: 'Pending Review',
    textResponse: 'AP Vendor Master with 310 active vendor profiles.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-401',
        evidenceId: 'EVD-401-VND',
        fileName: 'AP_Vendor_Master_Midwest_Trading.xlsx',
        fileSizeMB: 2.2,
        fileType: 'Excel',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-08-01 09:45:00',
        version: 1,
        hash: '4a1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d',
        status: 'Uploaded'
      }
    ],
    comments: [],
    lastUpdated: '2026-08-01 09:45:00'
  },
  {
    id: 'iir-4.2',
    refNumber: '4.2',
    category: 'Accounts Payable',
    categoryNumber: 4,
    title: 'Travel & Expense Reimbursements',
    description: 'Itemized register of all employee expense claims processed during the audit period with receipts.',
    isMandatory: true,
    allowedFileTypes: ['Excel', 'CSV', 'ZIP'],
    maxSizeMB: 50,
    status: 'Completed',
    reviewerStatus: 'Pending Review',
    textResponse: 'Expense reimbursement register exported from Concur.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-402',
        evidenceId: 'EVD-402-EXP',
        fileName: 'Concur_Expense_Reimbursement_FY26.xlsx',
        fileSizeMB: 5.8,
        fileType: 'Excel',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-08-01 10:20:00',
        version: 1,
        hash: '5b2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e',
        status: 'Uploaded'
      }
    ],
    comments: [],
    lastUpdated: '2026-08-01 10:20:00'
  },

  // CATEGORY 5: Healthcare Professional Interactions
  {
    id: 'iir-5.1',
    refNumber: '5.1',
    category: 'Healthcare Professional Interactions',
    categoryNumber: 5,
    title: 'HCP Master',
    description: 'Master list of Healthcare Professionals (HCPs) or medical practitioners engaged for advisory or speaker panels.',
    isMandatory: true,
    allowedFileTypes: ['Excel', 'CSV'],
    maxSizeMB: 15,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'As a consumer electronics distributor, we do not engage HCPs directly.',
    noUploadExplanation: 'Our distribution scope is restricted to retail consumer electronics and commercial audio gear. No medical or healthcare professional engagements occur.',
    uploadedFiles: [],
    comments: [
      {
        id: 'cmt-501',
        author: 'John Miller',
        role: 'Distributor',
        timestamp: '2026-07-29 11:00:00',
        message: 'N/A confirmation provided with mandatory compliance statement.'
      }
    ],
    lastUpdated: '2026-07-29 11:00:00'
  },
  {
    id: 'iir-5.2',
    refNumber: '5.2',
    category: 'Healthcare Professional Interactions',
    categoryNumber: 5,
    title: 'Fees Paid',
    description: 'Itemized record of honoraria, consulting fees, or service fees paid to HCPs or medical institutions.',
    isMandatory: false,
    allowedFileTypes: ['Excel', 'PDF'],
    maxSizeMB: 15,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'No HCP fee payments made during audit period.',
    noUploadExplanation: '',
    uploadedFiles: [],
    comments: [],
    lastUpdated: '2026-07-29 11:05:00'
  },
  {
    id: 'iir-5.3',
    refNumber: '5.3',
    category: 'Healthcare Professional Interactions',
    categoryNumber: 5,
    title: 'Conferences',
    description: 'Listing of medical conferences, symposia, or trade shows sponsored or attended.',
    isMandatory: false,
    allowedFileTypes: ['Excel', 'PDF'],
    maxSizeMB: 20,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'Commercial electronics trade show list attached (CES 2026 & InfoComm).',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-503',
        evidenceId: 'EVD-503-CONF',
        fileName: 'TradeShows_Attended_FY26.pdf',
        fileSizeMB: 1.1,
        fileType: 'PDF',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-07-30 13:00:00',
        version: 1,
        hash: '6c3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f',
        status: 'Accepted'
      }
    ],
    comments: [],
    lastUpdated: '2026-07-30 13:00:00'
  },
  {
    id: 'iir-5.4',
    refNumber: '5.4',
    category: 'Healthcare Professional Interactions',
    categoryNumber: 5,
    title: 'Sponsorships',
    description: 'List of educational grants, charitable sponsorships, or organizational funding provided.',
    isMandatory: false,
    allowedFileTypes: ['Excel', 'PDF'],
    maxSizeMB: 15,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'Annual local STEM education foundation sponsorship ($10,000).',
    noUploadExplanation: '',
    uploadedFiles: [],
    comments: [],
    lastUpdated: '2026-07-30 13:15:00'
  },
  {
    id: 'iir-5.5',
    refNumber: '5.5',
    category: 'Healthcare Professional Interactions',
    categoryNumber: 5,
    title: 'Grants',
    description: 'Documentation for research grants or clinical trials funding provided to institutional partners.',
    isMandatory: false,
    allowedFileTypes: ['PDF'],
    maxSizeMB: 20,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'Nil grants disbursed.',
    noUploadExplanation: '',
    uploadedFiles: [],
    comments: [],
    lastUpdated: '2026-07-30 13:20:00'
  },
  {
    id: 'iir-5.6',
    refNumber: '5.6',
    category: 'Healthcare Professional Interactions',
    categoryNumber: 5,
    title: 'Clinical Studies',
    description: 'Register of clinical study agreements, principal investigator contracts, and IRB approvals.',
    isMandatory: false,
    allowedFileTypes: ['PDF'],
    maxSizeMB: 20,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'Nil clinical study engagements.',
    noUploadExplanation: '',
    uploadedFiles: [],
    comments: [],
    lastUpdated: '2026-07-30 13:25:00'
  },
  {
    id: 'iir-5.7',
    refNumber: '5.7',
    category: 'Healthcare Professional Interactions',
    categoryNumber: 5,
    title: 'Free Products',
    description: 'Log of free sample product dispatches, promotional demo units, and customer evaluation stock.',
    isMandatory: true,
    allowedFileTypes: ['Excel', 'CSV'],
    maxSizeMB: 20,
    status: 'Completed',
    reviewerStatus: 'Pending Review',
    textResponse: 'Demo units log dispatches for retail showroom floor display units.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-507',
        evidenceId: 'EVD-507-FPD',
        fileName: 'Showroom_Demo_Units_Dispatch_Log.xlsx',
        fileSizeMB: 1.4,
        fileType: 'Excel',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-08-01 07:50:00',
        version: 1,
        hash: '7d4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a',
        status: 'Uploaded'
      }
    ],
    comments: [],
    lastUpdated: '2026-08-01 07:50:00'
  },

  // CATEGORY 6: Other Information
  {
    id: 'iir-6.1',
    refNumber: '6.1',
    category: 'Other Information',
    categoryNumber: 6,
    title: 'Additional Relevant Documents',
    description: 'Any additional workpapers, internal audit reports, or third-party compliance assessments.',
    isMandatory: false,
    allowedFileTypes: ['PDF', 'ZIP'],
    maxSizeMB: 50,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'ISO 9001 quality audit certificate attached.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-601',
        evidenceId: 'EVD-601-ISO',
        fileName: 'ISO_9001_Compliance_Certificate.pdf',
        fileSizeMB: 1.9,
        fileType: 'PDF',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-07-31 17:00:00',
        version: 1,
        hash: '8e5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b',
        status: 'Accepted'
      }
    ],
    comments: [],
    lastUpdated: '2026-07-31 17:00:00'
  },
  {
    id: 'iir-6.2',
    refNumber: '6.2',
    category: 'Other Information',
    categoryNumber: 6,
    title: 'Government Employee Payments',
    description: 'Declaration of any payments, gifts, or travel accommodation provided to government officials or public servants.',
    isMandatory: true,
    allowedFileTypes: ['PDF', 'Excel'],
    maxSizeMB: 15,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'Nil government official payment declaration certified by Compliance Officer.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-602',
        evidenceId: 'EVD-602-DEC',
        fileName: 'Nil_Govt_Payment_Compliance_Declaration.pdf',
        fileSizeMB: 0.8,
        fileType: 'PDF',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-08-01 08:10:00',
        version: 1,
        hash: '9f6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c',
        status: 'Accepted'
      }
    ],
    comments: [],
    lastUpdated: '2026-08-01 08:10:00'
  },
  {
    id: 'iir-6.3',
    refNumber: '6.3',
    category: 'Other Information',
    categoryNumber: 6,
    title: 'Related Employees',
    description: 'Declaration of employees who have immediate family members or relatives employed by government agencies or client companies.',
    isMandatory: true,
    allowedFileTypes: ['PDF', 'Excel'],
    maxSizeMB: 15,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'Annual conflict of interest disclosure register uploaded.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-603',
        evidenceId: 'EVD-603-COI',
        fileName: 'Conflict_Of_Interest_Register_FY26.pdf',
        fileSizeMB: 1.3,
        fileType: 'PDF',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-08-01 08:20:00',
        version: 1,
        hash: '0a7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d',
        status: 'Accepted'
      }
    ],
    comments: [],
    lastUpdated: '2026-08-01 08:20:00'
  },
  {
    id: 'iir-6.4',
    refNumber: '6.4',
    category: 'Other Information',
    categoryNumber: 6,
    title: 'Government Legal Proceedings',
    description: 'Disclosure of active or pending civil litigation involving government bodies or regulatory authorities.',
    isMandatory: true,
    allowedFileTypes: ['PDF'],
    maxSizeMB: 20,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'General Counsel certification confirming no active government litigation exists.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-604',
        evidenceId: 'EVD-604-LIT',
        fileName: 'Legal_Counsel_Litigation_Certification.pdf',
        fileSizeMB: 0.9,
        fileType: 'PDF',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-08-01 08:40:00',
        version: 1,
        hash: '1b8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e',
        status: 'Accepted'
      }
    ],
    comments: [],
    lastUpdated: '2026-08-01 08:40:00'
  },
  {
    id: 'iir-6.5',
    refNumber: '6.5',
    category: 'Other Information',
    categoryNumber: 6,
    title: 'Criminal Investigations',
    description: 'Disclosure of any criminal proceedings, fraud investigations, or regulatory sanctions involving key executives or board members.',
    isMandatory: true,
    allowedFileTypes: ['PDF'],
    maxSizeMB: 20,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'Executive background check and criminal disclosure clearance statement.',
    noUploadExplanation: '',
    uploadedFiles: [
      {
        id: 'file-605',
        evidenceId: 'EVD-605-CRM',
        fileName: 'Executive_Clean_Record_Clearance.pdf',
        fileSizeMB: 1.0,
        fileType: 'PDF',
        uploadedBy: 'John Miller (Distributor Admin)',
        uploadDate: '2026-08-01 08:50:00',
        version: 1,
        hash: '2c9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f',
        status: 'Accepted'
      }
    ],
    comments: [],
    lastUpdated: '2026-08-01 08:50:00'
  },
  {
    id: 'iir-6.6',
    refNumber: '6.6',
    category: 'Other Information',
    categoryNumber: 6,
    title: 'Annual Anti-Bribery Compliance Confirmation',
    description: 'Has all distributor personnel interacting with healthcare professionals completed mandatory annual Anti-Bribery & Corruption training in FY26?',
    isMandatory: true,
    isYesNoOnly: true,
    responseType: 'Yes/No Only',
    allowedFileTypes: [],
    maxSizeMB: 0,
    status: 'Completed',
    reviewerStatus: 'Accepted',
    textResponse: 'Yes',
    noUploadExplanation: '',
    uploadedFiles: [],
    comments: [],
    lastUpdated: '2026-08-01 09:00:00'
  },
  {
    id: 'iir-6.7',
    refNumber: '6.7',
    category: 'Other Information',
    categoryNumber: 6,
    title: 'Cross-Border Sales & International Distribution Disclosure',
    description: 'Do you have sales operations, product distribution, or customer transactions outside the primary registration country?',
    isMandatory: true,
    questionType: 'yes_no_conditional',
    allowDocumentUpload: false,
    allowTextResponse: false,
    allowedFileTypes: ['PDF', 'XLSX'],
    maxSizeMB: 25,
    status: 'Pending',
    reviewerStatus: 'Pending Review',
    textResponse: '',
    noUploadExplanation: '',
    uploadedFiles: [],
    comments: [],
    conditionalRules: {
      yesSubQuestions: [
        {
          id: 'sub-6.7-1a',
          refCode: '1A',
          title: 'Target Export Countries / Territories',
          description: 'List all foreign countries or territories where products are sold or distributed.',
          responseFormat: 'text',
          isMandatory: true
        },
        {
          id: 'sub-6.7-1b',
          refCode: '1B',
          title: 'Primary Foreign Sales Channel',
          description: 'Select the primary model used for international distribution.',
          responseFormat: 'dropdown',
          options: ['Direct Cross-Border Sales', 'Local Sub-Distributors', 'Authorized Agents / Brokers', 'E-commerce / Digital Fulfillment', 'Joint Venture Entity'],
          isMandatory: true
        },
        {
          id: 'sub-6.7-1c',
          refCode: '1C',
          title: 'Estimated Foreign Sales Volume (USD / Year)',
          description: 'Provide approximate annual revenue generated from foreign sales in USD.',
          responseFormat: 'number',
          isMandatory: true
        },
        {
          id: 'sub-6.7-1d',
          refCode: '1D',
          title: 'International Customs & Export Clearance Certificate',
          description: 'Upload valid export compliance, tariff classification, or customs declaration proof.',
          responseFormat: 'file',
          isMandatory: true
        }
      ],
      noSubQuestions: [
        {
          id: 'sub-6.7-1e',
          refCode: '1E',
          title: 'Domestic Coverage Regions',
          description: 'Specify the domestic states or provinces covered by your local sales network.',
          responseFormat: 'text',
          isMandatory: true
        },
        {
          id: 'sub-6.7-1f',
          refCode: '1F',
          title: 'Domestic Trade License / Certificate',
          description: 'Upload your active domestic commerce registration certificate.',
          responseFormat: 'file',
          isMandatory: false
        }
      ]
    },
    subQuestionResponses: {},
    lastUpdated: '2026-08-01 09:15:00'
  }
];

export const INITIAL_IIR_AUDIT_TRAIL: IIRAuditTrail[] = [
  {
    id: 'trl-101',
    action: 'Login',
    user: 'John Miller (Distributor Admin)',
    role: 'Distributor',
    timestamp: '2026-08-01 07:30:12',
    ipAddress: '192.168.1.104 (Authenticated SSO)',
    details: 'Logged into Data360 Initial Information Request Portal'
  },
  {
    id: 'trl-102',
    action: 'File Uploaded',
    user: 'John Miller (Distributor Admin)',
    role: 'Distributor',
    timestamp: '2026-08-01 09:00:15',
    ipAddress: '192.168.1.104',
    details: 'Uploaded Debit_Notes_Register_FY26.xlsx (4.8 MB) for Request 2.6'
  },
  {
    id: 'trl-103',
    action: 'Response Edited',
    user: 'John Miller (Distributor Admin)',
    role: 'Distributor',
    timestamp: '2026-08-01 10:15:00',
    ipAddress: '192.168.1.104',
    details: 'Updated response text and uploaded AP GL extract for Request 2.7'
  },
  {
    id: 'trl-104',
    action: 'Draft Saved',
    user: 'John Miller (Distributor Admin)',
    role: 'Distributor',
    timestamp: '2026-08-01 10:25:40',
    ipAddress: '192.168.1.104',
    details: 'Saved draft version v1.4 with 29 of 31 items completed'
  },
  {
    id: 'trl-105',
    action: 'Review Status Updated',
    user: 'Sarah Jenkins (Audit Lead)',
    role: 'Auditor',
    timestamp: '2026-08-01 11:10:05',
    ipAddress: '10.0.4.18',
    details: 'Marked Request 2.4 as Clarification Required with reviewer comment'
  }
];
