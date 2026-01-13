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
  metraz: number;
  liczba_pokoi: number;
  id_budynku: number;
  displayLabel?: string;
}

export interface Czlonek {
  id_czlonka: number;
  imie: string;
  nazwisko: string;
  telefon: string;
  email: string;
  pesel: string;
  id_mieszkania: number;
}

export interface Pracownik {
  id_pracownika: number;
  imie: string;
  nazwisko: string;
  stanowisko: string;
  telefon: string;
  email: string;
}

export interface Naprawa {
  id_naprawy: number;
  opis: string;
  status: string;
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
  data_naliczenia: string;
  status_oplaty: string;
}

export interface Umowa {
  id_umowy: number;
  id_mieszkania: number;
  id_czlonka: number;
  data_zawarcia: string;
  data_wygasniecia: string;
  typ_umowy: string;
}

export interface KontoBankowe {
  id_konta: number;
  id_czlonka: number;
  numer_konta: string;
  saldo: number;
}

export interface SpotkanieMieszkancow {
  id_spotkania: number;
  temat: string;
  miejsce: string;
  data_spotkania: string;
}

export interface LogAudit {
  id_logu: number;
  id_czlonka: number;
  operacja: 'INSERT' | 'UPDATE' | 'DELETE';
  stare_dane: string;
  nowe_dane: string;
  data_zmiany: string;
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

export interface ApartmentSummary {
  id_mieszkania: number;
  numer: string;
  liczba_oplat: number;
  suma_oplat: number;
  zaleglosci: number;
}

export interface RepairStatus {
  id_naprawy: number;
  opis: string;
  status: string;
  opis_statusu: string;
  pracownik: string;
}

export interface SummaryReport {
  total_revenue: number;
  members_count: number;
  arrears_count: number;
  services_summary: ServiceSummary[];
  unpaid_details: UnpaidDetail[];
  table_stats?: Record<string, number>;
  apartments_summary?: ApartmentSummary[];
  repairs_status?: RepairStatus[];
}

export type DatabaseRecord = Record<string, unknown>;
