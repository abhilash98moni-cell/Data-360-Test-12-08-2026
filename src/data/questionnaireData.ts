export interface QuestionnaireQuestionDefinition {
  id: string;
  sectionId: string;
  questionNumber: string;
  questionText: string;
  guidance?: string;
  responseType: 'text' | 'long_text' | 'yes_no' | 'yes_no_details' | 'choice';
  options?: string[];
  isRequired: boolean;
  allowAttachment: boolean;
  suggestedAttachmentType?: string;
  linkedIRLRef?: string;
  displayOrder: number;
}

export interface QuestionnaireSectionDefinition {
  id: string;
  sectionNumber: number;
  title: string;
  shortTitle: string;
  description: string;
  displayOrder: number;
  questions: QuestionnaireQuestionDefinition[];
}

export const BUSINESS_QUESTIONNAIRE_SECTIONS: QuestionnaireSectionDefinition[] = [
  // SECTION 1: Introduction
  {
    id: 'sec-intro',
    sectionNumber: 1,
    title: 'Introduction & Entity Profile',
    shortTitle: 'Introduction',
    description: 'General organizational background, governance profile, and authorized representative details for the audit period.',
    displayOrder: 1,
    questions: [
      {
        id: 'q-1.1',
        sectionId: 'sec-intro',
        questionNumber: '1.1',
        questionText: 'Please state the legal entity name, corporate registration number, registered address, and primary operating jurisdictions of the distributor.',
        guidance: 'Include any parent entities, subsidiary trading arms, or affiliated trading companies involved in product distribution.',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Certificate of Incorporation / Trade License',
        linkedIRLRef: '1.2',
        displayOrder: 1
      },
      {
        id: 'q-1.2',
        sectionId: 'sec-intro',
        questionNumber: '1.2',
        questionText: 'Identify the principal contact person(s) responding to this questionnaire, including their full name, official title, department, contact email, and telephone number.',
        guidance: 'Confirm whether the respondent has formal signing authority on behalf of executive leadership.',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 2
      },
      {
        id: 'q-1.3',
        sectionId: 'sec-intro',
        questionNumber: '1.3',
        questionText: 'Confirm the scope of products, territories, and business lines distributed under the authorized distribution agreement for the audit period.',
        guidance: 'Detail exclusive vs non-exclusive territory assignments and designated product categories.',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Executed Distribution Agreement',
        linkedIRLRef: '1.3',
        displayOrder: 3
      }
    ]
  },

  // SECTION 2: Awareness of Anti-Bribery and Anti-Corruption Policies
  {
    id: 'sec-abac',
    sectionNumber: 2,
    title: 'Awareness of Anti-Bribery and Anti-Corruption Policies',
    shortTitle: 'Anti-Bribery & Corruption',
    description: 'Assessment of anti-bribery policies, employee compliance training, and formal ethical standards.',
    displayOrder: 2,
    questions: [
      {
        id: 'q-2.1',
        sectionId: 'sec-abac',
        questionNumber: '2.1',
        questionText: 'Does your organization maintain a written Anti-Bribery, Anti-Corruption (ABAC), or Code of Conduct policy applicable to all officers, employees, and third-party contractors?',
        guidance: 'If Yes, provide details on the date of last review and attach a copy of the written policy.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Written ABAC Policy / Code of Conduct',
        linkedIRLRef: '1.5',
        displayOrder: 1
      },
      {
        id: 'q-2.2',
        sectionId: 'sec-abac',
        questionNumber: '2.2',
        questionText: 'Are all employees, especially commercial, sales, and logistics personnel, required to undergo periodic anti-corruption and ethics training?',
        guidance: 'Describe the frequency of training, curriculum covered, and completion tracking mechanisms.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Training Logs & Attendance Records',
        displayOrder: 2
      },
      {
        id: 'q-2.3',
        sectionId: 'sec-abac',
        questionNumber: '2.3',
        questionText: 'Has your organization formally acknowledged and agreed to adhere to the Principal’s Supplier Code of Conduct and Anti-Corruption standards?',
        guidance: 'Provide the date of the latest formal sign-off or contractual undertaking.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Signed Code of Conduct Acknowledgment',
        displayOrder: 3
      }
    ]
  },

  // SECTION 3: Tone at the Top
  {
    id: 'sec-tone',
    sectionNumber: 3,
    title: 'Tone at the Top & Governance Oversight',
    shortTitle: 'Tone at the Top',
    description: 'Executive management commitment to ethical business practices, compliance resources, and internal reporting channels.',
    displayOrder: 3,
    questions: [
      {
        id: 'q-3.1',
        sectionId: 'sec-tone',
        questionNumber: '3.1',
        questionText: 'How does executive leadership communicate its zero-tolerance commitment towards bribery, kickbacks, and corrupt business practices to staff and commercial partners?',
        guidance: 'Describe executive communications, town hall addresses, or written memorandums circulated during the year.',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Executive Compliance Communications',
        displayOrder: 1
      },
      {
        id: 'q-3.2',
        sectionId: 'sec-tone',
        questionNumber: '3.2',
        questionText: 'Does your organization have a designated Compliance Officer, Legal Counsel, or independent committee responsible for overseeing anti-bribery governance and ethics?',
        guidance: 'State the name, title, and reporting line of the designated individual or committee.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 2
      },
      {
        id: 'q-3.3',
        sectionId: 'sec-tone',
        questionNumber: '3.3',
        questionText: 'Is there a secure, confidential whistleblowing mechanism or hotline available for employees and partners to report suspected unethical behavior without fear of retaliation?',
        guidance: 'Provide details on how reports are received, logged, and investigated independently.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Whistleblower Policy & Reporting Channel Details',
        displayOrder: 3
      },
      {
        id: 'q-3.4',
        sectionId: 'sec-tone',
        questionNumber: '3.4',
        questionText: 'How frequently does senior leadership or the Board of Directors review compliance risk assessments, internal audit findings, and ethics reports?',
        guidance: 'Indicate whether compliance is a standing agenda item in board or management committee meetings.',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 4
      },
      {
        id: 'q-3.5',
        sectionId: 'sec-tone',
        questionNumber: '3.5',
        questionText: 'Have any disciplinary actions, terminations, or formal sanctions been imposed on employees or contractors for ethics or policy breaches during the past 24 months?',
        guidance: 'If Yes, summarize the nature of the breach, investigation outcome, and corrective actions taken (anonymized).',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 5
      }
    ]
  },

  // SECTION 4: Dealings and relationships with and payments to Government Officials
  {
    id: 'sec-gov',
    sectionNumber: 4,
    title: 'Dealings, Relationships with, and Payments to Government Officials',
    shortTitle: 'Government Officials',
    description: 'Interactions, regulatory permits, customs clearances, and relationships involving government entities or public officials.',
    displayOrder: 4,
    questions: [
      {
        id: 'q-4.1',
        sectionId: 'sec-gov',
        questionNumber: '4.1',
        questionText: 'Does your organization interact with Government Officials, State-Owned Enterprises (SOEs), public healthcare institutions, or regulatory bodies in connection with the Principal’s products?',
        guidance: 'Specify the government bodies, departments, or public agencies routinely engaged.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 1
      },
      {
        id: 'q-4.2',
        sectionId: 'sec-gov',
        questionNumber: '4.2',
        questionText: 'Do any current shareholders, directors, executive officers, or key commercial personnel hold positions as Government Officials or have close family ties to public officials?',
        guidance: 'If Yes, provide details of the individuals, official positions held, and conflict of interest mitigation measures.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Conflict of Interest Disclosure Form',
        displayOrder: 2
      },
      {
        id: 'q-4.3',
        sectionId: 'sec-gov',
        questionNumber: '4.3',
        questionText: 'Do you engage third-party clearing agents, freight forwarders, or liaison consultants to obtain government licenses, import permits, product registrations, or customs clearances?',
        guidance: 'List all such third-party intermediaries and confirm whether written contracts and anti-bribery covenants are in place.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Customs & Clearance Intermediary List',
        linkedIRLRef: '1.4',
        displayOrder: 3
      },
      {
        id: 'q-4.4',
        sectionId: 'sec-gov',
        questionNumber: '4.4',
        questionText: 'Has your organization made any facilitation, expediting, or grease payments to public officials to accelerate routine administrative or regulatory processes?',
        guidance: 'Detail your organization’s policy strictly prohibiting facilitation payments.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 4
      },
      {
        id: 'q-4.5',
        sectionId: 'sec-gov',
        questionNumber: '4.5',
        questionText: 'Have any gifts, meals, entertainment, travel sponsorships, or conference hospitality been provided to Government Officials or employees of state-owned entities during the audit period?',
        guidance: 'If Yes, list all instances, official recipients, business justification, values, and formal pre-approvals.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Government Hospitality Log & Pre-Approvals',
        linkedIRLRef: '5.1',
        displayOrder: 5
      },
      {
        id: 'q-4.6',
        sectionId: 'sec-gov',
        questionNumber: '4.6',
        questionText: 'Has your organization made any political contributions, donations to political parties, or sponsored events associated with public officials during the last 3 years?',
        guidance: 'If Yes, provide dates, amounts, recipient entities, and executive approval records.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Donations & Political Contribution Register',
        displayOrder: 6
      },
      {
        id: 'q-4.7',
        sectionId: 'sec-gov',
        questionNumber: '4.7',
        questionText: 'Describe the internal approval process required prior to engaging with public officials, submitting bids to government entities, or entering public procurement contracts.',
        guidance: 'Detail thresholds, required executive sign-offs, and compliance verification checkpoints.',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 7
      }
    ]
  },

  // SECTION 5: Public Tenders
  {
    id: 'sec-tenders',
    sectionNumber: 5,
    title: 'Public Tenders & Government Procurement',
    shortTitle: 'Public Tenders',
    description: 'Participation in government tenders, public bidding processes, and procurement compliance controls.',
    displayOrder: 5,
    questions: [
      {
        id: 'q-5.1',
        sectionId: 'sec-tenders',
        questionNumber: '5.1',
        questionText: 'Did your organization participate in, submit bids for, or execute contracts under any public tenders or government procurement frameworks involving the Principal’s products during the audit period?',
        guidance: 'If Yes, provide a comprehensive list of tenders submitted, tender IDs, contract values, winning bid status, use of consortium partners or sub-contractors, and confirm compliance with public integrity pacts.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Public Tender Register & Bid Submissions',
        linkedIRLRef: '3.1',
        displayOrder: 1
      }
    ]
  },

  // SECTION 6: Third Party Business Relationships
  {
    id: 'sec-thirdparty',
    sectionNumber: 6,
    title: 'Third Party Business Relationships & Intermediaries',
    shortTitle: 'Third Party Relationships',
    description: 'Due diligence, contractual oversight, and risk management across customers, sub-dealers, agents, JV partners, and vendors.',
    displayOrder: 6,
    questions: [
      // Sub-topic: Customer Relationships
      {
        id: 'q-6.1',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.1',
        questionText: 'Describe the process for onboarding new commercial customers and performing Know-Your-Customer (KYC) / anti-money laundering checks.',
        guidance: 'Include credit checks, identity verification, and sanctions screening procedures.',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'KYC & Customer Onboarding Standard Operating Procedure',
        linkedIRLRef: '2.1',
        displayOrder: 1
      },
      {
        id: 'q-6.2',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.2',
        questionText: 'Are any customer accounts granted special off-invoice discounts, rebates, or retrospective volume incentives outside standard published commercial terms?',
        guidance: 'If Yes, detail the approval authority, governance rationale, and credit memo issuance process.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Special Pricing Approval Records & Credit Notes',
        linkedIRLRef: '3.2',
        displayOrder: 2
      },
      {
        id: 'q-6.3',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.3',
        questionText: 'Have you identified any instances where customers requested payments or shipments to be directed to third-party bank accounts or offshore jurisdictions?',
        guidance: 'Detail how such requests are flagged, investigated, and rejected.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 3
      },
      {
        id: 'q-6.4',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.4',
        questionText: 'Do you maintain formal written sales contracts with your top 20 revenue-generating customers?',
        guidance: 'Specify standard contract duration, termination clauses, and anti-corruption covenants.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 4
      },

      // Sub-topic: Dealers & Sub-Distributors
      {
        id: 'q-6.5',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.5',
        questionText: 'Do you utilize secondary dealers, sub-distributors, or authorized resellers to distribute the Principal’s products within your assigned territory?',
        guidance: 'If Yes, list all active sub-dealers and confirm whether prior written authorization was obtained from the Principal.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Sub-Distributor Roster & Principal Authorizations',
        linkedIRLRef: '1.4',
        displayOrder: 5
      },
      {
        id: 'q-6.6',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.6',
        questionText: 'Describe the due diligence screening conducted prior to appointing any sub-distributor or dealer.',
        guidance: 'Detail background checks, beneficial ownership identification, and reputational screening.',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Due Diligence Checklist & Screening Evidence',
        displayOrder: 6
      },
      {
        id: 'q-6.7',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.7',
        questionText: 'Do all sub-dealer contracts incorporate mandatory anti-bribery provisions, right-to-audit clauses, and compliance termination rights?',
        guidance: 'Attach a standard executed sub-dealer agreement template showing compliance clauses.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Standard Sub-Dealer Agreement Template',
        displayOrder: 7
      },
      {
        id: 'q-6.8',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.8',
        questionText: 'How do you monitor sub-dealers for compliance with resale pricing guidelines, territorial restrictions, and ethical standards?',
        guidance: 'Describe audit routines, inspection visits, or mystery shopping programs conducted.',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 8
      },
      {
        id: 'q-6.9',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.9',
        questionText: 'Have any sub-dealers been terminated during the past 24 months due to non-performance, unauthorized discounting, or compliance concerns?',
        guidance: 'If Yes, explain the circumstances and documentation of termination.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 9
      },

      // Sub-topic: Agents, JV Partners & Sub-Contractors
      {
        id: 'q-6.10',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.10',
        questionText: 'Do you engage sales agents, commission brokers, business development representatives, or joint-venture partners to assist in marketing or sales?',
        guidance: 'If Yes, specify the basis of compensation (e.g., fixed fee, percentage commission, success fees).',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Agent & Broker Commission Agreements',
        linkedIRLRef: '4.1',
        displayOrder: 10
      },
      {
        id: 'q-6.11',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.11',
        questionText: 'How is the commercial justification and fair market value for agent commission rates or intermediary success fees determined and documented?',
        guidance: 'Detail benchmark analyses and executive sign-off procedures.',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 11
      },
      {
        id: 'q-6.12',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.12',
        questionText: 'Are detailed activity reports, deliverables, and proof of legitimate services required prior to releasing commission payments to sales agents?',
        guidance: 'Describe the payment verification workflow and invoice matching controls.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Agent Activity Reports & Payment Proof',
        displayOrder: 12
      },
      {
        id: 'q-6.13',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.13',
        questionText: 'Are any sales agents or intermediaries compensated via cash payments, bearer checks, or wire transfers to accounts outside their country of residence/operation?',
        guidance: 'Confirm that all payments are executed exclusively to verified corporate banking channels.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 13
      },
      {
        id: 'q-6.14',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.14',
        questionText: 'Do any agents, brokers, or joint-venture partners have affiliation with public procurement officials or healthcare professionals in target accounts?',
        guidance: 'If Yes, provide details of disclosures made and mitigation protocols.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 14
      },

      // Sub-topic: Consultants, Logistics & Vendors
      {
        id: 'q-6.15',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.15',
        questionText: 'What procurement controls are enforced for selecting, vetting, and approving third-party vendors, marketing agencies, and consultants?',
        guidance: 'Detail supplier onboarding forms, three-way matching of PO-GRN-Invoice, and approval limits.',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Vendor Management & Procurement Policy',
        linkedIRLRef: '4.2',
        displayOrder: 15
      },
      {
        id: 'q-6.16',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.16',
        questionText: 'Are third-party logistics providers (3PLs) and warehousing partners audited for inventory integrity, security, and traceability of serial/batch numbers?',
        guidance: 'Provide the date of the last third-party warehouse physical inventory count.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Warehouse Audit & Inventory Count Sheets',
        linkedIRLRef: '6.1',
        displayOrder: 16
      },
      {
        id: 'q-6.17',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.17',
        questionText: 'Have you retained any external advisors, lobbyists, or government affairs consultants during the audit period?',
        guidance: 'If Yes, list the consultants, scope of mandate, contract values, and deliverables.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Lobbying & Advisory Engagement Contracts',
        displayOrder: 17
      },
      {
        id: 'q-6.18',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.18',
        questionText: 'Do vendor contracts require supplier adherence to environmental, social, anti-forced-labor, and governance standards?',
        guidance: 'Summarize supplier code of conduct requirements.',
        responseType: 'yes_no_details',
        isRequired: false,
        allowAttachment: false,
        displayOrder: 18
      },
      {
        id: 'q-6.19',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.19',
        questionText: 'Are vendor master files periodically scrubbed to identify duplicate bank accounts, shared addresses with employees, or inactive vendor accounts?',
        guidance: 'Detail vendor master file review frequency and control owners.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 19
      },
      {
        id: 'q-6.20',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.20',
        questionText: 'Describe the process for resolving invoice disputes, billing discrepancies, or credit claims with suppliers and logistics partners.',
        guidance: 'Include escalation paths and credit memo approval controls.',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 20
      },
      {
        id: 'q-6.21',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.21',
        questionText: 'Are sole-source or single-bid vendor awards subject to enhanced executive justification and dual sign-off?',
        guidance: 'Specify threshold limits for competitive bidding requirements.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 21
      },
      {
        id: 'q-6.22',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.22',
        questionText: 'Do you conduct periodic background re-screening or sanction checks on active third parties throughout the lifecycle of the business relationship?',
        guidance: 'State the frequency of automated or manual sanctions watchlist screening.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 22
      },
      {
        id: 'q-6.23',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.23',
        questionText: 'Are any third-party service providers located in high-risk jurisdictions or jurisdictions subject to international trade sanctions or FATF gray lists?',
        guidance: 'If Yes, list entities and enhanced due diligence measures.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 23
      },
      {
        id: 'q-6.24',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.24',
        questionText: 'Describe how electronic signatures, digital contracts, and master service agreements are archived and protected against unauthorized alterations.',
        guidance: 'Indicate system tools used (e.g., DocuSign, Adobe Sign, ERP DMS).',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 24
      },
      {
        id: 'q-6.25',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.25',
        questionText: 'Have any third parties refused to sign anti-bribery representations or refused audit rights during contract negotiations?',
        guidance: 'If Yes, explain how the business risk was escalated and resolved.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 25
      },
      {
        id: 'q-6.26',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.26',
        questionText: 'Are purchase orders systematically generated and approved BEFORE goods are dispatched or services are rendered by third parties (no retroactive POs)?',
        guidance: 'Detail retroactive PO exception rates and executive approval rules.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 26
      },
      {
        id: 'q-6.27',
        sectionId: 'sec-thirdparty',
        questionNumber: '6.27',
        questionText: 'Provide a summary of the total expenditure incurred across all third-party marketing, consulting, and liaison intermediaries during the audit period.',
        guidance: 'Include total spend, top 5 recipients by value, and description of primary services provided.',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Intermediary Spend Schedule & General Ledger Summary',
        linkedIRLRef: '4.3',
        displayOrder: 27
      }
    ]
  },

  // SECTION 7: Marketing and Sales Expenses; Travel, Entertainment, Gifts
  {
    id: 'sec-marketing',
    sectionNumber: 7,
    title: 'Marketing, Travel, Entertainment, Gifts & Hospitality',
    shortTitle: 'Marketing & T&E',
    description: 'Promotional spending, event sponsorships, customer travel hospitality, gift registers, and reimbursement policies.',
    displayOrder: 7,
    questions: [
      {
        id: 'q-7.1',
        sectionId: 'sec-marketing',
        questionNumber: '7.1',
        questionText: 'Does your organization maintain a written Travel & Entertainment (T&E) and Gifts & Hospitality policy with explicit monetary threshold limits?',
        guidance: 'Specify threshold limits per occurrence and annual aggregate limits per recipient.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Written T&E & Hospitality Policy',
        linkedIRLRef: '5.1',
        displayOrder: 1
      },
      {
        id: 'q-7.2',
        sectionId: 'sec-marketing',
        questionNumber: '7.2',
        questionText: 'Is a centralized Gift and Hospitality Register maintained to record all gifts, meals, and event invitations provided to or received from customers and commercial partners?',
        guidance: 'Attach the Gift and Hospitality Register covering the audit period.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Gift & Hospitality Register',
        linkedIRLRef: '5.2',
        displayOrder: 2
      },
      {
        id: 'q-7.3',
        sectionId: 'sec-marketing',
        questionNumber: '7.3',
        questionText: 'Are itemized receipts, proof of payment, and explicit business justifications required for all expense reimbursement claims submitted by sales and executive personnel?',
        guidance: 'Detail policy on credit card statement receipts versus itemized tax invoices.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 3
      },
      {
        id: 'q-7.4',
        sectionId: 'sec-marketing',
        questionNumber: '7.4',
        questionText: 'Have you sponsored customer trips, international travel, accommodation, or conference attendance for key decision-makers during the audit period?',
        guidance: 'If Yes, list events, sponsored individuals, hotel/airfare costs, and formal approvals.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Customer Travel Sponsorship Schedule',
        displayOrder: 4
      },
      {
        id: 'q-7.5',
        sectionId: 'sec-marketing',
        questionNumber: '7.5',
        questionText: 'Do you ensure that no personal side-trips, companion/spouse travel, or leisure entertainment (e.g., golf outings, luxury sporting events) are funded by company expense?',
        guidance: 'Describe controls preventing reimbursement of unauthorized personal leisure expenses.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 5
      },
      {
        id: 'q-7.6',
        sectionId: 'sec-marketing',
        questionNumber: '7.6',
        questionText: 'How are Marketing Development Funds (MDF) or co-op advertising allowances claimed from the Principal allocated, tracked, and verified against proof of performance?',
        guidance: 'Provide reconciliation sheets and sample proof of execution (tear sheets, photos, event logs).',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'MDF Reconciliation & Proof of Performance Dossier',
        linkedIRLRef: '5.3',
        displayOrder: 6
      },
      {
        id: 'q-7.7',
        sectionId: 'sec-marketing',
        questionNumber: '7.7',
        questionText: 'Are marketing allowances, trade rebates, or promotional discounts paid directly in cash or transferred to personal accounts of customer executives?',
        guidance: 'Confirm whether all rebates are applied strictly as credit notes against customer commercial accounts.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 7
      },
      {
        id: 'q-7.8',
        sectionId: 'sec-marketing',
        questionNumber: '7.8',
        questionText: 'Have you organized any medical education symposiums, professional workshops, or dealer award banquets during the audit period?',
        guidance: 'If Yes, list event locations, attendee lists, speaker honorariums paid, and venue invoices.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Symposium & Event Documentation Package',
        displayOrder: 8
      },
      {
        id: 'q-7.9',
        sectionId: 'sec-marketing',
        questionNumber: '7.9',
        questionText: 'What criteria and fair-market-value benchmarks are used to determine speaker fees, consultancy honorariums, or advisory board stipends paid to industry experts?',
        guidance: 'Detail written agreements and documentation of actual services performed.',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Speaker Fair Market Value Guidelines & Contracts',
        displayOrder: 9
      },
      {
        id: 'q-7.10',
        sectionId: 'sec-marketing',
        questionNumber: '7.10',
        questionText: 'Are corporate credit cards issued to employees? If Yes, describe the monthly reconciliation, review, and dual-approval workflow for corporate card statements.',
        guidance: 'State the number of active cardholders and disciplinary policy for non-receipted items.',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 10
      },
      {
        id: 'q-7.11',
        sectionId: 'sec-marketing',
        questionNumber: '7.11',
        questionText: 'Are high-value seasonal gifts (e.g., festival gift hampers, consumer electronics, vouchers) prohibited or restricted to nominal promotional items bearing the corporate logo?',
        guidance: 'Specify rules governing gift cards, cash equivalents, and brand merchandise.',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 11
      },
      {
        id: 'q-7.12',
        sectionId: 'sec-marketing',
        questionNumber: '7.12',
        questionText: 'Have any charitable donations, academic scholarships, or community grants been funded during the audit period using corporate funds?',
        guidance: 'If Yes, attach the list of recipient non-profit organizations, registration verification, and approvals.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Charitable Donations & NGO Due Diligence Register',
        displayOrder: 12
      },
      {
        id: 'q-7.13',
        sectionId: 'sec-marketing',
        questionNumber: '7.13',
        questionText: 'Describe how sales sample inventory, demonstration units, and evaluation models are tracked from receipt to disposal or return.',
        guidance: 'Detail stock reconciliation controls to ensure demonstration units are not diverted or sold.',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Demonstration & Free Sample Movement Log',
        linkedIRLRef: '6.2',
        displayOrder: 13
      },
      {
        id: 'q-7.14',
        sectionId: 'sec-marketing',
        questionNumber: '7.14',
        questionText: 'Are employees prohibited from splitting expense claims or invoice submissions to circumvent internal delegation of authority approval thresholds?',
        guidance: 'Describe automated audit controls or sampling tests used to detect split expense claims.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 14
      },
      {
        id: 'q-7.15',
        sectionId: 'sec-marketing',
        questionNumber: '7.15',
        questionText: 'Provide a breakdown of total entertainment, customer dining, travel, and promotional expenses booked in the general ledger for the audit period.',
        guidance: 'Detail total amounts, percentage of revenue, and top 10 expense categories.',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'General Ledger T&E Expense Breakdown',
        displayOrder: 15
      }
    ]
  },

  // SECTION 8: Suspicious Payments
  {
    id: 'sec-suspicious',
    sectionNumber: 8,
    title: 'Suspicious Payments, Cash Controls & Banking Integrity',
    shortTitle: 'Suspicious Payments',
    description: 'Detection of off-book accounts, cash disbursements, circular transactions, and unauthorized bank accounts.',
    displayOrder: 8,
    questions: [
      {
        id: 'q-8.1',
        sectionId: 'sec-suspicious',
        questionNumber: '8.1',
        questionText: 'Does your organization maintain any unrecorded bank accounts, slush funds, off-balance-sheet reserves, or secret ledger accounts?',
        guidance: 'Confirm that 100% of financial transactions are captured in the official ERP / accounting general ledger.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 1
      },
      {
        id: 'q-8.2',
        sectionId: 'sec-suspicious',
        questionNumber: '8.2',
        questionText: 'Are cash disbursements or petty cash payments strictly capped at a predefined limit (e.g., under $250 / equivalent) with mandatory dual signature vouchers?',
        guidance: 'State the petty cash threshold and monthly volume of cash disbursements.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Petty Cash Policy & Reconciliation Log',
        displayOrder: 2
      },
      {
        id: 'q-8.3',
        sectionId: 'sec-suspicious',
        questionNumber: '8.3',
        questionText: 'Have any customer collections or commercial settlements been accepted in physical cash or bearer instruments during the audit period?',
        guidance: 'If Yes, detail the transactions, business justification, and banking deposit slips.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 3
      },
      {
        id: 'q-8.4',
        sectionId: 'sec-suspicious',
        questionNumber: '8.4',
        questionText: 'Are payments ever made to numbered bank accounts, accounts holding unverified beneficial ownership, or accounts in tax haven jurisdictions?',
        guidance: 'Confirm bank account validation controls before initiating wire disbursements.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 4
      },
      {
        id: 'q-8.5',
        sectionId: 'sec-suspicious',
        questionNumber: '8.5',
        questionText: 'Describe the controls enforced to prevent invoice tampering, duplicate invoice submissions, or modifications to vendor bank beneficiary details.',
        guidance: 'Detail callback verification protocols and segregation of duties in payment batch processing.',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 5
      },
      {
        id: 'q-8.6',
        sectionId: 'sec-suspicious',
        questionNumber: '8.6',
        questionText: 'Have you identified any transactions involving round-sum invoice amounts, vague descriptions (e.g., "special services", "consultancy fee"), or backdated invoices?',
        guidance: 'If Yes, explain how these entries were investigated by finance leadership.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 6
      },
      {
        id: 'q-8.7',
        sectionId: 'sec-suspicious',
        questionNumber: '8.7',
        questionText: 'Are monthly bank reconciliations prepared independently by finance staff and formally reviewed/approved by the Chief Financial Officer or Finance Controller?',
        guidance: 'Provide sample bank reconciliation statements for principal operating accounts.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Sample Approved Bank Reconciliations',
        linkedIRLRef: '2.2',
        displayOrder: 7
      },
      {
        id: 'q-8.8',
        sectionId: 'sec-suspicious',
        questionNumber: '8.8',
        questionText: 'Have any third-party factoring companies, invoice discounting agents, or unapproved lending facilities been utilized against receivables of the Principal’s products?',
        guidance: 'If Yes, provide agreements and authorization records.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 8
      },
      {
        id: 'q-8.9',
        sectionId: 'sec-suspicious',
        questionNumber: '8.9',
        questionText: 'Are manual journal entries affecting revenue, cost of goods sold, or distributor rebates subject to mandatory managerial review and explanatory supporting documentation?',
        guidance: 'Describe journal entry approval matrix and automated ERP audit logs.',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 9
      },
      {
        id: 'q-8.10',
        sectionId: 'sec-suspicious',
        questionNumber: '8.10',
        questionText: 'Confirm whether any internal investigations, forensic audits, or external fraud inquiries have uncovered suspicious financial flows during the past 3 years.',
        guidance: 'Provide high-level summary of findings and remediation steps enacted.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Investigation Summary & Remediation Documentation',
        displayOrder: 10
      }
    ]
  },

  // SECTION 9: Contract Compliance
  {
    id: 'sec-contract',
    sectionNumber: 9,
    title: 'Contract Compliance & Distribution Governance',
    shortTitle: 'Contract Compliance',
    description: 'Adherence to contractual terms, territorial exclusivity, minimum selling prices, inventory reporting, and audit covenants.',
    displayOrder: 9,
    questions: [
      {
        id: 'q-9.1',
        sectionId: 'sec-contract',
        questionNumber: '9.1',
        questionText: 'Have all sales of the Principal’s products been confined strictly to authorized geographic territories and customer categories specified in the executed agreement?',
        guidance: 'Address cross-border sales, parallel importation, and unauthorized territory diversion controls.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 1
      },
      {
        id: 'q-9.2',
        sectionId: 'sec-contract',
        questionNumber: '9.2',
        questionText: 'Are monthly/quarterly sell-out data, inventory balance reports, and customer sales statements submitted accurately and on time to the Principal?',
        guidance: 'Describe data extraction methods from your ERP to ensure accurate sell-out reporting.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Sample Periodic Sell-Out & Inventory Reports',
        linkedIRLRef: '3.3',
        displayOrder: 2
      },
      {
        id: 'q-9.3',
        sectionId: 'sec-contract',
        questionNumber: '9.3',
        questionText: 'Do you maintain minimum required inventory stock levels, proper climate-controlled storage conditions, and expiry-date management (FIFO/FEFO) for all products?',
        guidance: 'Detail warehouse temperature logs and inventory aging schedules.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Warehouse Temperature & Stock Aging Logs',
        linkedIRLRef: '6.1',
        displayOrder: 3
      },
      {
        id: 'q-9.4',
        sectionId: 'sec-contract',
        questionNumber: '9.4',
        questionText: 'Have you complied with all brand marketing guidelines, trademark usage rules, and packaging integrity standards mandated by the Principal?',
        guidance: 'Confirm that no repackaging, relabeling, or alterations to products or serial numbers occur.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 4
      },
      {
        id: 'q-9.5',
        sectionId: 'sec-contract',
        questionNumber: '9.5',
        questionText: 'Are all customer warranty claims, product returns, and defective unit replacements documented with diagnostic proofs and returned to the Principal in accordance with standard return authorization (RMA) procedures?',
        guidance: 'Provide the RMA log and replacement reconciliation summary for the year.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'RMA Log & Warranty Replacement Reconciliation',
        displayOrder: 5
      },
      {
        id: 'q-9.6',
        sectionId: 'sec-contract',
        questionNumber: '9.6',
        questionText: 'Confirm that your organization fully recognizes and cooperates with the audit and inspection rights granted to the Principal and its authorized independent audit representatives under the agreement.',
        guidance: 'Confirm full access to books, records, warehouses, and personnel for the conduct of this audit.',
        responseType: 'yes_no_details',
        isRequired: true,
        allowAttachment: false,
        displayOrder: 6
      }
    ]
  },

  // SECTION 10: Final questions
  {
    id: 'sec-final',
    sectionNumber: 10,
    title: 'Final Questions & Authorized Certification',
    shortTitle: 'Final Certification',
    description: 'Formal representation, certification of completeness, and declaration of truthfulness by authorized executive management.',
    displayOrder: 10,
    questions: [
      {
        id: 'q-10.1',
        sectionId: 'sec-final',
        questionNumber: '10.1',
        questionText: 'I hereby certify on behalf of the distributor that all statements, answers, and supporting documents provided in this Business Questionnaire are true, complete, and accurate to the best of my knowledge, and that no material facts, investigations, or financial anomalies have been withheld.',
        guidance: 'State full signatory name, executive title, company legal name, and date of completion.',
        responseType: 'long_text',
        isRequired: true,
        allowAttachment: true,
        suggestedAttachmentType: 'Signed Certification & Authority Declaration',
        displayOrder: 1
      }
    ]
  }
];

export const TOTAL_BUSINESS_QUESTIONNAIRE_QUESTIONS = BUSINESS_QUESTIONNAIRE_SECTIONS.reduce(
  (acc, section) => acc + section.questions.length,
  0
);
