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

  async callProcedureIncreaseFees(): Promise<{ message: string }> {
    const response = await axios.post<{ success: boolean; message: string }>(
      `${API_BASE_URL}/procedures/increase-fees`,
      {}
    );
    return response.data;
  },

  async callProcedureAddFee(): Promise<string> {
    const response = await axios.post<{ success: boolean; message: string }>(
      `${API_BASE_URL}/procedures/add-fee`,
      {}
    );
    return response.data.message;
  },

  async getAuditLogs(): Promise<LogAudit[]> {
    const response = await axios.get<LogAudit[]>(`${API_BASE_URL}/system/audit-logs`);
    return response.data;
  },
};
