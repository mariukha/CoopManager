# ================================================================================
# BACKEND API - SYSTEM ZARZADZANIA SPOLDZIELNIA MIESZKANIOWA
# Plik: main.py
# Opis: FastAPI backend z elementami Lab 7-13
# ================================================================================

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
from db import get_cursor, get_connection
import time
import traceback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lista dozwolonych tabel (LAB 7)
VALID_TABLES = ["budynek", "mieszkanie", "czlonek", "pracownik", "naprawa", "uslugi", "oplata", "umowa", "konto_spoldzielni", "spotkanie_mieszkancow"]


# ================================================================================
# FUNKCJE POMOCNICZE
# ================================================================================

def init_database():
    """Sprawdza czy baza danych jest zainicjalizowana"""
    max_retries = 30
    for attempt in range(max_retries):
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM user_tables WHERE table_name = 'BUDYNEK'")
            if cursor.fetchone()[0] > 0:
                print("Database already initialized (BUDYNEK table exists)!")
                cursor.close()
                conn.close()
                return
            cursor.close()
            conn.close()
            if attempt < max_retries - 1:
                print(f"Waiting for database schema... attempt {attempt + 1}/{max_retries}")
                time.sleep(5)
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"Waiting for database connection... attempt {attempt + 1}/{max_retries}")
                time.sleep(5)
            else:
                print(f"Database connection failed: {e}")


@app.on_event("startup")
async def startup_event():
    print("Starting application...")
    init_database()


def translate_oracle_error(error_msg: str) -> str:
    """Tlumaczenie bledow Oracle na jezyk polski"""
    error_msg = str(error_msg)
    if "ORA-00001" in error_msg:
        return "Rekord o takim identyfikatorze już istnieje."
    if "ORA-02291" in error_msg:
        return "Nie można dodać rekordu - brak powiązanego rekordu w tabeli nadrzędnej."
    if "ORA-02292" in error_msg:
        return "Nie można usunąć - istnieją powiązane rekordy w innych tabelach."
    if "ORA-01400" in error_msg:
        return "Brak wymaganej wartości w polu obowiązkowym."
    if "ORA-01407" in error_msg:
        return "Pole obowiązkowe nie może być puste."
    if "ORA-01722" in error_msg:
        return "Błędny format liczby."
    if "ORA-01830" in error_msg or "ORA-01861" in error_msg:
        return "Nieprawidłowy format daty."
    if "ORA-01438" in error_msg:
        return "Wartość liczbowa przekracza dozwolony zakres."
    if "ORA-12899" in error_msg:
        return "Wprowadzony tekst jest za długi."
    if "ORA-00942" in error_msg:
        return "Tabela nie istnieje w bazie danych."
    if "ORA-00904" in error_msg:
        return "Nieprawidłowa nazwa kolumny."
    if "ORA-02449" in error_msg:
        return "Nie można usunąć tabeli - istnieją klucze obce."
    if "constraint" in error_msg.lower():
        return "Operacja narusza reguły integralności danych."
    return f"Błąd bazy danych: {error_msg[:200]}"


def serialize_row(row: tuple, columns: list) -> dict:
    """Serializacja wiersza do slownika JSON"""
    result = {}
    for col_name, value in zip(columns, row):
        if isinstance(value, datetime):
            result[col_name] = value.strftime("%Y-%m-%d %H:%M:%S")
        else:
            result[col_name] = value
    return result


def convert_date_value(key: str, value):
    """Konwersja wartosci daty"""
    if value is None or value == '':
        return None
    if 'data' in key.lower() and isinstance(value, str) and '-' in value:
        return datetime.strptime(value.split('T')[0], '%Y-%m-%d')
    return value


# ================================================================================
# MODELE PYDANTIC (walidacja danych wejsciowych)
# ================================================================================

class LoginRequest(BaseModel):
    login: str
    haslo: str

class ResidentLoginRequest(BaseModel):
    email: str
    numer: str

class RecordData(BaseModel):
    data: dict[str, Any]

class ProcedureRequest(BaseModel):
    procent: Optional[float] = None
    id_mieszkania: Optional[int] = None
    id_uslugi: Optional[int] = None
    zuzycie: Optional[float] = None

class CzlonekCreate(BaseModel):
    id_mieszkania: int
    imie: str
    nazwisko: str
    pesel: Optional[str] = None
    telefon: Optional[str] = None
    email: Optional[str] = None

class CzlonekUpdate(BaseModel):
    imie: Optional[str] = None
    nazwisko: Optional[str] = None
    telefon: Optional[str] = None
    email: Optional[str] = None

class SpotkanieCreate(BaseModel):
    temat: str
    miejsce: str
    data: Optional[str] = None

class BudynekCreate(BaseModel):
    adres: str
    liczba_pieter: int
    rok_budowy: int

class RepairRequest(BaseModel):
    id_mieszkania: int
    opis: str


# ================================================================================
# LAB 7: PODSTAWOWE OPERACJE CRUD (SELECT, INSERT, UPDATE, DELETE)
# Strona: Panel Administratora -> wszystkie zakladki z tabelami
# ================================================================================

@app.get("/health")
async def health_check():
    """Sprawdzenie zdrowia serwera"""
    return {"status": "ok"}


# LAB 7: SELECT - logowanie administratora
# Strona: Strona logowania administratora
@app.post("/login")
async def login(req: LoginRequest):
    """Logowanie administratora - SELECT z WHERE"""
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute(
                "SELECT id, login FROM uzytkownicy WHERE login = :1 AND haslo = :2",
                [req.login, req.haslo]
            )
            row = cursor.fetchone()
            if row:
                return {"success": True, "user": {"id": row[0], "login": row[1]}}
            raise HTTPException(status_code=401, detail="Nieprawidłowe dane logowania")
    except HTTPException:
        raise
    except Exception as e:
        print(f"LOGIN ERROR: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 7 + LAB 10: SELECT z JOIN 3 tabel - logowanie mieszkanca
# Strona: Strona logowania mieszkanca (Portal Mieszkanca)
@app.post("/login/resident")
async def login_resident(req: ResidentLoginRequest):
    """Logowanie mieszkanca - SELECT z JOIN 3 tabel (Lab 10)"""
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("""
                SELECT c.id_czlonka, c.imie, c.nazwisko, c.email, m.id_mieszkania, m.numer, b.adres
                FROM czlonek c
                JOIN mieszkanie m ON c.id_mieszkania = m.id_mieszkania
                JOIN budynek b ON m.id_budynku = b.id_budynku
                WHERE LOWER(c.email) = LOWER(:1)
                  AND m.numer = :2
            """, [req.email, req.numer])
            row = cursor.fetchone()
            if row:
                return {
                    "success": True,
                    "user": {
                        "id": row[0], "imie": row[1], "nazwisko": row[2],
                        "email": row[3], "apt_id": row[4], "apt_num": row[5], "adres": row[6]
                    }
                }
            raise HTTPException(status_code=401, detail="Nie znaleziono mieszkańca z podanym emailem i numerem mieszkania")
    except HTTPException:
        raise
    except Exception as e:
        print(f"LOGIN RESIDENT ERROR: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 7: SELECT * FROM tabela
# Strona: Panel Administratora -> kazda zakladka z tabela
@app.get("/data/{table}")
async def get_table_data(table: str):
    """Pobranie wszystkich rekordow z tabeli - SELECT *"""
    if table not in VALID_TABLES:
        raise HTTPException(status_code=400, detail="Nieprawidłowa tabela")
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute(f"SELECT * FROM {table}")
            columns = [col[0].lower() for col in cursor.description]
            rows = cursor.fetchall()
            return [serialize_row(row, columns) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 7: INSERT INTO tabela
# Strona: Panel Administratora -> kazda zakladka -> przycisk "Dodaj"
@app.post("/data/{table}")
async def insert_record(table: str, record: RecordData):
    """Dodanie nowego rekordu - INSERT INTO"""
    if table not in VALID_TABLES:
        raise HTTPException(status_code=400, detail="Nieprawidłowa tabela")
    try:
        with get_cursor() as (cursor, conn):
            data = {k: convert_date_value(k, v) for k, v in record.data.items()}
            data = {k: v for k, v in data.items() if v is not None or 'data' not in k.lower()}
            columns = list(data.keys())
            placeholders = [f":{i+1}" for i in range(len(columns))]
            values = list(data.values())
            sql = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
            print(f"SQL: {sql}, VALUES: {values}")
            cursor.execute(sql, values)
            conn.commit()
            return {"success": True, "message": "Rekord dodany"}
    except Exception as e:
        print(f"INSERT ERROR: {e}")
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 7: UPDATE tabela SET ... WHERE id = ?
# Strona: Panel Administratora -> kazda zakladka -> przycisk "Edytuj"
@app.put("/data/{table}/{id_field}/{id_value}")
async def update_record(table: str, id_field: str, id_value: str, record: RecordData):
    """Aktualizacja rekordu - UPDATE SET WHERE"""
    if table not in VALID_TABLES:
        raise HTTPException(status_code=400, detail="Nieprawidłowa tabela")
    try:
        with get_cursor() as (cursor, conn):
            fk_fields = ['id_mieszkania', 'id_uslugi', 'id_pracownika', 'id_budynku']
            data = {k: convert_date_value(k, v) for k, v in record.data.items() if not k.startswith('id_') or k in fk_fields}
            data = {k: v for k, v in data.items() if v is not None or 'data' not in k.lower()}
            set_clause = ", ".join([f"{k} = :{i+1}" for i, k in enumerate(data.keys())])
            values = list(data.values()) + [id_value]
            sql = f"UPDATE {table} SET {set_clause} WHERE {id_field} = :{len(values)}"
            print(f"UPDATE SQL: {sql}, VALUES: {values}")
            cursor.execute(sql, values)
            conn.commit()
            return {"success": True, "message": "Rekord zaktualizowany"}
    except Exception as e:
        print(f"UPDATE ERROR: {e}")
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 7: DELETE FROM tabela WHERE id = ?
# Strona: Panel Administratora -> kazda zakladka -> przycisk "Usun"
@app.delete("/data/{table}/{id_field}/{id_value}")
async def delete_record(table: str, id_field: str, id_value: str):
    """Usuniecie rekordu - DELETE FROM WHERE"""
    if table not in VALID_TABLES:
        raise HTTPException(status_code=400, detail="Nieprawidłowa tabela")
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute(f"DELETE FROM {table} WHERE {id_field} = :1", [id_value])
            conn.commit()
            return {"success": True, "message": "Rekord usunięty"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# ================================================================================
# LAB 8: SELECT z GROUP BY, AVG, SUM, COUNT, MAX, MIN, CASE, WHERE, ORDER BY
# Strona: Panel Administratora -> Raporty, Dashboard
# ================================================================================

# LAB 8: Raport podsumowujacy z GROUP BY, SUM, COUNT, JOIN
# Strona: Panel Administratora -> Raporty -> Podsumowanie
@app.get("/reports/summary")
async def get_summary_report():
    """Raport zbiorczy z agregacja (Lab 8: GROUP BY, SUM, COUNT)"""
    try:
        with get_cursor() as (cursor, conn):
            # LAB 8: GROUP BY z SUM i LEFT JOIN
            cursor.execute("""
                SELECT 
                    u.nazwa_uslugi,
                    u.jednostka_miary,
                    NVL(SUM(o.zuzycie), 0) as total_zuzycie,
                    NVL(SUM(o.kwota), 0) as total_kwota
                FROM uslugi u
                LEFT JOIN oplata o ON u.id_uslugi = o.id_uslugi
                GROUP BY u.id_uslugi, u.nazwa_uslugi, u.jednostka_miary
                ORDER BY total_kwota DESC
            """)
            
            services_summary = []
            total_revenue = 0
            for row in cursor.fetchall():
                services_summary.append({
                    "nazwa_uslugi": row[0],
                    "jednostka_miary": row[1] or "szt",
                    "total_zuzycie": float(row[2]) if row[2] else 0,
                    "total_kwota": float(row[3]) if row[3] else 0
                })
                total_revenue += float(row[3]) if row[3] else 0
            
            # LAB 8: COUNT(*)
            cursor.execute("SELECT COUNT(*) FROM czlonek")
            members_count = cursor.fetchone()[0]
            
            # LAB 8: COUNT z WHERE
            cursor.execute("SELECT COUNT(*) FROM oplata WHERE status_oplaty IN ('nieoplacone', 'zaleglosc')")
            arrears_count = cursor.fetchone()[0]
            
            # LAB 8: SELECT z JOIN i WHERE, ORDER BY
            cursor.execute("""
                SELECT 
                    b.adres, m.numer as numer_mieszkania, u.nazwa_uslugi, o.kwota, o.data_naliczenia
                FROM oplata o
                JOIN mieszkanie m ON o.id_mieszkania = m.id_mieszkania
                JOIN budynek b ON m.id_budynku = b.id_budynku
                LEFT JOIN uslugi u ON o.id_uslugi = u.id_uslugi
                WHERE o.status_oplaty IN ('nieoplacone', 'zaleglosc')
                ORDER BY o.kwota DESC
                FETCH FIRST 50 ROWS ONLY
            """)
            unpaid_details = []
            for row in cursor.fetchall():
                unpaid_details.append({
                    "adres": row[0], "numer_mieszkania": row[1], "nazwa_uslugi": row[2] or "Inne",
                    "kwota": float(row[3]) if row[3] else 0,
                    "data_platnosci": row[4].strftime("%Y-%m-%d") if row[4] else None
                })
            
            # LAB 13: Uzycie funkcji dynamicznego SQL
            table_stats = {}
            for table in ['budynek', 'mieszkanie', 'czlonek', 'pracownik', 'naprawa', 'oplata', 'umowa']:
                try:
                    count = cursor.callfunc("policz_rekordy", int, [table])
                    table_stats[table] = count
                except:
                    table_stats[table] = 0
            
            # LAB 9: Uzycie widoku v_oplaty_summary
            cursor.execute("SELECT * FROM v_oplaty_summary ORDER BY suma_oplat DESC FETCH FIRST 10 ROWS ONLY")
            cols = [col[0].lower() for col in cursor.description]
            apartments_summary = [serialize_row(row, cols) for row in cursor.fetchall()]
            
            # LAB 9: Uzycie widoku v_naprawy_status
            cursor.execute("SELECT * FROM v_naprawy_status")
            cols = [col[0].lower() for col in cursor.description]
            repairs_status = [serialize_row(row, cols) for row in cursor.fetchall()]
            
            return {
                "services_summary": services_summary,
                "total_revenue": total_revenue,
                "members_count": members_count,
                "arrears_count": arrears_count,
                "unpaid_details": unpaid_details,
                "table_stats": table_stats,
                "apartments_summary": apartments_summary,
                "repairs_status": repairs_status
            }
    except Exception as e:
        print(f"REPORT ERROR: {e}")
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# ================================================================================
# LAB 9: VIEWS (Widoki) - proste, zlozone, z agregacja
# Strona: Panel Administratora -> Raporty
# ================================================================================

# LAB 9: Widok prosty v_mieszkania_info
# Strona: Panel Administratora -> Raporty -> Mieszkania
@app.get("/views/mieszkania-info")
async def get_mieszkania_info():
    """Widok prosty - mieszkania z adresem budynku"""
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("SELECT * FROM v_mieszkania_info")
            columns = [col[0].lower() for col in cursor.description]
            return [serialize_row(row, columns) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 9: Widok zlozony v_oplaty_summary (GROUP BY, SUM, COUNT, CASE)
# Strona: Panel Administratora -> Dashboard, Raporty
@app.get("/views/oplaty-summary")
async def get_oplaty_summary():
    """Widok zlozony - podsumowanie oplat z agregacja"""
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("SELECT * FROM v_oplaty_summary")
            columns = [col[0].lower() for col in cursor.description]
            return [serialize_row(row, columns) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 9: Widok z CASE v_naprawy_status
# Strona: Panel Administratora -> Raporty -> Status napraw
@app.get("/views/naprawy-status")
async def get_naprawy_status():
    """Widok z CASE - naprawy z opisowym statusem"""
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("SELECT * FROM v_naprawy_status")
            columns = [col[0].lower() for col in cursor.description]
            return [serialize_row(row, columns) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# ================================================================================
# LAB 10: ROZNE TYPY JOIN (RIGHT, FULL OUTER, CROSS, SELF, 3 tabele)
# Strona: Panel Administratora -> Raporty -> Widoki z JOIN
# ================================================================================

# LAB 10: RIGHT JOIN - pracownicy z naprawami
# Strona: Panel Administratora -> Raporty -> Pracownicy i naprawy
@app.get("/views/pracownicy-naprawy")
async def get_pracownicy_naprawy():
    """Widok z RIGHT JOIN - wszyscy pracownicy z ich naprawami"""
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("SELECT * FROM v_pracownicy_naprawy")
            columns = [col[0].lower() for col in cursor.description]
            return [serialize_row(row, columns) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 10: FULL OUTER JOIN - oplaty z uslugami
# Strona: Panel Administratora -> Raporty -> Oplaty i uslugi
@app.get("/views/oplaty-uslugi-full")
async def get_oplaty_uslugi_full():
    """Widok z FULL OUTER JOIN - wszystkie oplaty i uslugi"""
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("SELECT * FROM v_oplaty_uslugi_full")
            columns = [col[0].lower() for col in cursor.description]
            return [serialize_row(row, columns) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 10: CROSS JOIN - budynki x uslugi
# Strona: Panel Administratora -> Raporty -> Budynki x Uslugi
@app.get("/views/budynki-uslugi-cross")
async def get_budynki_uslugi_cross():
    """Widok z CROSS JOIN - wszystkie kombinacje budynkow i uslug"""
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("SELECT * FROM v_budynki_uslugi_cross")
            columns = [col[0].lower() for col in cursor.description]
            return [serialize_row(row, columns) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 10: SELF JOIN - pracownicy koledzy
# Strona: Panel Administratora -> Raporty -> Koledzy z pracy
@app.get("/views/pracownicy-koledzy")
async def get_pracownicy_koledzy():
    """Widok z SELF JOIN - pary pracownikow na tym samym stanowisku"""
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("SELECT * FROM v_pracownicy_koledzy")
            columns = [col[0].lower() for col in cursor.description]
            return [serialize_row(row, columns) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 10: JOIN 3 tabel - czlonkowie pelne info
# Strona: Panel Administratora -> Raporty -> Pelne info o czlonkach
@app.get("/views/czlonkowie-pelne-info")
async def get_czlonkowie_pelne_info():
    """Widok z JOIN 3 tabel - czlonek + mieszkanie + budynek"""
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("SELECT * FROM v_czlonkowie_pelne_info")
            columns = [col[0].lower() for col in cursor.description]
            return [serialize_row(row, columns) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# ================================================================================
# LAB 11: PROCEDURY i FUNKCJE (z CURSOR, SEQUENCE, obsluga wyjatkow)
# Strona: Panel Administratora -> rozne operacje
# ================================================================================

# LAB 11: Procedura zwieksz_oplaty
# Strona: Panel Administratora -> Narzedzia -> Zwieksz ceny
@app.post("/procedures/increase-fees")
async def call_increase_fees(req: ProcedureRequest):
    """Wywolanie procedury zwiekszajacej ceny uslug"""
    try:
        with get_cursor() as (cursor, conn):
            procent = req.procent if req.procent else 10
            cursor.execute("BEGIN zwieksz_oplaty(:1); END;", [procent])
            conn.commit()
            return {"success": True, "message": f"Ceny usług zwiększone o {procent}%"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 11: Funkcja dodaj_oplate_fn (oblicza kwote automatycznie)
# Strona: Panel Administratora -> Narzedzia -> Dodaj oplate
@app.post("/procedures/add-fee")
async def call_add_fee(req: ProcedureRequest):
    """Wywolanie funkcji dodajacej oplate z automatycznym obliczeniem kwoty"""
    try:
        with get_cursor() as (cursor, conn):
            if not req.id_mieszkania or not req.id_uslugi or not req.zuzycie:
                return {"success": False, "message": "Wymagane: id_mieszkania, id_uslugi, zuzycie"}
            out_var = cursor.var(float)
            cursor.execute("""
                BEGIN :1 := dodaj_oplate_fn(:2, :3, :4); END;
            """, [out_var, req.id_mieszkania, req.id_uslugi, req.zuzycie])
            conn.commit()
            kwota = out_var.getvalue()
            return {"success": True, "message": f"Dodano opłatę {kwota:.2f} PLN dla mieszkania {req.id_mieszkania}"}
    except Exception as e:
        print(f"ADD-FEE ERROR: {e}")
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 11: Funkcja z CURSOR - pobierz_czlonkow_budynku
# Strona: Panel Administratora -> Raporty -> Czlonkowie budynku
@app.get("/functions/members-of-building/{building_id}")
async def get_members_of_building(building_id: int):
    """Wywolanie funkcji z CURSOR - lista czlonkow budynku"""
    try:
        with get_cursor() as (cursor, conn):
            out_var = cursor.var(str)
            cursor.execute("BEGIN :1 := pobierz_czlonkow_budynku(:2); END;", [out_var, building_id])
            result = out_var.getvalue()
            return {"building_id": building_id, "members": result or "Brak członków"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 11: Procedura INSERT - dodaj_czlonka
# Strona: Panel Administratora -> Czlonkowie -> Dodaj (przez procedure)
@app.post("/procedures/dodaj-czlonka")
async def proc_dodaj_czlonka(data: CzlonekCreate):
    """Wywolanie procedury INSERT dla czlonka"""
    try:
        with get_cursor() as (cursor, conn):
            out_id = cursor.var(int)
            cursor.execute("""
                BEGIN dodaj_czlonka(:1, :2, :3, :4, :5, :6, :7); END;
            """, [data.id_mieszkania, data.imie, data.nazwisko, data.pesel, data.telefon, data.email, out_id])
            conn.commit()
            return {"success": True, "id_czlonka": out_id.getvalue(), "message": "Członek dodany przez procedurę DB"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 11: Procedura UPDATE - aktualizuj_czlonka
# Strona: Panel Administratora -> Czlonkowie -> Edytuj (przez procedure)
@app.put("/procedures/aktualizuj-czlonka/{id_czlonka}")
async def proc_aktualizuj_czlonka(id_czlonka: int, data: CzlonekUpdate):
    """Wywolanie procedury UPDATE dla czlonka"""
    try:
        with get_cursor() as (cursor, conn):
            out_rows = cursor.var(int)
            cursor.execute("""
                BEGIN aktualizuj_czlonka(:1, :2, :3, :4, :5, :6); END;
            """, [id_czlonka, data.imie, data.nazwisko, data.telefon, data.email, out_rows])
            conn.commit()
            return {"success": True, "rows_updated": out_rows.getvalue(), "message": "Członek zaktualizowany przez procedurę DB"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 11: Procedura DELETE - usun_czlonka
# Strona: Panel Administratora -> Czlonkowie -> Usun (przez procedure)
@app.delete("/procedures/usun-czlonka/{id_czlonka}")
async def proc_usun_czlonka(id_czlonka: int):
    """Wywolanie procedury DELETE dla czlonka"""
    try:
        with get_cursor() as (cursor, conn):
            out_rows = cursor.var(int)
            cursor.execute("BEGIN usun_czlonka(:1, :2); END;", [id_czlonka, out_rows])
            conn.commit()
            return {"success": True, "rows_deleted": out_rows.getvalue(), "message": "Członek usunięty przez procedurę DB"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 11: Funkcja dodaj_spotkanie z SEQUENCE
# Strona: Panel Administratora -> Spotkania -> Dodaj
@app.post("/functions/dodaj-spotkanie")
async def func_dodaj_spotkanie(data: SpotkanieCreate):
    """Wywolanie funkcji dodajacej spotkanie (z SEQUENCE)"""
    try:
        with get_cursor() as (cursor, conn):
            data_spotkania = datetime.strptime(data.data, '%Y-%m-%d') if data.data else None
            out_id = cursor.var(int)
            cursor.execute("BEGIN :1 := dodaj_spotkanie(:2, :3, :4); END;", [out_id, data.temat, data.miejsce, data_spotkania])
            conn.commit()
            return {"success": True, "id_spotkania": out_id.getvalue(), "message": "Spotkanie dodane z użyciem SEQUENCE"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 11: Funkcja aktualizuj_saldo_konta
# Strona: Panel Administratora -> Konta -> Aktualizuj saldo
@app.put("/functions/aktualizuj-saldo/{id_konta}")
async def func_aktualizuj_saldo(id_konta: int, nowe_saldo: float):
    """Wywolanie funkcji aktualizujacej saldo konta"""
    try:
        with get_cursor() as (cursor, conn):
            out_rows = cursor.var(int)
            cursor.execute("BEGIN :1 := aktualizuj_saldo_konta(:2, :3); END;", [out_rows, id_konta, nowe_saldo])
            conn.commit()
            return {"success": True, "rows_updated": out_rows.getvalue(), "message": f"Saldo konta {id_konta} zaktualizowane"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# ================================================================================
# LAB 12: PACKAGES (Pakiety) - coop_pkg, coop_crud_pkg
# Strona: Panel Administratora -> rozne operacje
# ================================================================================

# LAB 12: Package coop_pkg - suma oplat mieszkania
# Strona: Panel Administratora -> Raporty, Portal Mieszkanca
@app.get("/functions/apartment-fees/{apt_id}")
async def get_apartment_fees(apt_id: int):
    """Wywolanie funkcji z pakietu coop_pkg.suma_oplat_mieszkania"""
    try:
        with get_cursor() as (cursor, conn):
            out_var = cursor.var(float)
            cursor.execute("BEGIN :1 := coop_pkg.suma_oplat_mieszkania(:2); END;", [out_var, apt_id])
            return {"apartment_id": apt_id, "total_fees": out_var.getvalue() or 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 12: Package coop_pkg - policz naprawy pracownika
# Strona: Panel Administratora -> Raporty -> Statystyki pracownikow
@app.get("/functions/worker-repairs/{worker_id}")
async def get_worker_repairs_count(worker_id: int):
    """Wywolanie funkcji z pakietu coop_pkg.policz_naprawy_pracownika"""
    try:
        with get_cursor() as (cursor, conn):
            out_var = cursor.var(float)
            cursor.execute("BEGIN :1 := coop_pkg.policz_naprawy_pracownika(:2); END;", [out_var, worker_id])
            return {"worker_id": worker_id, "repairs_count": int(out_var.getvalue()) if out_var.getvalue() else 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 12: Package coop_crud_pkg - INSERT budynek
# Strona: Panel Administratora -> Budynki -> Dodaj (przez package)
@app.post("/package/insert-budynek")
async def pkg_insert_budynek(data: BudynekCreate):
    """Wywolanie procedury z pakietu coop_crud_pkg.insert_budynek"""
    try:
        with get_cursor() as (cursor, conn):
            out_id = cursor.var(int)
            cursor.execute("BEGIN coop_crud_pkg.insert_budynek(:1, :2, :3, :4); END;", 
                          [data.adres, data.liczba_pieter, data.rok_budowy, out_id])
            conn.commit()
            return {"success": True, "id_budynku": out_id.getvalue(), "message": "Budynek dodany przez package"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 12: Package coop_crud_pkg - UPDATE budynek
# Strona: Panel Administratora -> Budynki -> Edytuj (przez package)
@app.put("/package/update-budynek/{id_budynku}")
async def pkg_update_budynek(id_budynku: int, adres: str, liczba_pieter: int):
    """Wywolanie procedury z pakietu coop_crud_pkg.update_budynek"""
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("BEGIN coop_crud_pkg.update_budynek(:1, :2, :3); END;", [id_budynku, adres, liczba_pieter])
            conn.commit()
            return {"success": True, "message": f"Budynek {id_budynku} zaktualizowany przez package"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 12: Package coop_crud_pkg - DELETE budynek
# Strona: Panel Administratora -> Budynki -> Usun (przez package)
@app.delete("/package/delete-budynek/{id_budynku}")
async def pkg_delete_budynek(id_budynku: int):
    """Wywolanie procedury z pakietu coop_crud_pkg.delete_budynek"""
    try:
        with get_cursor() as (cursor, conn):
            out_deleted = cursor.var(int)
            cursor.execute("BEGIN coop_crud_pkg.delete_budynek(:1, :2); END;", [id_budynku, out_deleted])
            conn.commit()
            return {"success": True, "rows_deleted": out_deleted.getvalue(), "message": "Budynek usunięty przez package"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 12: Package coop_crud_pkg - pobierz_nazwisko_czlonka (z obsluga wyjatkow)
# Strona: Panel Administratora -> Raporty
@app.get("/package/nazwisko-czlonka/{id_czlonka}")
async def pkg_nazwisko_czlonka(id_czlonka: int):
    """Wywolanie funkcji z pakietu z obsluga wyjatkow NO_DATA_FOUND, TOO_MANY_ROWS"""
    try:
        with get_cursor() as (cursor, conn):
            result = cursor.callfunc("coop_crud_pkg.pobierz_nazwisko_czlonka", str, [id_czlonka])
            return {"id_czlonka": id_czlonka, "nazwisko": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 12: Package coop_crud_pkg - pobierz_adres_budynku
# Strona: Panel Administratora -> Raporty
@app.get("/package/adres-budynku/{id_budynku}")
async def pkg_adres_budynku(id_budynku: int):
    """Wywolanie funkcji z pakietu z obsluga wyjatku NO_DATA_FOUND"""
    try:
        with get_cursor() as (cursor, conn):
            result = cursor.callfunc("coop_crud_pkg.pobierz_adres_budynku", str, [id_budynku])
            return {"id_budynku": id_budynku, "adres": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 12: Package coop_crud_pkg - statystyki_budynku
# Strona: Panel Administratora -> Raporty -> Statystyki budynku
@app.get("/package/statystyki-budynku/{id_budynku}")
async def pkg_statystyki_budynku(id_budynku: int):
    """Wywolanie funkcji statystyki budynku z pakietu"""
    try:
        with get_cursor() as (cursor, conn):
            result = cursor.callfunc("coop_crud_pkg.statystyki_budynku", str, [id_budynku])
            return {"id_budynku": id_budynku, "statystyki": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# ================================================================================
# LAB 13: TRIGGERS (widoczne w logach) i Dynamic SQL (EXECUTE IMMEDIATE)
# Strona: Panel Administratora -> Narzedzia
# ================================================================================

# LAB 13: Logi audytu (wynik dzialania triggera trg_audit_czlonek)
# Strona: Panel Administratora -> Narzedzia -> Logi audytu
@app.get("/system/audit-logs")
async def get_audit_logs():
    """Pobranie logow audytu (wyniki triggera AFTER INSERT/UPDATE/DELETE)"""
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("""
                SELECT id_logu, id_czlonka, operacja, stare_dane, nowe_dane, data_zmiany
                FROM log_zmian_czlonka
                ORDER BY data_zmiany DESC
                FETCH FIRST 100 ROWS ONLY
            """)
            columns = [col[0].lower() for col in cursor.description]
            return [serialize_row(row, columns) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# LAB 13: Funkcja z Dynamic SQL - policz_rekordy (EXECUTE IMMEDIATE)
# Strona: Panel Administratora -> Narzedzia -> Statystyki tabel
@app.get("/functions/count-records/{table_name}")
async def count_records(table_name: str):
    """Wywolanie funkcji z dynamicznym SQL (EXECUTE IMMEDIATE)"""
    try:
        with get_cursor() as (cursor, conn):
            out_var = cursor.var(int)
            cursor.execute("BEGIN :1 := policz_rekordy(:2); END;", [out_var, table_name])
            return {"table": table_name, "count": out_var.getvalue()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# ================================================================================
# PORTAL MIESZKANCA (wykorzystuje Lab 7-13)
# Strona: Portal Mieszkanca
# ================================================================================

# Portal Mieszkanca: Dane mieszkanca (Lab 7: SELECT, Lab 10: JOIN, Lab 12: package)
# Strona: Portal Mieszkanca -> Dashboard
@app.get("/resident/my-data/{apt_id}")
async def get_resident_data(apt_id: int):
    """Wszystkie dane mieszkanca (oplaty, naprawy, spotkania, umowy)"""
    try:
        with get_cursor() as (cursor, conn):
            # Oplaty
            cursor.execute("""
                SELECT id_oplaty, id_mieszkania, id_uslugi, kwota, data_naliczenia, status_oplaty, zuzycie
                FROM oplata WHERE id_mieszkania = :1 ORDER BY data_naliczenia DESC
            """, [apt_id])
            cols_o = [col[0].lower() for col in cursor.description]
            oplaty = [serialize_row(row, cols_o) for row in cursor.fetchall()]
            
            # Naprawy
            cursor.execute("""
                SELECT id_naprawy, id_mieszkania, id_pracownika, opis, data_zgloszenia, status
                FROM naprawa WHERE id_mieszkania = :1 ORDER BY data_zgloszenia DESC
            """, [apt_id])
            cols_n = [col[0].lower() for col in cursor.description]
            naprawy = [serialize_row(row, cols_n) for row in cursor.fetchall()]
            
            # Spotkania
            cursor.execute("SELECT id_spotkania, temat, miejsce, data_spotkania FROM spotkanie_mieszkancow ORDER BY data_spotkania DESC")
            cols_s = [col[0].lower() for col in cursor.description]
            spotkania = [serialize_row(row, cols_s) for row in cursor.fetchall()]
            
            # Umowy
            cursor.execute("""
                SELECT id_umowy, id_mieszkania, id_czlonka, data_zawarcia, data_wygasniecia, typ_umowy
                FROM umowa WHERE id_mieszkania = :1
            """, [apt_id])
            cols_u = [col[0].lower() for col in cursor.description]
            umowy = [serialize_row(row, cols_u) for row in cursor.fetchall()]
            
            # LAB 12: Suma oplat z package
            try:
                suma_oplat = cursor.callfunc("coop_pkg.suma_oplat_mieszkania", float, [apt_id])
            except:
                suma_oplat = 0
            
            return {"oplaty": oplaty, "naprawy": naprawy, "spotkania": spotkania, "umowy": umowy, "suma_oplat": suma_oplat or 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# Portal Mieszkanca: Moje oplaty (Lab 9: VIEW v_moje_oplaty)
# Strona: Portal Mieszkanca -> Moje Oplaty
@app.get("/resident/payments/{id_mieszkania}")
async def get_resident_payments(id_mieszkania: int):
    """Oplaty mieszkanca z widoku (Lab 9)"""
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("""
                SELECT id_oplaty, nazwa_uslugi, kwota, zuzycie, jednostka_miary, data_naliczenia, status_oplaty
                FROM v_moje_oplaty WHERE id_mieszkania = :1 ORDER BY data_naliczenia DESC
            """, [id_mieszkania])
            columns = [col[0].lower() for col in cursor.description]
            return [serialize_row(row, columns) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# Portal Mieszkanca: Moje naprawy (Lab 7: SELECT z JOIN)
# Strona: Portal Mieszkanca -> Moje Naprawy
@app.get("/resident/repairs/{id_mieszkania}")
async def get_resident_repairs(id_mieszkania: int):
    """Naprawy mieszkanca z LEFT JOIN"""
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("""
                SELECT n.id_naprawy, n.opis, n.data_zgloszenia, n.data_wykonania, 
                       n.status, p.imie || ' ' || p.nazwisko AS pracownik
                FROM naprawa n LEFT JOIN pracownik p ON n.id_pracownika = p.id_pracownika
                WHERE n.id_mieszkania = :1 ORDER BY n.data_zgloszenia DESC
            """, [id_mieszkania])
            columns = [col[0].lower() for col in cursor.description]
            return [serialize_row(row, columns) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# Portal Mieszkanca: Zglos naprawe (Lab 11: Procedura zglos_naprawe)
# Strona: Portal Mieszkanca -> Zglos naprawe
@app.post("/resident/repairs")
async def submit_repair(req: RepairRequest):
    """Zgloszenie naprawy przez procedure (Lab 11)"""
    try:
        with get_cursor() as (cursor, conn):
            out_id = cursor.var(int)
            cursor.execute("BEGIN zglos_naprawe(:1, :2, :3); END;", [req.id_mieszkania, req.opis, out_id])
            conn.commit()
            return {"success": True, "id_naprawy": out_id.getvalue(), "message": "Zgłoszenie przyjęte"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# Portal Mieszkanca: Nadchodzace spotkania (Lab 7: SELECT z WHERE)
# Strona: Portal Mieszkanca -> Spotkania
@app.get("/resident/meetings")
async def get_upcoming_meetings():
    """Nadchodzace spotkania mieszkancow"""
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("""
                SELECT id_spotkania, temat, miejsce, data_spotkania
                FROM spotkanie_mieszkancow WHERE data_spotkania >= SYSDATE ORDER BY data_spotkania ASC
            """)
            columns = [col[0].lower() for col in cursor.description]
            return [serialize_row(row, columns) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# Portal Mieszkanca: Zuzycie mediow (Lab 8: GROUP BY, SUM)
# Strona: Portal Mieszkanca -> Zuzycie
@app.get("/resident/consumption/{id_mieszkania}")
async def get_resident_consumption(id_mieszkania: int):
    """Zuzycie mediow z agregacja (Lab 8: GROUP BY, SUM)"""
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("""
                SELECT u.nazwa_uslugi, SUM(o.zuzycie) as zuzycie, u.jednostka_miary, SUM(o.kwota) as suma_kwot
                FROM oplata o JOIN uslugi u ON o.id_uslugi = u.id_uslugi
                WHERE o.id_mieszkania = :1
                GROUP BY u.nazwa_uslugi, u.jednostka_miary
                ORDER BY suma_kwot DESC
            """, [id_mieszkania])
            columns = [col[0].lower() for col in cursor.description]
            return [serialize_row(row, columns) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))


# ================================================================================
# URUCHOMIENIE APLIKACJI
# ================================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
