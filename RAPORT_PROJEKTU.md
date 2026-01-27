# System Zarzadzania Spoldzielnia Mieszkaniowa
## Raport Projektu - Bazy Danych 2 (LAB 7-13)

**Autor:** Maksym Mariukha  
**Grupa:** 2ID13A  
**Data:** Styczen 2026

---

## Spis tresci

1. [Opis tematyki projektu](#1-opis-tematyki-projektu)
2. [Architektura systemu](#2-architektura-systemu)
3. [Kluczowe mozliwosci](#3-kluczowe-mozliwosci)
4. [Kompilacja i uruchomienie](#4-kompilacja-i-uruchomienie)
5. [Instrukcja obslugi](#5-instrukcja-obslugi)
6. [Elementy laboratoriow LAB 7-13](#6-elementy-laboratoriow-lab-7-13)
7. [Podsumowanie i wnioski](#7-podsumowanie-i-wnioski)

---

## 1. Opis tematyki projektu

### 1.1. Cel projektu

Projekt stanowi kompleksowy system informatyczny do zarzadzania spoldzielnia mieszkaniowa. System umozliwia:

- **Zarzadzanie budynkami i mieszkaniami** - ewidencja nieruchomosci
- **Obsluge czlonkow spoldzielni** - rejestracja, aktualizacja danych
- **Rozliczanie oplat** - naliczanie, monitoring platnosci
- **Zarzadzanie naprawami** - zgloszenia, przydzielanie pracownikow
- **Raportowanie** - statystyki, analizy, zestawienia

### 1.2. Zakres funkcjonalny

| Modul | Opis |
|-------|------|
| **Panel Administratora** | Pelne zarzadzanie danymi, raporty, narzedzia |
| **Portal Mieszkanca** | Podglad oplat, zglaszanie napraw, spotkania |
| **System raportow** | Widoki, agregacje, statystyki |
| **Narzedzia administracyjne** | Audyt, procedury, pakiety |

### 1.3. Technologie

| Warstwa | Technologia |
|---------|-------------|
| **Baza danych** | Oracle Database 21c XE |
| **Backend** | Python 3.11, FastAPI |
| **Frontend** | React 18, TypeScript, Vite |
| **Konteneryzacja** | Docker, Docker Compose |

---

## 2. Architektura systemu

### 2.1. Diagram architektury

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│              React + TypeScript + Vite                       │
│                     (port 5173)                              │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP REST API
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│              Python + FastAPI + oracledb                     │
│                     (port 8000)                              │
└─────────────────────────┬───────────────────────────────────┘
                          │ Oracle Protocol
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      BAZA DANYCH                             │
│                   Oracle Database 21c XE                     │
│                     (port 1521)                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ TABELE: budynek, mieszkanie, czlonek, pracownik,    │    │
│  │         uslugi, naprawa, oplata, umowa, spotkanie,  │    │
│  │         konto_spoldzielni, log_zmian_czlonka        │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ WIDOKI: v_mieszkania_info, v_oplaty_summary,        │    │
│  │         v_naprawy_status, v_moje_oplaty, itd.       │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ PROCEDURY/FUNKCJE: dodaj_czlonka, zwieksz_oplaty,   │    │
│  │                    pobierz_czlonkow_budynku, itd.   │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ PAKIETY: coop_pkg, coop_crud_pkg                    │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ TRIGGERY: trg_audit_czlonek, trg_walidacja_oplaty   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2. Struktura plikow projektu

```
CoopManager/
├── backend/
│   ├── main.py          # FastAPI - endpointy REST API
│   ├── db.py            # Polaczenie z baza danych
│   ├── Dockerfile       # Kontener backend
│   └── requirements.txt # Zaleznosci Python
├── frontend/
│   ├── App.tsx          # Glowny komponent React
│   ├── components/      # Komponenty UI
│   ├── pages/           # Strony aplikacji
│   ├── services/api.ts  # Klient API
│   └── Dockerfile       # Kontener frontend
├── INIT_DB.sql          # Skrypt inicjalizacji bazy danych
├── docker-compose.yml   # Konfiguracja Docker
└── README.md            # Dokumentacja projektu
```

---

## 3. Kluczowe mozliwosci

### 3.1. Panel Administratora

| Funkcja | Opis | Laboratorium |
|---------|------|--------------|
| **Pulpit Glowny** | Statystyki, wykresy, podsumowania | LAB 8, LAB 9 |
| **Zarzadzanie tabelami** | CRUD: budynki, mieszkania, czlonkowie, itd. | LAB 7 |
| **Wyszukiwanie** | Filtrowanie przez baze danych (WHERE LIKE) | LAB 8 |
| **Raporty** | Widoki, agregacje, rozne typy JOIN | LAB 9, LAB 10 |
| **Narzedzia** | Procedury, logi audytu, statystyki | LAB 11, LAB 12, LAB 13 |

### 3.2. Portal Mieszkanca

| Funkcja | Opis | Laboratorium |
|---------|------|--------------|
| **Moje oplaty** | Lista oplat z widoku v_moje_oplaty | LAB 9 |
| **Moje naprawy** | Zgloszenia, status napraw | LAB 7, LAB 11 |
| **Zglos naprawe** | Formularz zgloszenia (procedura) | LAB 11 |
| **Spotkania** | Nadchodzace spotkania mieszkancow | LAB 7 |
| **Zuzycie mediow** | Agregacje GROUP BY, SUM | LAB 8 |

### 3.3. Bezpieczenstwo

- **Logowanie administratora** - tabela uzytkownicy
- **Logowanie mieszkanca** - weryfikacja email + numer mieszkania
- **Widok INVISIBLE** - ukrywa PESEL i telefon przy SELECT *
- **Trigger audytu** - automatyczne logowanie zmian

---

## 4. Kompilacja i uruchomienie

### 4.1. Wymagania systemowe

| Komponent | Minimalna wersja |
|-----------|------------------|
| Docker | 20.10+ |
| Docker Compose | 2.0+ |
| Wolne porty | 1521, 8000, 5173 |
| RAM | 4 GB |
| Dysk | 10 GB |

### 4.2. Uruchomienie z Docker Compose

```bash
# 1. Sklonuj repozytorium
git clone https://github.com/mariukha/CoopManager.git
cd CoopManager

# 2. Uruchom wszystkie kontenery
docker-compose up -d

# 3. Sprawdz status
docker-compose ps

# 4. Poczekaj na inicjalizacje bazy (~2-3 minuty)
docker-compose logs -f oracle-db
```

### 4.3. Dostep do aplikacji

| Komponent | URL | Dane logowania |
|-----------|-----|----------------|
| **Frontend** | http://localhost:5173 | - |
| **Backend API** | http://localhost:8000 | - |
| **Admin** | http://localhost:5173 | login: `admin`, haslo: `admin123` |
| **Mieszkaniec** | http://localhost:5173 | email: `jan.kowalski@email.pl`, nr: `1A` |

### 4.4. Uruchomienie lokalne (bez Docker)

```bash
# Backend
cd backend
pip install -r requirements.txt
python main.py

# Frontend (nowe okno terminala)
cd frontend
npm install
npm run dev
```

### 4.5. Inicjalizacja bazy danych

Skrypt `INIT_DB.sql` jest automatycznie wykonywany przy starcie kontenera Oracle. Zawiera:
- Tworzenie wszystkich tabel (LAB 7)
- Widoki proste i zmaterializowane (LAB 9)
- Widoki z roznymi typami JOIN (LAB 10)
- Procedury i funkcje (LAB 11)
- Pakiety (LAB 12)
- Triggery (LAB 13)
- Dane testowe

---

## 5. Instrukcja obslugi

### 5.1. Logowanie jako Administrator

1. Otworz przegladarke: `http://localhost:5173`
2. Wybierz zakladke "Administrator"
3. Wpisz dane: `admin` / `admin123`
4. Kliknij "Zaloguj"

> **[SCREENSHOT 1]** Ekran logowania z wyborem roli

### 5.2. Panel Administratora - Pulpit Glowny

Po zalogowaniu widoczny jest pulpit z:
- Kartami statystyk (liczba budynkow, mieszkan, czlonkow)
- Wykresem oplat
- Lista ostatnich zdarzen

> **[SCREENSHOT 2]** Pulpit glowny administratora

### 5.3. Zarzadzanie danymi (CRUD)

1. Wybierz zakladke z menu bocznego (np. "Budynki")
2. **Dodawanie:** Kliknij "Dodaj rekord"
3. **Edycja:** Kliknij ikone olowka przy rekordzie
4. **Usuwanie:** Kliknij ikone kosza lub zaznacz wiele i "Usun wybrane"
5. **Wyszukiwanie:** Wpisz tekst w pole "Szukaj..." (filtruje przez baze danych)

> **[SCREENSHOT 3]** Lista budynkow z formularzem dodawania

### 5.4. Raporty

1. Przejdz do "Raporty" w menu
2. Dostepne widoki:
   - Mieszkania z adresem budynku
   - Podsumowanie oplat
   - Status napraw
   - Widoki z roznymi JOIN

> **[SCREENSHOT 4]** Strona raportow z widokami

### 5.5. Narzedzia Administratora

1. Przejdz do "Narzedzia" w menu
2. Dostepne funkcje:
   - **Zwieksz ceny** - wywoluje procedure zwieksz_oplaty
   - **Dodaj oplate** - wywoluje funkcje dodaj_oplate_fn
   - **Historia zmian** - logi audytu z triggera
   - **Statystyki tabel** - dynamiczny SQL (policz_rekordy)

> **[SCREENSHOT 5]** Narzedzia administratora

### 5.6. Portal Mieszkanca

1. Wyloguj sie z panelu admina
2. Wybierz zakladke "Mieszkaniec"
3. Wpisz email i numer mieszkania (np. `jan.kowalski@email.pl`, `1A`)
4. Po zalogowaniu widoczny jest pulpit z:
   - Moje oplaty
   - Moje naprawy
   - Nadchodzace spotkania
   - Formularz zgloszenia naprawy

> **[SCREENSHOT 6]** Portal mieszkanca

---

## 6. Elementy laboratoriow LAB 7-13

### 6.1. LAB 7: CREATE TABLE, PRIMARY KEY, FOREIGN KEY, INSERT, UPDATE, DELETE

#### 6.1.1. Tabele

| Tabela | Opis | Klucze obce |
|--------|------|-------------|
| `budynek` | Dane budynkow | - |
| `mieszkanie` | Lokale mieszkalne | FK -> budynek |
| `czlonek` | Czlonkowie spoldzielni | FK -> mieszkanie |
| `pracownik` | Pracownicy spoldzielni | - |
| `uslugi` | Cennik uslug | - |
| `naprawa` | Zgloszenia napraw | FK -> mieszkanie, pracownik |
| `oplata` | Naliczone oplaty | FK -> mieszkanie, uslugi |
| `umowa` | Umowy najmu/wlasnosci | FK -> mieszkanie, czlonek |
| `spotkanie_mieszkancow` | Harmonogram spotkan | - |
| `konto_spoldzielni` | Konta bankowe | FK -> uslugi |
| `log_zmian_czlonka` | Logi audytu | - |
| `uzytkownicy` | Dane logowania admina | - |

#### 6.1.2. Przyklad CREATE TABLE

```sql
-- LAB 7: Tabela czlonek - dane czlonkow spoldzielni z wartoscia domyslna daty
-- Interfejs: Panel Administratora -> Czlonkowie
CREATE TABLE czlonek (
    id_czlonka NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    id_mieszkania NUMBER NOT NULL,
    imie VARCHAR2(100) NOT NULL,
    nazwisko VARCHAR2(100) NOT NULL,
    pesel VARCHAR2(11),
    telefon VARCHAR2(20),
    email VARCHAR2(100),
    data_przystapienia DATE DEFAULT SYSDATE,
    CONSTRAINT fk_czlonek_mieszkanie FOREIGN KEY (id_mieszkania) 
        REFERENCES mieszkanie(id_mieszkania) ON DELETE CASCADE
);
```

#### 6.1.3. ALTER TABLE ADD

```sql
-- LAB 7: ALTER TABLE ADD - dodawanie nowych kolumn
ALTER TABLE naprawa ADD (uwagi VARCHAR2(500));
ALTER TABLE naprawa ADD (priorytet VARCHAR2(20) DEFAULT 'sredni');
ALTER TABLE budynek ADD (typ_budynku VARCHAR2(50) DEFAULT 'blok');
```

#### 6.1.4. Operacje CRUD w API

| Operacja | Endpoint | Metoda HTTP |
|----------|----------|-------------|
| SELECT | `/data/{table}` | GET |
| INSERT | `/data/{table}` | POST |
| UPDATE | `/data/{table}/{id_field}/{id_value}` | PUT |
| DELETE | `/data/{table}/{id_field}/{id_value}` | DELETE |

---

### 6.2. LAB 8: SELECT z WHERE, ORDER BY, GROUP BY, AVG, SUM, COUNT, CASE

#### 6.2.1. SELECT z WHERE LIKE (wyszukiwanie)

```sql
-- LAB 8: Wyszukiwanie tekstowe przez baze danych
SELECT * FROM czlonek 
WHERE UPPER(IMIE) LIKE UPPER('%Kowalski%') 
   OR UPPER(NAZWISKO) LIKE UPPER('%Kowalski%')
   OR UPPER(EMAIL) LIKE UPPER('%Kowalski%');
```

**API Endpoint:** `GET /data/{table}/search?q=Kowalski`

#### 6.2.2. GROUP BY z funkcjami agregujacymi

```sql
-- LAB 8: Raport zbiorczy z agregacja
SELECT 
    u.nazwa_uslugi,
    u.jednostka_miary,
    NVL(SUM(o.zuzycie), 0) as total_zuzycie,
    NVL(SUM(o.kwota), 0) as total_kwota
FROM uslugi u
LEFT JOIN oplata o ON u.id_uslugi = o.id_uslugi
GROUP BY u.id_uslugi, u.nazwa_uslugi, u.jednostka_miary
ORDER BY total_kwota DESC;
```

**API Endpoint:** `GET /reports/summary`

#### 6.2.3. COUNT, AVG, SUM

```python
# W backendzie (main.py)
cursor.execute("SELECT COUNT(*) FROM czlonek")
cursor.execute("SELECT COUNT(*) FROM oplata WHERE status_oplaty = 'nieoplacone'")
cursor.execute("SELECT NVL(SUM(kwota), 0) FROM oplata")
```

---

### 6.3. LAB 9: VIEW, MATERIALIZED VIEW, INVISIBLE columns

#### 6.3.1. Widok prosty

```sql
-- LAB 9: Widok prosty - mieszkania z adresem budynku
CREATE OR REPLACE VIEW v_mieszkania_info AS
SELECT m.id_mieszkania, m.numer, m.metraz, m.liczba_pokoi, b.adres
FROM mieszkanie m
JOIN budynek b ON m.id_budynku = b.id_budynku;
```

**API Endpoint:** `GET /views/mieszkania-info`

#### 6.3.2. Widok z agregacja i CASE

```sql
-- LAB 9: Widok z agregacja (GROUP BY, SUM, COUNT, CASE)
CREATE OR REPLACE VIEW v_oplaty_summary AS
SELECT 
    m.id_mieszkania,
    m.numer,
    COUNT(o.id_oplaty) AS liczba_oplat,
    NVL(SUM(o.kwota), 0) AS suma_oplat,
    NVL(SUM(CASE WHEN o.status_oplaty = 'nieoplacone' THEN o.kwota ELSE 0 END), 0) AS zaleglosci
FROM mieszkanie m
LEFT JOIN oplata o ON m.id_mieszkania = o.id_mieszkania
GROUP BY m.id_mieszkania, m.numer;
```

**API Endpoint:** `GET /views/oplaty-summary`

#### 6.3.3. Widok zmaterializowany (MATERIALIZED VIEW)

```sql
-- LAB 9: Widok zmaterializowany - statystyki dla pulpitu
CREATE MATERIALIZED VIEW mv_dashboard_stats
BUILD IMMEDIATE
REFRESH FORCE ON DEMAND
AS
SELECT 
    (SELECT COUNT(*) FROM budynek) AS liczba_budynkow,
    (SELECT COUNT(*) FROM mieszkanie) AS liczba_mieszkan,
    (SELECT COUNT(*) FROM czlonek) AS liczba_czlonkow,
    (SELECT COUNT(*) FROM pracownik) AS liczba_pracownikow,
    (SELECT COUNT(*) FROM naprawa WHERE status = 'zgloszona') AS naprawy_oczekujace,
    (SELECT COUNT(*) FROM naprawa WHERE status = 'wykonana') AS naprawy_wykonane,
    (SELECT NVL(SUM(kwota), 0) FROM oplata WHERE status_oplaty = 'oplacone') AS suma_oplaconych,
    (SELECT NVL(SUM(kwota), 0) FROM oplata WHERE status_oplaty = 'nieoplacone') AS suma_zaleglosci
FROM DUAL;
```

**API Endpoint:** `GET /views/dashboard-stats`

#### 6.3.4. Widok z kolumnami INVISIBLE

```sql
-- LAB 9: Widok z kolumnami INVISIBLE - ukrywa PESEL i telefon
CREATE OR REPLACE VIEW v_czlonek_bezpieczny (
    id_czlonka, imie, nazwisko, email, data_przystapienia,
    pesel INVISIBLE,
    telefon INVISIBLE
) AS
SELECT id_czlonka, imie, nazwisko, email, data_przystapienia, pesel, telefon
FROM czlonek;
```

- `SELECT * FROM v_czlonek_bezpieczny` - **nie pokazuje** pesel i telefon
- `SELECT pesel, telefon FROM v_czlonek_bezpieczny` - **pokazuje** (jawne podanie)

**API Endpoints:**
- `GET /views/czlonek-bezpieczny` - bez PESEL i telefonu
- `GET /views/czlonek-pelne-dane/{id}` - z PESEL i telefonem

---

### 6.4. LAB 10: Rozne typy JOIN

#### 6.4.1. RIGHT JOIN

```sql
-- LAB 10: RIGHT JOIN - wszyscy pracownicy z ich naprawami
CREATE OR REPLACE VIEW v_pracownicy_naprawy AS
SELECT 
    p.id_pracownika,
    p.imie || ' ' || p.nazwisko AS pracownik,
    p.stanowisko,
    n.id_naprawy,
    n.status AS status_naprawy
FROM naprawa n
RIGHT JOIN pracownik p ON n.id_pracownika = p.id_pracownika;
```

**API Endpoint:** `GET /views/pracownicy-naprawy`

#### 6.4.2. FULL OUTER JOIN

```sql
-- LAB 10: FULL OUTER JOIN - wszystkie oplaty i uslugi
CREATE OR REPLACE VIEW v_oplaty_uslugi_full AS
SELECT 
    o.id_oplaty, o.kwota, o.status_oplaty,
    u.id_uslugi, u.nazwa_uslugi, u.cena_za_jednostke
FROM oplata o
FULL OUTER JOIN uslugi u ON o.id_uslugi = u.id_uslugi;
```

**API Endpoint:** `GET /views/oplaty-uslugi-full`

#### 6.4.3. CROSS JOIN

```sql
-- LAB 10: CROSS JOIN - wszystkie kombinacje budynkow i uslug
CREATE OR REPLACE VIEW v_budynki_uslugi_cross AS
SELECT b.id_budynku, b.adres, u.id_uslugi, u.nazwa_uslugi
FROM budynek b
CROSS JOIN uslugi u;
```

**API Endpoint:** `GET /views/budynki-uslugi-cross`

#### 6.4.4. SELF JOIN

```sql
-- LAB 10: SELF JOIN - pary pracownikow na tym samym stanowisku
CREATE OR REPLACE VIEW v_pracownicy_koledzy AS
SELECT 
    p1.id_pracownika AS pracownik_id,
    p1.imie || ' ' || p1.nazwisko AS pracownik,
    p2.id_pracownika AS kolega_id,
    p2.imie || ' ' || p2.nazwisko AS kolega,
    p1.stanowisko
FROM pracownik p1
JOIN pracownik p2 ON p1.stanowisko = p2.stanowisko
WHERE p1.id_pracownika < p2.id_pracownika;
```

**API Endpoint:** `GET /views/pracownicy-koledzy`

#### 6.4.5. JOIN 3 tabel

```sql
-- LAB 10: JOIN 3 tabel - czlonek + mieszkanie + budynek
CREATE OR REPLACE VIEW v_czlonkowie_pelne_info AS
SELECT 
    c.id_czlonka, c.imie, c.nazwisko, c.telefon,
    m.numer AS numer_mieszkania, m.metraz,
    b.adres AS adres_budynku, b.liczba_pieter
FROM czlonek c
INNER JOIN mieszkanie m ON c.id_mieszkania = m.id_mieszkania
INNER JOIN budynek b ON m.id_budynku = b.id_budynku;
```

**API Endpoint:** `GET /views/czlonkowie-pelne-info`

---

### 6.5. LAB 11: PROCEDURE, FUNCTION, SEQUENCE, CURSOR

#### 6.5.1. SEQUENCE

```sql
-- LAB 11: Sekwencja dla spotkan
CREATE SEQUENCE spotkanie_seq START WITH 1000 INCREMENT BY 1;
CREATE SEQUENCE naprawa_seq START WITH 1000 INCREMENT BY 1;
```

#### 6.5.2. Procedura INSERT

```sql
-- LAB 11: Procedura INSERT - dodaje nowego czlonka z walidacja
CREATE OR REPLACE PROCEDURE dodaj_czlonka(
    p_id_mieszkania IN NUMBER,
    p_imie IN VARCHAR2,
    p_nazwisko IN VARCHAR2,
    p_pesel IN VARCHAR2 DEFAULT NULL,
    p_telefon IN VARCHAR2 DEFAULT NULL,
    p_email IN VARCHAR2 DEFAULT NULL,
    p_id_czlonka OUT NUMBER
) AS
BEGIN
    INSERT INTO czlonek (id_mieszkania, imie, nazwisko, pesel, telefon, email)
    VALUES (p_id_mieszkania, p_imie, p_nazwisko, p_pesel, p_telefon, p_email)
    RETURNING id_czlonka INTO p_id_czlonka;
    COMMIT;
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        RAISE_APPLICATION_ERROR(-20002, 'Czlonek o takim identyfikatorze juz istnieje');
    WHEN OTHERS THEN
        RAISE_APPLICATION_ERROR(-20003, 'Blad podczas dodawania czlonka: ' || SQLERRM);
END;
```

**API Endpoint:** `POST /procedures/dodaj-czlonka`

#### 6.5.3. Procedura UPDATE

```sql
-- LAB 11: Procedura UPDATE - aktualizuje dane czlonka
CREATE OR REPLACE PROCEDURE aktualizuj_czlonka(
    p_id_czlonka IN NUMBER,
    p_imie IN VARCHAR2 DEFAULT NULL,
    p_nazwisko IN VARCHAR2 DEFAULT NULL,
    p_telefon IN VARCHAR2 DEFAULT NULL,
    p_email IN VARCHAR2 DEFAULT NULL,
    p_rows_updated OUT NUMBER
) AS
BEGIN
    UPDATE czlonek
    SET imie = NVL(p_imie, imie),
        nazwisko = NVL(p_nazwisko, nazwisko),
        telefon = NVL(p_telefon, telefon),
        email = NVL(p_email, email)
    WHERE id_czlonka = p_id_czlonka;
    p_rows_updated := SQL%ROWCOUNT;
    IF p_rows_updated = 0 THEN
        RAISE_APPLICATION_ERROR(-20004, 'Nie znaleziono czlonka o ID: ' || p_id_czlonka);
    END IF;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN ROLLBACK; RAISE;
END;
```

**API Endpoint:** `PUT /procedures/aktualizuj-czlonka/{id}`

#### 6.5.4. Procedura DELETE

```sql
-- LAB 11: Procedura DELETE - usuwa czlonka z bazy
CREATE OR REPLACE PROCEDURE usun_czlonka(
    p_id_czlonka IN NUMBER,
    p_rows_deleted OUT NUMBER
) AS
BEGIN
    DELETE FROM czlonek WHERE id_czlonka = p_id_czlonka;
    p_rows_deleted := SQL%ROWCOUNT;
    IF p_rows_deleted = 0 THEN
        RAISE_APPLICATION_ERROR(-20005, 'Nie znaleziono czlonka o ID: ' || p_id_czlonka);
    END IF;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN ROLLBACK; RAISE;
END;
```

**API Endpoint:** `DELETE /procedures/usun-czlonka/{id}`

#### 6.5.5. Funkcja z CURSOR

```sql
-- LAB 11: Funkcja z CURSOR - zwraca liste czlonkow budynku jako tekst
CREATE OR REPLACE FUNCTION pobierz_czlonkow_budynku(p_id_budynku NUMBER) 
RETURN VARCHAR2 AS
    v_wynik VARCHAR2(4000) := '';
    CURSOR c_czlonkowie IS
        SELECT c.imie, c.nazwisko
        FROM czlonek c
        JOIN mieszkanie m ON c.id_mieszkania = m.id_mieszkania
        WHERE m.id_budynku = p_id_budynku;
BEGIN
    FOR r IN c_czlonkowie LOOP
        v_wynik := v_wynik || r.imie || ' ' || r.nazwisko || '; ';
    END LOOP;
    RETURN v_wynik;
END;
```

**API Endpoint:** `GET /functions/members-of-building/{building_id}`

#### 6.5.6. Funkcja obliczajaca kwote

```sql
-- LAB 11: Funkcja dodajaca oplate - automatycznie oblicza kwote z zuzycia
CREATE OR REPLACE FUNCTION dodaj_oplate_fn(
    p_id_mieszkania IN NUMBER,
    p_id_uslugi IN NUMBER,
    p_zuzycie IN NUMBER
) RETURN NUMBER AS
    v_cena NUMBER;
    v_kwota NUMBER;
BEGIN
    SELECT cena_za_jednostke INTO v_cena FROM uslugi WHERE id_uslugi = p_id_uslugi;
    v_kwota := v_cena * p_zuzycie;
    INSERT INTO oplata (id_mieszkania, id_uslugi, kwota, zuzycie)
    VALUES (p_id_mieszkania, p_id_uslugi, v_kwota, p_zuzycie);
    COMMIT;
    RETURN v_kwota;
END;
```

**API Endpoint:** `POST /procedures/add-fee`

---

### 6.6. LAB 12: PACKAGE

#### 6.6.1. Pakiet coop_pkg

```sql
-- LAB 12: Pakiet coop_pkg - operacje na oplatach i naprawach
CREATE OR REPLACE PACKAGE coop_pkg IS
    PROCEDURE zwieksz_oplaty_pkg(p_procent NUMBER DEFAULT 10);
    FUNCTION policz_naprawy_pracownika(p_id_pracownika NUMBER) RETURN NUMBER;
    FUNCTION suma_oplat_mieszkania(p_id_mieszkania NUMBER) RETURN NUMBER;
END coop_pkg;
/

CREATE OR REPLACE PACKAGE BODY coop_pkg IS
    PROCEDURE zwieksz_oplaty_pkg(p_procent NUMBER DEFAULT 10) IS
    BEGIN
        UPDATE uslugi SET cena_za_jednostke = cena_za_jednostke * (1 + p_procent / 100);
        COMMIT;
    END zwieksz_oplaty_pkg;

    FUNCTION policz_naprawy_pracownika(p_id_pracownika NUMBER) RETURN NUMBER IS
        v_count NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_count FROM naprawa WHERE id_pracownika = p_id_pracownika;
        RETURN v_count;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN RETURN 0;
    END policz_naprawy_pracownika;
    
    FUNCTION suma_oplat_mieszkania(p_id_mieszkania NUMBER) RETURN NUMBER IS
        v_suma NUMBER;
    BEGIN
        SELECT NVL(SUM(kwota), 0) INTO v_suma FROM oplata WHERE id_mieszkania = p_id_mieszkania;
        RETURN v_suma;
    END suma_oplat_mieszkania;
END coop_pkg;
```

**API Endpoints:**
- `POST /procedures/increase-fees`
- `GET /functions/worker-repairs/{worker_id}`
- `GET /functions/apartment-fees/{apt_id}`

#### 6.6.2. Pakiet coop_crud_pkg

```sql
-- LAB 12: Pakiet coop_crud_pkg - operacje CRUD z obsluga wyjatkow
CREATE OR REPLACE PACKAGE coop_crud_pkg IS
    PROCEDURE insert_budynek(p_adres VARCHAR2, p_liczba_pieter NUMBER, p_rok_budowy NUMBER, p_id OUT NUMBER);
    PROCEDURE update_budynek(p_id NUMBER, p_adres VARCHAR2, p_liczba_pieter NUMBER);
    PROCEDURE delete_budynek(p_id NUMBER, p_deleted OUT NUMBER);
    FUNCTION pobierz_nazwisko_czlonka(p_id NUMBER) RETURN VARCHAR2;
    FUNCTION pobierz_adres_budynku(p_id NUMBER) RETURN VARCHAR2;
    FUNCTION statystyki_budynku(p_id_budynku NUMBER) RETURN VARCHAR2;
END coop_crud_pkg;
```

**API Endpoints:**
- `POST /package/insert-budynek`
- `PUT /package/update-budynek/{id}`
- `DELETE /package/delete-budynek/{id}`
- `GET /package/nazwisko-czlonka/{id}`
- `GET /package/adres-budynku/{id}`
- `GET /package/statystyki-budynku/{id}`

---

### 6.7. LAB 13: TRIGGER, EXECUTE IMMEDIATE

#### 6.7.1. Trigger audytu

```sql
-- LAB 13: Trigger audytu - automatycznie loguje INSERT/UPDATE/DELETE na czlonkach
CREATE OR REPLACE TRIGGER trg_audit_czlonek
AFTER INSERT OR UPDATE OR DELETE ON czlonek
FOR EACH ROW
BEGIN
    IF INSERTING THEN
        INSERT INTO log_zmian_czlonka (id_czlonka, operacja, nowe_dane)
        VALUES (:NEW.id_czlonka, 'INSERT', :NEW.imie || ' ' || :NEW.nazwisko);
    ELSIF UPDATING THEN
        INSERT INTO log_zmian_czlonka (id_czlonka, operacja, stare_dane, nowe_dane)
        VALUES (:OLD.id_czlonka, 'UPDATE', :OLD.imie || ' ' || :OLD.nazwisko, 
                :NEW.imie || ' ' || :NEW.nazwisko);
    ELSIF DELETING THEN
        INSERT INTO log_zmian_czlonka (id_czlonka, operacja, stare_dane)
        VALUES (:OLD.id_czlonka, 'DELETE', :OLD.imie || ' ' || :OLD.nazwisko);
    END IF;
END;
```

**API Endpoint:** `GET /system/audit-logs`

> **[SCREENSHOT 7]** Strona z logami audytu

#### 6.7.2. Trigger walidacji

```sql
-- LAB 13: Trigger walidacji - blokuje ujemne kwoty oplat
CREATE OR REPLACE TRIGGER trg_walidacja_oplaty
BEFORE INSERT OR UPDATE OF kwota ON oplata
FOR EACH ROW
BEGIN
    IF :NEW.kwota < 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Kwota oplaty nie moze byc ujemna');
    END IF;
END;
```

#### 6.7.3. Dynamic SQL (EXECUTE IMMEDIATE)

```sql
-- LAB 13: Funkcja z dynamicznym SQL - zlicza rekordy w dowolnej tabeli
CREATE OR REPLACE FUNCTION policz_rekordy(p_nazwa_tabeli VARCHAR2) 
RETURN NUMBER AS
    v_sql VARCHAR2(200);
    v_wynik NUMBER;
BEGIN
    v_sql := 'SELECT COUNT(*) FROM ' || p_nazwa_tabeli;
    EXECUTE IMMEDIATE v_sql INTO v_wynik;
    RETURN v_wynik;
EXCEPTION
    WHEN OTHERS THEN RETURN -1;
END;
```

**API Endpoint:** `GET /functions/count-records/{table_name}`

---

## 7. Podsumowanie i wnioski

### 7.1. Zrealizowane elementy

| Laboratorium | Element | Status |
|--------------|---------|--------|
| **LAB 7** | CREATE TABLE, PRIMARY KEY, FOREIGN KEY | 12 tabel |
| **LAB 7** | INSERT, UPDATE, DELETE | CRUD API |
| **LAB 7** | ALTER TABLE ADD | 3 nowe kolumny |
| **LAB 8** | SELECT z WHERE, ORDER BY | Wyszukiwanie |
| **LAB 8** | GROUP BY, AVG, SUM, COUNT, MAX, MIN | Raporty |
| **LAB 8** | CASE | w widokach |
| **LAB 9** | VIEW (proste i zlozone) | 10 widokow |
| **LAB 9** | MATERIALIZED VIEW | 2 widoki zmaterializowane |
| **LAB 9** | INVISIBLE columns | v_czlonek_bezpieczny |
| **LAB 10** | INNER JOIN | zrealizowano |
| **LAB 10** | LEFT JOIN | zrealizowano |
| **LAB 10** | RIGHT JOIN | v_pracownicy_naprawy |
| **LAB 10** | FULL OUTER JOIN | v_oplaty_uslugi_full |
| **LAB 10** | CROSS JOIN | v_budynki_uslugi_cross |
| **LAB 10** | SELF JOIN | v_pracownicy_koledzy |
| **LAB 10** | JOIN 3 tabel | v_czlonkowie_pelne_info |
| **LAB 11** | SEQUENCE | spotkanie_seq, naprawa_seq |
| **LAB 11** | PROCEDURE (INSERT, UPDATE, DELETE) | 5 procedur |
| **LAB 11** | FUNCTION z CURSOR | pobierz_czlonkow_budynku |
| **LAB 11** | Obsluga wyjatkow | wszystkie procedury |
| **LAB 12** | PACKAGE specyfikacja + body | coop_pkg |
| **LAB 12** | PACKAGE z obsluga wyjatkow | coop_crud_pkg |
| **LAB 13** | TRIGGER AFTER (audyt) | trg_audit_czlonek |
| **LAB 13** | TRIGGER BEFORE (walidacja) | trg_walidacja_oplaty |
| **LAB 13** | EXECUTE IMMEDIATE | policz_rekordy |

### 7.2. Wnioski

1. **Integracja bazy danych z aplikacja** - Wszystkie elementy LAB 7-13 zostaly zintegrowane z dzialajaca aplikacja webowa, co pozwala na praktyczne wykorzystanie poznanych technologii.

2. **Architektura REST API** - Kazdy element bazy danych (widok, procedura, funkcja, pakiet) jest dostepny przez dedykowany endpoint REST, co umozliwia latwa integracje z dowolnym frontendem.

3. **Bezpieczenstwo danych** - Zastosowano widoki z kolumnami INVISIBLE do ukrywania wrazliwych danych (PESEL, telefon) oraz trigger audytu do sledzenia zmian.

4. **Optymalizacja wydajnosci** - Widoki zmaterializowane (MATERIALIZED VIEW) keszuja dane statystyczne, co przyspiesza ladowanie pulpitu glownego.

5. **Skalowalnoscm** - Konteneryzacja z Docker umozliwia latwe wdrozenie i skalowanie systemu.

### 7.3. Mozliwosci rozwoju

- Integracja z systemem platnosci online
- Aplikacja mobilna dla mieszkancow
- System powiadomien email/SMS
- Rozbudowa raportow o wykresy i eksport do PDF
- Integracja z systemami smart home

---

## Zalaczniki - Lista wymaganych screenshotow

| Nr | Opis | Strona |
|----|------|--------|
| 1 | Ekran logowania z wyborem roli | Strona logowania |
| 2 | Pulpit glowny administratora | Panel Admin -> Dashboard |
| 3 | Lista budynkow z formularzem dodawania | Panel Admin -> Budynki |
| 4 | Strona raportow z widokami | Panel Admin -> Raporty |
| 5 | Narzedzia administratora | Panel Admin -> Narzedzia |
| 6 | Portal mieszkanca | Portal Mieszkanca |
| 7 | Strona z logami audytu | Narzedzia -> Historia zmian |

---

**Repozytorium GitHub:** https://github.com/mariukha/CoopManager

**Data utworzenia raportu:** Styczen 2026
