import { getSupabaseServerClient } from '../lib/supabaseServer';
import { ThreadedMessage, ConversationSummary, EnterpriseRole } from '../types';
import { CLIENT_TENANTS, DistributorInfo } from '../data/clientsAndDistributors';
import fs from 'fs';
import path from 'path';

export interface SessionContext {
  role: string;
  org: string;
  email: string;
  name: string;
  isDistributor: boolean;
  distributorInfo: DistributorInfo | null;
}

export interface PostMessagePayload {
  conversationId?: string;
  auditId?: string;
  distributorId?: string;
  requestRef?: string;
  requestTitle?: string;
  content: string;
  attachments?: {
    fileName: string;
    fileSizeMB: number;
    url?: string;
    googleDriveFileId?: string;
  }[];
}

// Memory cache for sub-millisecond local reads + fallback
const IN_MEMORY_MESSAGES_STORE: ThreadedMessage[] = [];

const DISCUSSIONS_FILE_PATH = path.join(process.cwd(), 'data', 'discussions_messages.json');

function loadDiskCache(): ThreadedMessage[] {
  try {
    if (fs.existsSync(DISCUSSIONS_FILE_PATH)) {
      const fileContent = fs.readFileSync(DISCUSSIONS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(fileContent);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Failed to read local discussions disk cache:', err);
  }
  return [];
}

function saveDiskCache(messages: ThreadedMessage[]) {
  try {
    const dir = path.dirname(DISCUSSIONS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DISCUSSIONS_FILE_PATH, JSON.stringify(messages, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to write local discussions disk cache:', err);
  }
}

/**
 * Resolves distributor information given an organization name and user role.
 */
export function resolveDistributorForSession(orgName: string, roleName: string): DistributorInfo | null {
  const isDistributor = roleName.toLowerCase().includes('distributor');
  if (!isDistributor) return null;

  if (!orgName) return CLIENT_TENANTS[0].distributors[0];
  const normalized = orgName.trim().toLowerCase();

  for (const dist of CLIENT_TENANTS[0].distributors) {
    if (
      dist.name.toLowerCase() === normalized ||
      dist.id.toLowerCase() === normalized ||
      dist.code.toLowerCase() === normalized
    ) {
      return dist;
    }
  }

  const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return {
    id: `dist-${slug}`,
    name: orgName,
    code: `DIST-${slug.substring(0, 4).toUpperCase()}`,
    region: 'Global',
    status: 'Active Audit' as const
  };
}

/**
 * Extracts session details from HTTP request headers/body.
 */
export function extractSessionFromReq(reqHeaders: Record<string, any>, reqBody?: Record<string, any>): SessionContext {
  const role = (reqHeaders['x-user-role'] as string) || (reqBody?.senderRole as string) || 'Auditor';
  const org = (reqHeaders['x-user-organization'] as string) || (reqBody?.senderOrganization as string) || 'Apex Audit Practice (AA)';
  const email = (reqHeaders['x-user-email'] as string) || (reqBody?.senderEmail as string) || 'user@company.com';
  const name = (reqHeaders['x-user-name'] as string) || (reqBody?.senderName as string) || 'Authorized User';

  const isDistributor = role.toLowerCase().includes('distributor');
  const distributorInfo = resolveDistributorForSession(org, role);

  return {
    role,
    org,
    email,
    name,
    isDistributor,
    distributorInfo
  };
}

/**
 * Safely extracts the distributorId from a conversationId string.
 * Example:
 *   "conv-eng-101-dist-1" -> "dist-1"
 *   "conv-eng-101-MDT-8092" -> "MDT-8092"
 *   "conv-eng-101-internal-auditors" -> "internal-auditors"
 */
export function extractDistributorIdFromConvId(conversationId: string, auditId: string = 'eng-101'): string {
  if (!conversationId) return '';

  const prefix = `conv-${auditId}-`;
  if (conversationId.startsWith(prefix)) {
    return conversationId.substring(prefix.length);
  }

  if (conversationId.startsWith('conv-')) {
    const parts = conversationId.split('-');
    // ["conv", "eng", "101", "dist", "1"] -> slice(3) = ["dist", "1"] -> "dist-1"
    if (parts.length >= 4) {
      return parts.slice(3).join('-');
    }
  }

  return '';
}

/**
 * Build a canonical conversationId from auditId and distributorId.
 */
export function buildConversationId(auditId: string = 'eng-101', distributorId: string): string {
  const cleanAudit = auditId || 'eng-101';
  const cleanDist = distributorId || 'dist-1';
  return `conv-${cleanAudit}-${cleanDist}`;
}

/**
 * Authoritative message loader from Supabase, Disk, and Memory
 */
export async function fetchAllMessagesFromDatabase(auditId: string = 'eng-101'): Promise<ThreadedMessage[]> {
  const client = getSupabaseServerClient();
  const messageMap = new Map<string, ThreadedMessage>();

  // 1. Load memory cache & disk cache first
  const diskMessages = loadDiskCache();
  diskMessages.forEach(m => messageMap.set(m.id, m));
  IN_MEMORY_MESSAGES_STORE.forEach(m => messageMap.set(m.id, m));

  // 2. Fetch from Supabase PostgreSQL (Authoritative)
  if (client) {
    // 2a. Attempt fetch from dedicated `communication_messages` table
    try {
      const { data, error } = await client
        .from('communication_messages')
        .select('*')
        .eq('audit_id', auditId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data)) {
        data.forEach((row: any) => {
          const msg: ThreadedMessage = {
            id: row.id,
            conversationId: row.conversation_id,
            auditId: row.audit_id,
            distributorId: row.distributor_id,
            requestRef: row.request_ref || undefined,
            requestTitle: row.request_title || undefined,
            senderName: row.sender_name,
            senderEmail: row.sender_email,
            senderRole: row.sender_role as EnterpriseRole,
            senderOrganization: row.sender_organization,
            timestamp: row.created_at ? `Today at ${new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Today',
            content: row.content,
            attachments: Array.isArray(row.attachments) ? row.attachments : undefined,
            replyToId: row.reply_to_id || undefined,
            isReadByAuditor: row.is_read_by_auditor ?? true,
            isReadByDistributor: row.is_read_by_distributor ?? true,
            createdAt: row.created_at
          };
          messageMap.set(msg.id, msg);
        });
      }
    } catch (e: any) {
      console.warn('Supabase communication_messages read notice:', e.message);
    }

    // 2b. Attempt fetch from `system_audit_logs` table (Fallback / Legacy sync)
    try {
      const { data, error } = await client
        .from('system_audit_logs')
        .select('*')
        .in('event_type', ['COMMUNICATION_MESSAGE', 'DISCUSSION_MESSAGE']);

      if (!error && Array.isArray(data)) {
        data.forEach((row: any) => {
          if (row.details && typeof row.details === 'object' && row.details.id) {
            messageMap.set(row.details.id, row.details as ThreadedMessage);
          }
        });
      }
    } catch (e: any) {
      console.warn('Supabase system_audit_logs read notice:', e.message);
    }
  }

  const allMessages = Array.from(messageMap.values());
  allMessages.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

  // Update memory cache and disk cache
  IN_MEMORY_MESSAGES_STORE.length = 0;
  IN_MEMORY_MESSAGES_STORE.push(...allMessages);
  saveDiskCache(allMessages);

  return allMessages;
}

/**
 * Gets conversation list with strict multi-tenant authorization.
 */
export async function getConversationsForSession(
  session: SessionContext,
  auditId: string = 'eng-101'
): Promise<ConversationSummary[]> {
  const allMessages = await fetchAllMessagesFromDatabase(auditId);

  let activeDistributors = CLIENT_TENANTS[0].distributors;

  // STRICT SERVER-SIDE ISOLATION:
  // If caller is a Distributor, restrict strictly to their OWN distributor ID!
  if (session.isDistributor && session.distributorInfo) {
    activeDistributors = [session.distributorInfo];
  }

  const conversations: ConversationSummary[] = activeDistributors.map(dist => {
    const convId = buildConversationId(auditId, dist.id);
    const messagesForConv = allMessages.filter(
      m => m.conversationId === convId || (m.auditId === auditId && m.distributorId === dist.id)
    );

    messagesForConv.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    const lastMsg = messagesForConv.length > 0 ? messagesForConv[messagesForConv.length - 1] : undefined;

    const unreadCount = messagesForConv.filter(m => {
      if (session.isDistributor) {
        return !m.isReadByDistributor && m.senderRole !== session.role;
      } else {
        return !m.isReadByAuditor && m.senderRole.toLowerCase().includes('distributor');
      }
    }).length;

    return {
      conversationId: convId,
      auditId,
      distributorId: dist.id,
      distributorName: dist.name,
      distributorCode: dist.code,
      distributorRegion: dist.region,
      lastMessage: lastMsg
        ? {
            content: lastMsg.content,
            timestamp: lastMsg.timestamp,
            senderName: lastMsg.senderName,
            senderRole: lastMsg.senderRole
          }
        : undefined,
      unreadCount
    };
  });

  // Add Internal Auditor Team Channel for Auditor roles
  if (!session.isDistributor) {
    const internalAuditorConvId = buildConversationId(auditId, 'internal-auditors');
    const internalMsgs = allMessages.filter(
      m => m.conversationId === internalAuditorConvId || m.distributorId === 'internal-auditors'
    );
    internalMsgs.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    const lastInternalMsg = internalMsgs.length > 0 ? internalMsgs[internalMsgs.length - 1] : undefined;

    conversations.unshift({
      conversationId: internalAuditorConvId,
      auditId,
      distributorId: 'internal-auditors',
      distributorName: '🔒 Internal Auditor Team Room',
      distributorCode: 'AUD-TEAM',
      distributorRegion: 'Internal Audit Practice',
      lastMessage: lastInternalMsg
        ? {
            content: lastInternalMsg.content,
            timestamp: lastInternalMsg.timestamp,
            senderName: lastInternalMsg.senderName,
            senderRole: lastInternalMsg.senderRole
          }
        : undefined,
      unreadCount: 0
    });
  }

  return conversations;
}

/**
 * Gets messages for a specific conversation with strict multi-tenant authorization checks.
 */
export async function getMessagesForSession(
  session: SessionContext,
  conversationId: string,
  auditId: string = 'eng-101',
  requestedDistributorId?: string
): Promise<{ success: boolean; conversationId: string; auditId: string; distributorId: string; messages: ThreadedMessage[]; error?: string; status?: number }> {
  let targetDistributorId = requestedDistributorId || '';

  if (!targetDistributorId && conversationId) {
    targetDistributorId = extractDistributorIdFromConvId(conversationId, auditId);
  }

  if (!targetDistributorId && session.isDistributor && session.distributorInfo) {
    targetDistributorId = session.distributorInfo.id;
  }

  // STRICT MULTI-TENANT AUTHORIZATION CHECK
  if (session.isDistributor && session.distributorInfo) {
    if (targetDistributorId && targetDistributorId !== session.distributorInfo.id) {
      console.warn(`SECURITY REJECTION: Distributor '${session.org}' (ID: ${session.distributorInfo.id}) attempted to access conversation for '${targetDistributorId}'`);
      return {
        success: false,
        conversationId,
        auditId,
        distributorId: targetDistributorId,
        messages: [],
        error: 'Access Denied: You are not authorized to view messages belonging to another distributor conversation.',
        status: 403
      };
    }
    targetDistributorId = session.distributorInfo.id;
  }

  const expectedConvId = conversationId || buildConversationId(auditId, targetDistributorId || 'dist-1');

  const allMessages = await fetchAllMessagesFromDatabase(auditId);

  const messages = allMessages.filter(
    m => m.conversationId === expectedConvId || (m.auditId === auditId && m.distributorId === targetDistributorId)
  );

  messages.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

  return {
    success: true,
    conversationId: expectedConvId,
    auditId,
    distributorId: targetDistributorId,
    messages
  };
}

/**
 * Posts a message with permanent database persistence and strict multi-tenant isolation.
 */
export async function postMessageForSession(
  session: SessionContext,
  payload: PostMessagePayload
): Promise<{ success: boolean; message?: ThreadedMessage; error?: string; status?: number }> {
  const { auditId, requestRef, requestTitle, content, attachments } = payload;
  let { conversationId, distributorId } = payload;

  if (!content || !content.trim()) {
    if (!attachments || attachments.length === 0) {
      return { success: false, error: 'Message content cannot be empty', status: 400 };
    }
  }

  const currentAuditId = auditId || 'eng-101';

  // STRICT AUTHORIZATION & DISTRIBUTOR RESOLUTION
  if (session.isDistributor && session.distributorInfo) {
    if (distributorId && distributorId !== session.distributorInfo.id) {
      console.warn(`SECURITY REJECTION: Distributor '${session.org}' attempted to post to distributorId '${distributorId}'`);
      return {
        success: false,
        error: 'Access Denied: You cannot post messages to another distributor conversation.',
        status: 403
      };
    }
    distributorId = session.distributorInfo.id;
  } else if (distributorId === 'internal-auditors' || conversationId?.includes('internal-auditors')) {
    distributorId = 'internal-auditors';
  } else if (!distributorId && conversationId) {
    distributorId = extractDistributorIdFromConvId(conversationId, currentAuditId);
  }

  if (!distributorId) {
    distributorId = 'dist-1';
  }

  const validConvId = conversationId || buildConversationId(currentAuditId, distributorId);

  const now = new Date();
  const formattedTimestamp = `Today at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newMessage: ThreadedMessage = {
    id: messageId,
    conversationId: validConvId,
    auditId: currentAuditId,
    distributorId,
    requestRef: requestRef || undefined,
    requestTitle: requestTitle || undefined,
    senderName: session.name,
    senderEmail: session.email,
    senderRole: session.role as EnterpriseRole,
    senderOrganization: session.org,
    timestamp: formattedTimestamp,
    content: (content || '').trim(),
    attachments: Array.isArray(attachments) ? attachments : undefined,
    isReadByAuditor: !session.isDistributor,
    isReadByDistributor: session.isDistributor,
    createdAt: now.toISOString()
  };

  // 1. Update in-memory store
  IN_MEMORY_MESSAGES_STORE.push(newMessage);
  saveDiskCache(IN_MEMORY_MESSAGES_STORE);

  // 2. Persist to Supabase Database
  let dbPersisted = false;
  const client = getSupabaseServerClient();

  if (client) {
    // 2a. Primary insert into dedicated communication_messages table
    try {
      const commInsert = await client.from('communication_messages').insert({
        id: newMessage.id,
        conversation_id: newMessage.conversationId,
        audit_id: newMessage.auditId,
        distributor_id: newMessage.distributorId,
        distributor_name: session.org,
        sender_id: session.email,
        sender_name: session.name,
        sender_email: session.email,
        sender_role: session.role,
        sender_organization: session.org,
        content: newMessage.content,
        attachments: newMessage.attachments || [],
        request_ref: newMessage.requestRef || null,
        request_title: newMessage.requestTitle || null,
        is_read_by_auditor: newMessage.isReadByAuditor,
        is_read_by_distributor: newMessage.isReadByDistributor,
        created_at: newMessage.createdAt
      });

      if (!commInsert.error) {
        dbPersisted = true;
      } else {
        console.warn('Supabase communication_messages insert notice:', commInsert.error.message);
      }
    } catch (e: any) {
      console.warn('Supabase communication_messages insert catch:', e.message);
    }

    // 2b. Secondary backup insert into system_audit_logs table
    try {
      const auditInsert = await client.from('system_audit_logs').insert({
        event_type: 'COMMUNICATION_MESSAGE',
        target_user_email: newMessage.conversationId,
        details: newMessage,
        created_at: newMessage.createdAt
      });

      if (!auditInsert.error) {
        dbPersisted = true;
      } else {
        console.warn('Supabase system_audit_logs insert notice:', auditInsert.error.message);
      }
    } catch (e: any) {
      console.warn('Supabase system_audit_logs insert catch:', e.message);
    }
  }

  console.log(`💬 Message ${newMessage.id} saved in conversation '${validConvId}' by ${session.name} (${session.org}) [DB Persisted: ${dbPersisted}]`);

  return {
    success: true,
    message: newMessage
  };
}

/**
 * Marks messages in a conversation as read for the calling session role.
 */
export async function markMessagesReadForSession(
  session: SessionContext,
  conversationId: string
): Promise<{ success: boolean; error?: string; status?: number }> {
  if (!conversationId) {
    return { success: false, error: 'Conversation ID is required', status: 400 };
  }

  if (session.isDistributor && session.distributorInfo) {
    const expectedConvId = buildConversationId('eng-101', session.distributorInfo.id);
    if (!conversationId.includes(session.distributorInfo.id)) {
      return { success: false, error: 'Access Denied: Cannot mark messages as read for another conversation.', status: 403 };
    }
  }

  IN_MEMORY_MESSAGES_STORE.forEach(m => {
    if (m.conversationId === conversationId || conversationId.includes(m.distributorId)) {
      if (session.isDistributor) {
        m.isReadByDistributor = true;
      } else {
        m.isReadByAuditor = true;
      }
    }
  });

  saveDiskCache(IN_MEMORY_MESSAGES_STORE);

  // Update Supabase Database
  const client = getSupabaseServerClient();
  if (client) {
    try {
      const updateField = session.isDistributor ? { is_read_by_distributor: true } : { is_read_by_auditor: true };
      await client.from('communication_messages').update(updateField).eq('conversation_id', conversationId);
    } catch (e: any) {
      console.warn('Failed to update read status in communication_messages:', e.message);
    }
  }

  return { success: true };
}
