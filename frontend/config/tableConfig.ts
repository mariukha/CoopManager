import type { ColumnDefinition } from '../types';

export const TABLE_COLUMNS: Record<string, ColumnDefinition[]> = {
  budynek: [
    { key: 'id_budynku', label: 'ID' },
    { key: 'adres', label: 'Adres', priority: true },
    { key: 'liczba_pieter', label: 'Piętra' },
    { key: 'liczba_mieszkan', label: 'Lokale', priority: true },
    { key: 'rok_budowy', label: 'Rok' },
  ],
  mieszkanie: [
    { key: 'id_mieszkania', label: 'ID' },
    { key: 'numer', label: 'Nr', priority: true },
    { key: 'powierzchnia', label: 'Metraż', priority: true },
    { key: 'liczba_pokoi', label: 'Pokoje' },
    { key: 'pietro', label: 'Piętro' },
    { key: 'id_budynku', label: 'Budynek ID' },
  ],
  czlonek: [
    { key: 'id_czlonka', label: 'ID' },
    { key: 'imie', label: 'Imię' },
    { key: 'nazwisko', label: 'Nazwisko', priority: true },
    { key: 'numer_telefonu', label: 'Telefon', priority: true },
    { key: 'id_mieszkania', label: 'Mieszkanie ID' },
  ],
  pracownik: [
    { key: 'id_pracownika', label: 'ID' },
    { key: 'imie', label: 'Imię' },
    { key: 'nazwisko', label: 'Nazwisko', priority: true },
    { key: 'stanowisko', label: 'Stanowisko', priority: true },
    { key: 'telefon', label: 'Telefon' },
  ],
  naprawa: [
    { key: 'id_naprawy', label: 'ID' },
    { key: 'opis', label: 'Opis', priority: true },
    { key: 'status', label: 'Status', priority: true },
    { key: 'data_zgloszenia', label: 'Zgłoszenie' },
    { key: 'id_mieszkania', label: 'Mieszkanie ID' },
  ],
  uslugi: [
    { key: 'id_uslugi', label: 'ID' },
    { key: 'nazwa_uslugi', label: 'Usługa', priority: true },
    { key: 'jednostka_miary', label: 'Jedn.' },
    { key: 'cena_za_jednostke', label: 'Stawka', priority: true },
  ],
  oplata: [
    { key: 'id_oplaty', label: 'ID' },
    { key: 'zuzycie', label: 'Zużycie' },
    { key: 'kwota', label: 'Suma (PLN)', priority: true },
    { key: 'data_platnosci', label: 'Termin' },
    { key: 'status_oplaty', label: 'Status', priority: true },
  ],
};

export const FORM_FIELDS: Record<string, string[]> = {
  budynek: ['adres', 'liczba_pieter', 'liczba_mieszkan', 'rok_budowy'],
  mieszkanie: ['numer', 'powierzchnia', 'liczba_pokoi', 'pietro', 'id_budynku'],
  czlonek: ['imie', 'nazwisko', 'numer_telefonu', 'id_mieszkania'],
  pracownik: ['imie', 'nazwisko', 'stanowisko', 'telefon'],
  naprawa: ['opis', 'status', 'data_zgloszenia', 'id_mieszkania', 'id_pracownika'],
  uslugi: ['nazwa_uslugi', 'jednostka_miary', 'cena_za_jednostke'],
  oplata: ['id_mieszkania', 'id_uslugi', 'zuzycie', 'kwota', 'data_platnosci', 'status_oplaty'],
};

export const DROPDOWN_FIELDS = [
  'id_budynku',
  'id_mieszkania',
  'id_pracownika',
  'id_uslugi',
  'status',
  'status_oplaty',
  'jednostka_miary',
] as const;

export const NUMERIC_FIELDS = [
  'kwota',
  'zuzycie',
  'powierzchnia',
  'numer',
  'liczba_pieter',
  'liczba_mieszkan',
  'rok_budowy',
  'pietro',
  'liczba_pokoi',
  'cena_za_jednostke',
] as const;

export function getPrimaryKeyField(record: Record<string, unknown>): string | undefined {
  return Object.keys(record).find(key => key.toLowerCase().startsWith('id_'));
}

export function formatDateForInput(value: string | null | undefined): string {
  if (!value) return '';
  return value.split('T')[0];
}
