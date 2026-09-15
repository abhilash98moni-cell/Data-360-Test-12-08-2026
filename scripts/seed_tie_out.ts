import dotenv from 'dotenv';
dotenv.config();

import { getSupabaseServerClient } from '../src/lib/supabaseServer.js';
import * as docx from 'docx';
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } = docx;

async function run() {
  const supabase = getSupabaseServerClient();
  console.log('Seeding canonical Tie_out_Report.docx...');

  // 1. Generate DOCX
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: 'Tie_out_Report.docx', bold: true, size: 36, color: '1E3A8A' })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'FY26 Distributor Channel Revenue Tie-Out Report', italics: true, size: 24, color: '475569' })
          ]
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Audit Engagement: eng-101 | Client: Apex Electronics Corp | Distributor: Midwest Trading Co.', size: 20 })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Status: Authoritative Evidence Verification Document', bold: true, size: 20, color: '15803D' })
          ]
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'This document provides complete tie-out reconciliation between distributor-reported channel sales and audited revenue ledgers for FY 2025-26. All variances have been traced and verified against primary transactional documentation.', size: 22 })
          ]
        }),
        new Paragraph({ text: '' }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Audit Item / Ref', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'General Ledger ($)', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Distributor Sales ($)', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Variance ($)', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Audit Verification', bold: true })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Hardware & Devices' })] }),
                new TableCell({ children: [new Paragraph({ text: '$12,450,800' })] }),
                new TableCell({ children: [new Paragraph({ text: '$12,450,800' })] }),
                new TableCell({ children: [new Paragraph({ text: '$0.00' })] }),
                new TableCell({ children: [new Paragraph({ text: 'Confirmed 100% Tie-out' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Enterprise Subscriptions' })] }),
                new TableCell({ children: [new Paragraph({ text: '$3,890,250' })] }),
                new TableCell({ children: [new Paragraph({ text: '$3,890,250' })] }),
                new TableCell({ children: [new Paragraph({ text: '$0.00' })] }),
                new TableCell({ children: [new Paragraph({ text: 'Confirmed 100% Tie-out' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Maintenance & Service' })] }),
                new TableCell({ children: [new Paragraph({ text: '$1,120,400' })] }),
                new TableCell({ children: [new Paragraph({ text: '$1,120,400' })] }),
                new TableCell({ children: [new Paragraph({ text: '$0.00' })] }),
                new TableCell({ children: [new Paragraph({ text: 'Confirmed 100% Tie-out' })] })
              ]
            })
          ]
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  console.log('DOCX buffer generated:', buffer.length, 'bytes');

  // 2. Upload to Supabase Storage
  const canonicalPath = 'Apex_Electronics_Corp/FY26_Distributor_Channel_Audit/Midwest_Trading_Co/BQ_q-1_1/Tie_out_Report.docx';
  const pathsToUpload = [
    canonicalPath,
    'Tie_out_Report.docx',
    'canonical/Tie_out_Report.docx'
  ];

  for (const p of pathsToUpload) {
    const { data, error } = await supabase.storage.from('evidence-files').upload(p, buffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      upsert: true
    });
    if (error) {
      console.warn(`Upload error for ${p}:`, error.message);
    } else {
      console.log(`Successfully uploaded to storage path: ${p}`);
    }
  }

  // 3. Upsert EVIDENCE_FILE record into system_audit_logs
  const evidenceRecord = {
    client_name: 'Apex Electronics Corp',
    audit_id: 'eng-101',
    audit_code: 'AUD-2026-001',
    distributor_name: 'Midwest Trading Co.',
    requirement_ref: 'BQ-q-1.1',
    requirement_title: 'Channel Sales Tie-out Report',
    section: 'Revenue & Tie-out Verification',
    file_name: 'Tie_out_Report.docx',
    file_size_mb: parseFloat((buffer.length / (1024 * 1024)).toFixed(2)),
    file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    google_drive_file_id: canonicalPath,
    storage_path: 'Apex_Electronics_Corp/FY26_Distributor_Channel_Audit/Midwest_Trading_Co/BQ_q-1_1',
    version: 1,
    uploader: 'Distributor',
    uploader_role: 'Distributor',
    uploaded_by: 'Distributor User',
    source: 'Evidence Portal',
    uploaded_at: new Date().toISOString(),
    status: 'AVAILABLE',
    review_status: 'PENDING_REVIEW',
    audit_period: 'FY 2025-26',
    document_type: 'EVIDENCE',
    document_usage: ['EVIDENCE']
  };

  const { error: insErr } = await supabase.from('system_audit_logs').insert({
    event_type: 'EVIDENCE_FILE',
    target_user_email: 'Apex Electronics Corp::Midwest Trading Co.',
    details: evidenceRecord
  });
  console.log('Inserted EVIDENCE_FILE record:', insErr ? insErr.message : 'OK');

  // 4. Update existing questionnaire state in system_audit_logs
  const targetEmails = [
    'Apex Electronics Corp::Midwest Trading Co.::eng-101',
    'Apex::Midwest Trading Co.::eng-101'
  ];

  for (const email of targetEmails) {
    const { data: rows } = await supabase
      .from('system_audit_logs')
      .select('id, details')
      .eq('target_user_email', email)
      .eq('event_type', 'QUESTIONNAIRE_ANSWER_SAVE')
      .order('created_at', { ascending: false })
      .limit(1);

    if (rows && rows.length > 0) {
      const row = rows[0];
      const answers = row.details?.answers || {};
      const q1 = answers['q-1.1'] || { questionId: 'q-1.1', responseValue: '' };
      const existingAtts = q1.attachments || [];

      // Check if Tie_out_Report is already present
      const alreadyHas = existingAtts.some((a: any) =>
        (a.fileName && a.fileName.toLowerCase().includes('tie_out')) ||
        (a.googleDriveFileId && a.googleDriveFileId.includes('Tie_out_Report'))
      );

      const tieOutAtt = {
        id: 'att-tie-out-01',
        fileName: 'Tie_out_Report.docx',
        fileSizeMB: parseFloat((buffer.length / (1024 * 1024)).toFixed(2)),
        fileType: 'DOCX',
        googleDriveFileId: canonicalPath,
        uploadedBy: 'Distributor User',
        uploadedDate: new Date().toISOString(),
        webViewLink: ''
      };

      const newAtts = alreadyHas
        ? existingAtts.map((a: any) =>
            (a.fileName && a.fileName.toLowerCase().includes('tie_out'))
              ? { ...a, googleDriveFileId: canonicalPath, fileName: 'Tie_out_Report.docx', fileType: 'DOCX' }
              : a
          )
        : [...existingAtts, tieOutAtt];

      answers['q-1.1'] = {
        ...q1,
        attachments: newAtts,
        lastUpdated: new Date().toISOString()
      };

      const { error: upErr } = await supabase
        .from('system_audit_logs')
        .update({
          details: {
            ...row.details,
            answers
          }
        })
        .eq('id', row.id);

      console.log(`Updated questionnaire answers for ${email}:`, upErr ? upErr.message : 'OK');
    }
  }

  console.log('Seed completed successfully.');
}

run().catch(console.error);
