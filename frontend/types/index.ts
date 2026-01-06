export interface Budynek {
  id_budynku: number;
  adres: string;
  liczba_pieter: number;
  liczba_mieszkan: number;
  rok_budowy: number;
}

export interface Mieszkanie {
  id_mieszkania: number;
  numer: string;
  powierzchnia: number;
  liczba_pokoi: number;
  pietro: number;
  id_budynku: number;
  displayLabel?: string;
}

export interface Czlonek {
  id_czlonka: number;
  imie: string;
  nazwisko: string;
  numer_telefonu: string;
  id_mieszkania: number;
}

export interface Pracownik {
  id_pracownika: number;
  imie: string;
  nazwisko: string;
  stanowisko: string;
  telefon: string;
}

export interface Naprawa {
  id_naprawy: number;
  opis: string;
  status: 'Zgłoszona' | 'W toku' | 'Wykonana' | 'Anulowana';
  data_zgloszenia: string;
  id_mieszkania: number;
  id_pracownika?: number;
}

export interface Uslugi {
  id_uslugi: number;
  nazwa_uslugi: string;
  jednostka_miary: string;
  cena_za_jednostke: number;
}

export interface Oplata {
  id_oplaty: number;
  id_mieszkania: number;
  id_uslugi: number;
  zuzycie: number;
  kwota: number;
  data_platnosci: string;
  status_oplaty: 'Wystawiono' | 'Zapłacono' | 'Oczekuje' | 'Zaległość';
}

export interface LogAudit {
  id_logu: number;
  id_czlonka: number;
  operacja: 'INSERT' | 'UPDATE' | 'DELETE';
  data_operacji: string;
  uzytkownik: string;
}

export interface ColumnDefinition {
  key: string;
  label: string;
  priority?: boolean;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface ServiceSummary {
  nazwa_uslugi: string;
  jednostka_miary: string;
  total_zuzycie: number;
  total_kwota: number;
}

export interface UnpaidDetail {
  adres: string;
  numer_mieszkania: string;
  nazwa_uslugi: string;
  kwota: number;
  data_platnosci: string;
}

export interface SummaryReport {
  total_revenue: number;
  members_count: number;
  arrears_count: number;
  services_summary: ServiceSummary[];
  unpaid_details: UnpaidDetail[];
}

export type DatabaseRecord = Record<string, unknown>;
