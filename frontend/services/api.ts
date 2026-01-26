import axios from 'axios';
import { API_BASE_URL } from '../config/constants';
import type { DatabaseRecord, LogAudit, SummaryReport } from '../types';

export const db = {
  async getTableData<T = DatabaseRecord>(table: string): Promise<T[]> {
    if (table === 'logi' || table === 'log_zmian_czlonka') {
      const response = await axios.get<T[]>(`${API_BASE_URL}/system/audit-logs`);
      return response.data;
    }
    const response = await axios.get<T[]>(`${API_BASE_URL}/data/${table}`);
    return response.data;
  },

  async insertRecord(table: string, data: DatabaseRecord): Promise<void> {
    await axios.post(`${API_BASE_URL}/data/${table}`, { data });
  },

  async updateRecord(
    table: string,
    idField: string,
    idValue: string | number,
    data: DatabaseRecord
  ): Promise<void> {
    await axios.put(`${API_BASE_URL}/data/${table}/${idField}/${idValue}`, { data });
  },

  async deleteRecord(table: string, idField: string, idValue: string | number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/data/${table}/${idField}/${idValue}`);
  },

  async getSummaryReport(): Promise<SummaryReport> {
    const response = await axios.get<SummaryReport>(
      `${API_BASE_URL}/reports/summary?t=${Date.now()}`
    );
    return response.data;
  },

  async callProcedureIncreaseFees(procent?: number): Promise<{ message: string }> {
    const response = await axios.post<{ success: boolean; message: string }>(
      `${API_BASE_URL}/procedures/increase-fees`,
      { procent }
    );
    return response.data;
  },

  async callProcedureAddFee(id_mieszkania: number, id_uslugi: number, zuzycie: number): Promise<string> {
    const response = await axios.post<{ success: boolean; message: string }>(
      `${API_BASE_URL}/procedures/add-fee`,
      { id_mieszkania, id_uslugi, zuzycie }
    );
    return response.data.message;
  },

  async getAuditLogs(): Promise<LogAudit[]> {
    const response = await axios.get<LogAudit[]>(`${API_BASE_URL}/system/audit-logs`);
    return response.data;
  },

  // Funkcje z Lab 11, 12, 13
  async getMembersOfBuilding(buildingId: number): Promise<{ members: string }> {
    const response = await axios.get(`${API_BASE_URL}/functions/members-of-building/${buildingId}`);
    return response.data;
  },

  async countRecords(tableName: string): Promise<{ count: number }> {
    const response = await axios.get(`${API_BASE_URL}/functions/count-records/${tableName}`);
    return response.data;
  },

  async getApartmentFees(aptId: number): Promise<{ total_fees: number }> {
    const response = await axios.get(`${API_BASE_URL}/functions/apartment-fees/${aptId}`);
    return response.data;
  },

  async getWorkerRepairsCount(workerId: number): Promise<{ repairs_count: number }> {
    const response = await axios.get(`${API_BASE_URL}/functions/worker-repairs/${workerId}`);
    return response.data;
  },

  // Widoki z Lab 9
  async getMieszkaniaInfo(): Promise<DatabaseRecord[]> {
    const response = await axios.get(`${API_BASE_URL}/views/mieszkania-info`);
    return response.data;
  },

  async getOplatySummary(): Promise<DatabaseRecord[]> {
    const response = await axios.get(`${API_BASE_URL}/views/oplaty-summary`);
    return response.data;
  },

  async getNaprawyStatus(): Promise<DatabaseRecord[]> {
    const response = await axios.get(`${API_BASE_URL}/views/naprawy-status`);
    return response.data;
  },

  // ============================================
  // WIDOKI Z ROZNYMI JOIN (Lab 10)
  // ============================================

  async getPracownicyNaprawy(): Promise<DatabaseRecord[]> {
    const response = await axios.get(`${API_BASE_URL}/views/pracownicy-naprawy`);
    return response.data;
  },

  async getOplatyUslugiFull(): Promise<DatabaseRecord[]> {
    const response = await axios.get(`${API_BASE_URL}/views/oplaty-uslugi-full`);
    return response.data;
  },

  async getBudynkiUslugiCross(): Promise<DatabaseRecord[]> {
    const response = await axios.get(`${API_BASE_URL}/views/budynki-uslugi-cross`);
    return response.data;
  },

  async getPracownicyKoledzy(): Promise<DatabaseRecord[]> {
    const response = await axios.get(`${API_BASE_URL}/views/pracownicy-koledzy`);
    return response.data;
  },

  async getCzlonkowiePelneInfo(): Promise<DatabaseRecord[]> {
    const response = await axios.get(`${API_BASE_URL}/views/czlonkowie-pelne-info`);
    return response.data;
  },

  // ============================================
  // MATERIALIZED VIEWS i INVISIBLE VIEW (Lab 9)
  // ============================================

  // Materialized View - statystyki dla dashboard (keszowane dane)
  async getDashboardStats(): Promise<DatabaseRecord> {
    const response = await axios.get(`${API_BASE_URL}/views/dashboard-stats`);
    return response.data;
  },

  // Materialized View - zuzycie mediow per budynek
  async getZuzyciePerBudynek(): Promise<DatabaseRecord[]> {
    const response = await axios.get(`${API_BASE_URL}/views/zuzycie-per-budynek`);
    return response.data;
  },

  // Odswiezanie widokow zmaterializowanych
  async refreshMaterializedViews(): Promise<{ message: string }> {
    const response = await axios.post(`${API_BASE_URL}/views/refresh-mv`);
    return response.data;
  },

  // Invisible View - bezpieczne dane czlonka (bez PESEL, telefon)
  async getCzlonekBezpieczny(): Promise<DatabaseRecord[]> {
    const response = await axios.get(`${API_BASE_URL}/views/czlonek-bezpieczny`);
    return response.data;
  },

  // Jawne pobranie kolumn INVISIBLE z widoku
  async getCzlonekPelneDane(id: number): Promise<DatabaseRecord> {
    const response = await axios.get(`${API_BASE_URL}/views/czlonek-pelne-dane/${id}`);
    return response.data;
  },

  // ============================================
  // PROCEDURY CRUD (Lab 11)
  // ============================================

  async procDodajCzlonka(data: {
    id_mieszkania: number;
    imie: string;
    nazwisko: string;
    pesel?: string;
    telefon?: string;
    email?: string;
  }): Promise<{ id_czlonka: number; message: string }> {
    const response = await axios.post(`${API_BASE_URL}/procedures/dodaj-czlonka`, data);
    return response.data;
  },

  async procAktualizujCzlonka(id: number, data: {
    imie?: string;
    nazwisko?: string;
    telefon?: string;
    email?: string;
  }): Promise<{ rows_updated: number; message: string }> {
    const response = await axios.put(`${API_BASE_URL}/procedures/aktualizuj-czlonka/${id}`, data);
    return response.data;
  },

  async procUsunCzlonka(id: number): Promise<{ rows_deleted: number; message: string }> {
    const response = await axios.delete(`${API_BASE_URL}/procedures/usun-czlonka/${id}`);
    return response.data;
  },

  // Funkcja dodaj_spotkanie z SEQUENCE (Lab 11)
  async funcDodajSpotkanie(data: {
    temat: string;
    miejsce: string;
    data?: string;
  }): Promise<{ id_spotkania: number; message: string }> {
    const response = await axios.post(`${API_BASE_URL}/functions/dodaj-spotkanie`, data);
    return response.data;
  },

  // Funkcja aktualizuj_saldo_konta (Lab 11)
  async funcAktualizujSaldo(id_konta: number, nowe_saldo: number): Promise<{ rows_updated: number; message: string }> {
    const response = await axios.put(`${API_BASE_URL}/functions/aktualizuj-saldo/${id_konta}?nowe_saldo=${nowe_saldo}`);
    return response.data;
  },

  // ============================================
  // PACKAGE coop_crud_pkg (Lab 12)
  // ============================================

  async pkgInsertBudynek(data: {
    adres: string;
    liczba_pieter: number;
    rok_budowy: number;
  }): Promise<{ id_budynku: number; message: string }> {
    const response = await axios.post(`${API_BASE_URL}/package/insert-budynek`, data);
    return response.data;
  },

  async pkgUpdateBudynek(id: number, adres: string, liczba_pieter: number): Promise<{ message: string }> {
    const response = await axios.put(`${API_BASE_URL}/package/update-budynek/${id}?adres=${encodeURIComponent(adres)}&liczba_pieter=${liczba_pieter}`);
    return response.data;
  },

  async pkgDeleteBudynek(id: number): Promise<{ rows_deleted: number; message: string }> {
    const response = await axios.delete(`${API_BASE_URL}/package/delete-budynek/${id}`);
    return response.data;
  },

  async pkgNazwiskoCzlonka(id: number): Promise<{ nazwisko: string }> {
    const response = await axios.get(`${API_BASE_URL}/package/nazwisko-czlonka/${id}`);
    return response.data;
  },

  async pkgAdresBudynku(id: number): Promise<{ adres: string }> {
    const response = await axios.get(`${API_BASE_URL}/package/adres-budynku/${id}`);
    return response.data;
  },

  async pkgStatystykiBudynku(id: number): Promise<{ statystyki: string }> {
    const response = await axios.get(`${API_BASE_URL}/package/statystyki-budynku/${id}`);
    return response.data;
  },

  // ============================================
  // PORTAL MIESZKANCA (Resident Portal)
  // ============================================

  async getResidentPayments(aptId: number): Promise<DatabaseRecord[]> {
    const response = await axios.get(`${API_BASE_URL}/resident/payments/${aptId}`);
    return response.data;
  },

  async getResidentRepairs(aptId: number): Promise<DatabaseRecord[]> {
    const response = await axios.get(`${API_BASE_URL}/resident/repairs/${aptId}`);
    return response.data;
  },

  async submitRepair(aptId: number, opis: string): Promise<{ id_naprawy: number; message: string }> {
    const response = await axios.post(`${API_BASE_URL}/resident/repairs`, { id_mieszkania: aptId, opis });
    return response.data;
  },

  async getUpcomingMeetings(): Promise<DatabaseRecord[]> {
    const response = await axios.get(`${API_BASE_URL}/resident/meetings`);
    return response.data;
  },

  async getResidentConsumption(aptId: number): Promise<DatabaseRecord[]> {
    const response = await axios.get(`${API_BASE_URL}/resident/consumption/${aptId}`);
    return response.data;
  },
};

