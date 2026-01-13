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

  // Dane mieszkańca
  async getResidentData(aptId: number): Promise<{
    oplaty: DatabaseRecord[];
    naprawy: DatabaseRecord[];
    spotkania: DatabaseRecord[];
    umowy: DatabaseRecord[];
    suma_oplat: number;
  }> {
    const response = await axios.get(`${API_BASE_URL}/resident/my-data/${aptId}`);
    return response.data;
  },
};
