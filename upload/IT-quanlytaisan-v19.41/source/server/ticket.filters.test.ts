import { describe, expect, it } from "vitest";
import { defaultTicketFilters, filterTickets, loadTicketFilters, loadTickets, saveTicketFilters, saveTickets, type TicketRecord } from "../client/src/lib/ticketFilters";

const tickets: TicketRecord[] = [
  { id: "HD-001", title: "Mạng nội bộ", requester: "An", department: "TCHC&KH", location: "VP1", priority: "Cao", status: "Đang xử lý", assignee: "IT", description: "Mất kết nối", createdAt: "2026-09-25T08:00:00Z", updatedAt: "2026-09-25T09:00:00Z", history: [] },
  { id: "HD-002", title: "Phần mềm kế toán", requester: "Bình", department: "TCKT", location: "VP2", priority: "Trung bình", status: "Mới", assignee: "Chưa phân công", description: "Cài phần mềm", createdAt: "2026-09-25T08:00:00Z", updatedAt: "2026-09-25T09:00:00Z", history: [] },
  { id: "HD-003", title: "Thay màn hình", requester: "Chi", department: "TCHC&KH", location: "VP1", priority: "Cao", status: "Đã hoàn thành", assignee: "IT", description: "Màn hình hỏng", createdAt: "2026-09-25T08:00:00Z", updatedAt: "2026-09-25T09:00:00Z", history: [] },
];

function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) };
}

describe("Helpdesk ticket filters", () => {
  it("combines search, status, department, and priority filters", () => {
    expect(filterTickets(tickets, { query: "màn hình", status: "Đã hoàn thành", department: "TCHC&KH", location: "VP1", priority: "Cao" }).map(ticket => ticket.id)).toEqual(["HD-003"]);
    expect(filterTickets(tickets, { ...defaultTicketFilters, department: "TCHC&KH", location: "VP1", priority: "Cao" }).map(ticket => ticket.id)).toEqual(["HD-001", "HD-003"]);
  });

  it("saves and restores valid filter selections", () => {
    const storage = memoryStorage();
    saveTicketFilters(storage, { query: "mạng", status: "Đang xử lý", department: "TCHC&KH", location: "VP1", priority: "Cao" });
    expect(loadTicketFilters(storage)).toEqual({ query: "mạng", status: "Đang xử lý", department: "TCHC&KH", location: "VP1", priority: "Cao" });
  });

  it("falls back safely when stored filter data is invalid", () => {
    const storage = memoryStorage();
    storage.setItem("qlts.ticket-filters.v1", JSON.stringify({ status: "không hợp lệ", priority: "không hợp lệ" }));
    expect(loadTicketFilters(storage)).toEqual(defaultTicketFilters);
  });

  it("preserves attachments and normalizes older tickets without attachment fields", () => {
    const storage = memoryStorage();
    const attachment = { id: "file-1", name: "anh.png", type: "image/png", size: 12, dataUrl: "data:image/png;base64,AA==", uploadedAt: "2026-09-25T09:00:00Z" };
    saveTickets(storage, [{ ...tickets[0], attachments: [attachment], history: [{ status: "Mới", note: "Có tệp", at: "2026-09-25T09:00:00Z", attachments: [attachment] }] }]);
    const restored = loadTickets(storage, tickets);
    expect(restored[0]?.attachments?.[0]?.name).toBe("anh.png");
    storage.setItem("qlts.tickets.v1", JSON.stringify([{ ...tickets[1], history: [{ status: "Mới", note: "Cũ", at: "2026-09-25T09:00:00Z" }] }]));
    expect(loadTickets(storage, tickets)[0]?.attachments).toEqual([]);
    expect(loadTickets(storage, tickets)[0]?.history[0]?.attachments).toEqual([]);
  });
});
