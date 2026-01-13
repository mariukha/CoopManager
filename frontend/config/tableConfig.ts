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
    { key: 'metraz', label: 'Metraż m²', priority: true },
    { key: 'liczba_pokoi', label: 'Pokoje' },
    { key: 'id_budynku', label: 'Budynek ID' },
  ],
  czlonek: [
    { key: 'id_czlonka', label: 'ID' },
    { key: 'imie', label: 'Imię' },
    { key: 'nazwisko', label: 'Nazwisko', priority: true },
    { key: 'telefon', label: 'Telefon', priority: true },
    { key: 'email', label: 'Email' },
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
    { key: 'data_naliczenia', label: 'Data' },
    { key: 'status_oplaty', label: 'Status', priority: true },
  ],
  umowa: [
    { key: 'id_umowy', label: 'ID' },
    { key: 'id_mieszkania', label: 'Mieszkanie' },
    { key: 'id_czlonka', label: 'Członek' },
    { key: 'data_zawarcia', label: 'Od', priority: true },
    { key: 'data_wygasniecia', label: 'Do', priority: true },
    { key: 'typ_umowy', label: 'Typ', priority: true },
  ],
  konto_bankowe: [
    { key: 'id_konta', label: 'ID' },
    { key: 'id_czlonka', label: 'Członek' },
    { key: 'numer_konta', label: 'Nr konta', priority: true },
    { key: 'saldo', label: 'Saldo (PLN)', priority: true },
  ],
  spotkanie_mieszkancow: [
    { key: 'id_spotkania', label: 'ID' },
    { key: 'temat', label: 'Temat', priority: true },
    { key: 'miejsce', label: 'Miejsce', priority: true },
    { key: 'data_spotkania', label: 'Data' },
  ],
};

export const FORM_FIELDS: Record<string, string[]> = {
  budynek: ['adres', 'liczba_pieter', 'liczba_mieszkan', 'rok_budowy'],
  mieszkanie: ['numer', 'metraz', 'liczba_pokoi', 'id_budynku'],
  czlonek: ['imie', 'nazwisko', 'telefon', 'email', 'pesel', 'id_mieszkania'],
  pracownik: ['imie', 'nazwisko', 'stanowisko', 'telefon', 'email'],
  naprawa: ['opis', 'status', 'data_zgloszenia', 'id_mieszkania', 'id_pracownika'],
  uslugi: ['nazwa_uslugi', 'jednostka_miary', 'cena_za_jednostke'],
  oplata: ['id_mieszkania', 'id_uslugi', 'zuzycie', 'kwota', 'status_oplaty'],
  umowa: ['id_mieszkania', 'id_czlonka', 'data_zawarcia', 'data_wygasniecia', 'typ_umowy'],
  konto_bankowe: ['id_czlonka', 'numer_konta', 'saldo'],
  spotkanie_mieszkancow: ['temat', 'miejsce', 'data_spotkania'],
};

export const DROPDOWN_FIELDS = [
  'id_budynku',
  'id_mieszkania',
  'id_pracownika',
  'id_uslugi',
  'id_czlonka',
  'status',
  'status_oplaty',
  'jednostka_miary',
  'typ_umowy',
] as const;

export const NUMERIC_FIELDS = [
  'kwota',
  'zuzycie',
  'metraz',
  'liczba_pieter',
  'liczba_mieszkan',
  'rok_budowy',
  'liczba_pokoi',
  'cena_za_jednostke',
  'saldo',
] as const;

export function getPrimaryKeyField(record: Record<string, unknown>): string | undefined {
  return Object.keys(record).find(key => key.toLowerCase().startsWith('id_'));
}

export function formatDateForInput(value: string | null | undefined): string {
  if (!value) return '';
  return value.split('T')[0];
}
