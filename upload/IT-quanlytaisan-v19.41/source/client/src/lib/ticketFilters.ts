export type TicketStatus = "Mới" | "Đang xử lý" | "Đã hoàn thành";
export type TicketPriority = "Cao" | "Trung bình" | "Thấp";

export type TicketAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
};

export type TicketHistoryItem = {
  updateId?: number;
  authorId?: number | null;
  assetStatusAfter?: string | null;
  status: TicketStatus;
  note: string;
  at: string;
  attachments?: TicketAttachment[];
  assetId?: number | null;
};

export type TicketRecord = {
  id: string;
  title: string;
  requester: string;
  department: string;
  location: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignee: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  history: TicketHistoryItem[];
  attachments?: TicketAttachment[];
  assetId?: number | null;
};

export type TicketFilters = {
  query: string;
  status: "Tất cả" | TicketStatus;
  department: string;
  location: string;
  priority: "Tất cả" | TicketPriority;
};

export const ticketStatuses: TicketStatus[] = ["Mới", "Đang xử lý", "Đã hoàn thành"];
export const ticketPriorities: TicketPriority[] = ["Cao", "Trung bình", "Thấp"];
export const ticketFilterStorageKey = "it-quanlytaisan.ticket-filters.v1";
const legacyTicketFilterStorageKey = "qlts.ticket-filters.v1";
export const ticketDataStorageKey = "it-quanlytaisan.tickets.v1";
const legacyTicketDataStorageKey = "qlts.tickets.v1";

export const defaultTicketFilters: TicketFilters = {
  query: "",
  status: "Tất cả",
  department: "Tất cả",
  location: "Tất cả",
  priority: "Tất cả",
};

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export function normalizeTicketFilters(input?: Partial<TicketFilters> | null): TicketFilters {
  return {
    query: typeof input?.query === "string" ? input.query : "",
    status: input?.status && (input.status === "Tất cả" || ticketStatuses.includes(input.status as TicketStatus)) ? input.status : "Tất cả",
    department: typeof input?.department === "string" && input.department ? input.department : "Tất cả",
    location: typeof input?.location === "string" && input.location ? input.location : "Tất cả",
    priority: input?.priority && (input.priority === "Tất cả" || ticketPriorities.includes(input.priority as TicketPriority)) ? input.priority : "Tất cả",
  } as TicketFilters;
}

export function normalizeTicketRecord(input: TicketRecord): TicketRecord {
  return {
    ...input,
    location: input.location || "Chưa cập nhật",
    attachments: Array.isArray(input.attachments) ? input.attachments : [],
    history: Array.isArray(input.history) ? input.history.map(item => ({ ...item, attachments: Array.isArray(item.attachments) ? item.attachments : [] })) : [],
  };
}

export function filterTickets(tickets: TicketRecord[], filters: TicketFilters): TicketRecord[] {
  const query = filters.query.trim().toLocaleLowerCase("vi");
  return tickets.filter(ticket => {
    const haystack = `${ticket.id} ${ticket.title} ${ticket.requester} ${ticket.department} ${ticket.assignee} ${ticket.description}`.toLocaleLowerCase("vi");
    return (!query || haystack.includes(query))
      && (filters.status === "Tất cả" || ticket.status === filters.status)
      && (filters.department === "Tất cả" || ticket.department === filters.department)
      && (filters.location === "Tất cả" || ticket.location === filters.location)
      && (filters.priority === "Tất cả" || ticket.priority === filters.priority);
  });
}

export function loadTicketFilters(storage?: StorageLike): TicketFilters {
  if (!storage) return defaultTicketFilters;
  try {
    return normalizeTicketFilters(JSON.parse(storage.getItem(ticketFilterStorageKey) ?? storage.getItem(legacyTicketFilterStorageKey) ?? "null") as Partial<TicketFilters> | null);
  } catch {
    return defaultTicketFilters;
  }
}

export function saveTicketFilters(storage: StorageLike | undefined, filters: TicketFilters) {
  storage?.setItem(ticketFilterStorageKey, JSON.stringify(normalizeTicketFilters(filters)));
}

export function loadTickets(storage: StorageLike | undefined, fallback: TicketRecord[]): TicketRecord[] {
  if (!storage) return fallback.map(normalizeTicketRecord);
  try {
    const saved = JSON.parse(storage.getItem(legacyTicketDataStorageKey) ?? storage.getItem(ticketDataStorageKey) ?? "null");
    return Array.isArray(saved) && saved.every(ticket => ticket && typeof ticket.id === "string") ? saved.map(normalizeTicketRecord) as TicketRecord[] : fallback.map(normalizeTicketRecord);
  } catch {
    return fallback.map(normalizeTicketRecord);
  }
}

export function saveTickets(storage: StorageLike | undefined, tickets: TicketRecord[]) {
  storage?.setItem(ticketDataStorageKey, JSON.stringify(tickets.map(normalizeTicketRecord)));
}
