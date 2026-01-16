from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
from db import get_cursor, get_connection
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_TABLES = ["budynek", "mieszkanie", "czlonek", "pracownik", "naprawa", "uslugi", "oplata", "umowa", "konto_bankowe", "spotkanie_mieszkancow"]

def init_database():
    # Check if tables already exist (they should from Oracle startup scripts)
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
    result = {}
    for col_name, value in zip(columns, row):
        if isinstance(value, datetime):
            result[col_name] = value.strftime("%Y-%m-%d")
        else:
            result[col_name] = value
    return result

class LoginRequest(BaseModel):
    login: str
    haslo: str

class ResidentLoginRequest(BaseModel):
    imie: str
    nazwisko: str
    numer: str

class RecordData(BaseModel):
    data: dict[str, Any]

class ProcedureRequest(BaseModel):
    procent: Optional[float] = None
    id_mieszkania: Optional[int] = None
    id_uslugi: Optional[int] = None
    zuzycie: Optional[float] = None

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/login")
async def login(req: LoginRequest):
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
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

@app.post("/login/resident")
async def login_resident(req: ResidentLoginRequest):
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("""
                SELECT c.id_czlonka, c.imie, c.nazwisko, m.id_mieszkania, m.numer
                FROM czlonek c
                JOIN mieszkanie m ON c.id_mieszkania = m.id_mieszkania
                WHERE LOWER(c.imie) = LOWER(:1)
                  AND LOWER(c.nazwisko) = LOWER(:2)
                  AND m.numer = :3
            """, [req.imie, req.nazwisko, req.numer])
            row = cursor.fetchone()
            if row:
                return {
                    "success": True,
                    "user": {
                        "id": row[0],
                        "imie": row[1],
                        "nazwisko": row[2],
                        "apt_id": row[3],
                        "apt_num": row[4]
                    }
                }
            raise HTTPException(status_code=401, detail="Nie znaleziono mieszkańca")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

@app.get("/data/{table}")
async def get_table_data(table: str):
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

def convert_date_value(key: str, value):
    if value is None or value == '':
        return None
    if 'data' in key.lower() and isinstance(value, str) and '-' in value:
        return datetime.strptime(value.split('T')[0], '%Y-%m-%d')
    return value

@app.post("/data/{table}")
async def insert_record(table: str, record: RecordData):
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

@app.put("/data/{table}/{id_field}/{id_value}")
async def update_record(table: str, id_field: str, id_value: str, record: RecordData):
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

@app.delete("/data/{table}/{id_field}/{id_value}")
async def delete_record(table: str, id_field: str, id_value: str):
    if table not in VALID_TABLES:
        raise HTTPException(status_code=400, detail="Nieprawidłowa tabela")
    
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute(f"DELETE FROM {table} WHERE {id_field} = :1", [id_value])
            conn.commit()
            return {"success": True, "message": "Rekord usunięty"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

@app.get("/system/audit-logs")
async def get_audit_logs():
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("""
                SELECT id_logu, id_czlonka, operacja, stare_dane, nowe_dane, data_zmiany
                FROM log_zmian_czlonka
                ORDER BY data_zmiany DESC
                FETCH FIRST 100 ROWS ONLY
            """)
            columns = [col[0].lower() for col in cursor.description]
            rows = cursor.fetchall()
            return [serialize_row(row, columns) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

@app.post("/procedures/increase-fees")
async def call_increase_fees(req: ProcedureRequest):
    try:
        with get_cursor() as (cursor, conn):
            procent = req.procent if req.procent else 10
            cursor.execute("BEGIN zwieksz_oplaty(:1); END;", [procent])
            conn.commit()
            return {"success": True, "message": f"Ceny usług zwiększone o {procent}%"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

@app.post("/procedures/add-fee")
async def call_add_fee(req: ProcedureRequest):
    try:
        with get_cursor() as (cursor, conn):
            if not req.id_mieszkania or not req.id_uslugi or not req.zuzycie:
                return {"success": False, "message": "Wymagane: id_mieszkania, id_uslugi, zuzycie"}
            
            # Używamy funkcji dodaj_oplate_fn z Lab 11/12
            out_var = cursor.var(float)
            cursor.execute("""
                BEGIN
                    :1 := dodaj_oplate_fn(:2, :3, :4);
                END;
            """, [out_var, req.id_mieszkania, req.id_uslugi, req.zuzycie])
            conn.commit()
            kwota = out_var.getvalue()
            
            return {"success": True, "message": f"Dodano opłatę {kwota:.2f} PLN dla mieszkania {req.id_mieszkania}"}
    except Exception as e:
        print(f"ADD-FEE ERROR: {e}")
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

# Funkcja pobierz_czlonkow_budynku (Lab 11 - CURSOR)
@app.get("/functions/members-of-building/{building_id}")
async def get_members_of_building(building_id: int):
    try:
        with get_cursor() as (cursor, conn):
            out_var = cursor.var(str)
            cursor.execute("BEGIN :1 := pobierz_czlonkow_budynku(:2); END;", [out_var, building_id])
            result = out_var.getvalue()
            return {"building_id": building_id, "members": result or "Brak członków"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

# Funkcja policz_rekordy (Lab 13 - dynamiczny SQL)
@app.get("/functions/count-records/{table_name}")
async def count_records(table_name: str):
    try:
        with get_cursor() as (cursor, conn):
            out_var = cursor.var(int)
            cursor.execute("BEGIN :1 := policz_rekordy(:2); END;", [out_var, table_name])
            result = out_var.getvalue()
            return {"table": table_name, "count": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

# Package coop_pkg - suma opłat mieszkania (Lab 12)
@app.get("/functions/apartment-fees/{apt_id}")
async def get_apartment_fees(apt_id: int):
    try:
        with get_cursor() as (cursor, conn):
            out_var = cursor.var(float)
            cursor.execute("BEGIN :1 := coop_pkg.suma_oplat_mieszkania(:2); END;", [out_var, apt_id])
            result = out_var.getvalue()
            return {"apartment_id": apt_id, "total_fees": result or 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

# Package coop_pkg - policz naprawy pracownika (Lab 12)
@app.get("/functions/worker-repairs/{worker_id}")
async def get_worker_repairs_count(worker_id: int):
    try:
        with get_cursor() as (cursor, conn):
            out_var = cursor.var(float)
            cursor.execute("BEGIN :1 := coop_pkg.policz_naprawy_pracownika(:2); END;", [out_var, worker_id])
            result = out_var.getvalue()
            return {"worker_id": worker_id, "repairs_count": int(result) if result else 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

# Widoki z Lab 9
@app.get("/views/mieszkania-info")
async def get_mieszkania_info():
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("SELECT * FROM v_mieszkania_info")
            columns = [col[0].lower() for col in cursor.description]
            rows = cursor.fetchall()
            return [serialize_row(row, columns) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

@app.get("/views/oplaty-summary")
async def get_oplaty_summary():
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("SELECT * FROM v_oplaty_summary")
            columns = [col[0].lower() for col in cursor.description]
            rows = cursor.fetchall()
            return [serialize_row(row, columns) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

@app.get("/views/naprawy-status")
async def get_naprawy_status():
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("SELECT * FROM v_naprawy_status")
            columns = [col[0].lower() for col in cursor.description]
            rows = cursor.fetchall()
            return [serialize_row(row, columns) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

@app.get("/reports/summary")
async def get_summary_report():
    try:
        with get_cursor() as (cursor, conn):
            # Podsumowanie usług z GROUP BY (Lab 8)
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
            
            cursor.execute("SELECT COUNT(*) FROM czlonek")
            members_count = cursor.fetchone()[0]
            
            # Zaległości - używamy widoku v_oplaty_summary (Lab 9)
            cursor.execute("""
                SELECT COUNT(*) FROM oplata 
                WHERE status_oplaty IN ('nieoplacone', 'zaleglosc')
            """)
            arrears_count = cursor.fetchone()[0]
            
            # Szczegóły zaległości z JOIN (Lab 8)
            cursor.execute("""
                SELECT 
                    b.adres,
                    m.numer as numer_mieszkania,
                    u.nazwa_uslugi,
                    o.kwota,
                    o.data_naliczenia
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
                    "adres": row[0],
                    "numer_mieszkania": row[1],
                    "nazwa_uslugi": row[2] or "Inne",
                    "kwota": float(row[3]) if row[3] else 0,
                    "data_platnosci": row[4].strftime("%Y-%m-%d") if row[4] else None
                })
            
            # Statystyki z funkcji policz_rekordy (Lab 13 - dynamiczny SQL)
            table_stats = {}
            for table in ['budynek', 'mieszkanie', 'czlonek', 'pracownik', 'naprawa', 'oplata', 'umowa']:
                try:
                    count = cursor.callfunc("policz_rekordy", int, [table])
                    table_stats[table] = count
                except:
                    table_stats[table] = 0
            
            # Suma opłat wg mieszkań - używamy widoku (Lab 9)
            cursor.execute("SELECT * FROM v_oplaty_summary ORDER BY suma_oplat DESC FETCH FIRST 10 ROWS ONLY")
            cols = [col[0].lower() for col in cursor.description]
            apartments_summary = [serialize_row(row, cols) for row in cursor.fetchall()]
            
            # Status napraw z widoku (Lab 9)
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

@app.get("/resident/my-data/{apt_id}")
async def get_resident_data(apt_id: int):
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("""
                SELECT id_oplaty, id_mieszkania, id_uslugi, kwota, data_naliczenia, status_oplaty, zuzycie
                FROM oplata WHERE id_mieszkania = :1
                ORDER BY data_naliczenia DESC
            """, [apt_id])
            cols_o = [col[0].lower() for col in cursor.description]
            oplaty = [serialize_row(row, cols_o) for row in cursor.fetchall()]
            
            cursor.execute("""
                SELECT id_naprawy, id_mieszkania, id_pracownika, opis, data_zgloszenia, status
                FROM naprawa WHERE id_mieszkania = :1
                ORDER BY data_zgloszenia DESC
            """, [apt_id])
            cols_n = [col[0].lower() for col in cursor.description]
            naprawy = [serialize_row(row, cols_n) for row in cursor.fetchall()]
            
            # Spotkania mieszkańców dla wszystkich
            cursor.execute("""
                SELECT id_spotkania, temat, miejsce, data_spotkania
                FROM spotkanie_mieszkancow
                ORDER BY data_spotkania DESC
            """)
            cols_s = [col[0].lower() for col in cursor.description]
            spotkania = [serialize_row(row, cols_s) for row in cursor.fetchall()]
            
            # Umowy mieszkania
            cursor.execute("""
                SELECT id_umowy, id_mieszkania, id_czlonka, data_zawarcia, data_wygasniecia, typ_umowy
                FROM umowa WHERE id_mieszkania = :1
            """, [apt_id])
            cols_u = [col[0].lower() for col in cursor.description]
            umowy = [serialize_row(row, cols_u) for row in cursor.fetchall()]
            
            # Suma opłat z package coop_pkg (Lab 12)
            try:
                suma_oplat = cursor.callfunc("coop_pkg.suma_oplat_mieszkania", float, [apt_id])
            except:
                suma_oplat = 0
            
            return {
                "oplaty": oplaty,
                "naprawy": naprawy,
                "spotkania": spotkania,
                "umowy": umowy,
                "suma_oplat": suma_oplat or 0
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

# ============================================
# WIDOKI Z ROZNYMI JOIN (Lab 10)
# ============================================

# RIGHT JOIN - pracownicy z naprawami (Lab 10)
@app.get("/views/pracownicy-naprawy")
async def get_pracownicy_naprawy():
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("SELECT * FROM v_pracownicy_naprawy")
            columns = [col[0].lower() for col in cursor.description]
            rows = cursor.fetchall()
            return [serialize_row(row, columns) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

# FULL OUTER JOIN - oplaty z uslugami (Lab 10)
@app.get("/views/oplaty-uslugi-full")
async def get_oplaty_uslugi_full():
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("SELECT * FROM v_oplaty_uslugi_full")
            columns = [col[0].lower() for col in cursor.description]
            rows = cursor.fetchall()
            return [serialize_row(row, columns) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

# CROSS JOIN - budynki z uslugami (Lab 10)
@app.get("/views/budynki-uslugi-cross")
async def get_budynki_uslugi_cross():
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("SELECT * FROM v_budynki_uslugi_cross")
            columns = [col[0].lower() for col in cursor.description]
            rows = cursor.fetchall()
            return [serialize_row(row, columns) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

# SELF JOIN - pracownicy koledzy (Lab 10)
@app.get("/views/pracownicy-koledzy")
async def get_pracownicy_koledzy():
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("SELECT * FROM v_pracownicy_koledzy")
            columns = [col[0].lower() for col in cursor.description]
            rows = cursor.fetchall()
            return [serialize_row(row, columns) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

# JOIN 3 tabel - czlonkowie pelne info (Lab 10)
@app.get("/views/czlonkowie-pelne-info")
async def get_czlonkowie_pelne_info():
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("SELECT * FROM v_czlonkowie_pelne_info")
            columns = [col[0].lower() for col in cursor.description]
            rows = cursor.fetchall()
            return [serialize_row(row, columns) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

# ============================================
# PROCEDURY CRUD (Lab 11)
# ============================================

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

# INSERT przez procedurę (Lab 11)
@app.post("/procedures/dodaj-czlonka")
async def proc_dodaj_czlonka(data: CzlonekCreate):
    try:
        with get_cursor() as (cursor, conn):
            out_id = cursor.var(int)
            cursor.execute("""
                BEGIN
                    dodaj_czlonka(:1, :2, :3, :4, :5, :6, :7);
                END;
            """, [data.id_mieszkania, data.imie, data.nazwisko, 
                  data.pesel, data.telefon, data.email, out_id])
            conn.commit()
            return {"success": True, "id_czlonka": out_id.getvalue(), "message": "Członek dodany przez procedurę DB"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

# UPDATE przez procedurę (Lab 11)
@app.put("/procedures/aktualizuj-czlonka/{id_czlonka}")
async def proc_aktualizuj_czlonka(id_czlonka: int, data: CzlonekUpdate):
    try:
        with get_cursor() as (cursor, conn):
            out_rows = cursor.var(int)
            cursor.execute("""
                BEGIN
                    aktualizuj_czlonka(:1, :2, :3, :4, :5, :6);
                END;
            """, [id_czlonka, data.imie, data.nazwisko, data.telefon, data.email, out_rows])
            conn.commit()
            return {"success": True, "rows_updated": out_rows.getvalue(), "message": "Członek zaktualizowany przez procedurę DB"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

# DELETE przez procedurę (Lab 11)
@app.delete("/procedures/usun-czlonka/{id_czlonka}")
async def proc_usun_czlonka(id_czlonka: int):
    try:
        with get_cursor() as (cursor, conn):
            out_rows = cursor.var(int)
            cursor.execute("""
                BEGIN
                    usun_czlonka(:1, :2);
                END;
            """, [id_czlonka, out_rows])
            conn.commit()
            return {"success": True, "rows_deleted": out_rows.getvalue(), "message": "Członek usunięty przez procedurę DB"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

# Funkcja dodaj_spotkanie z SEQUENCE (Lab 11)
class SpotkanieCreate(BaseModel):
    temat: str
    miejsce: str
    data: Optional[str] = None

@app.post("/functions/dodaj-spotkanie")
async def func_dodaj_spotkanie(data: SpotkanieCreate):
    try:
        with get_cursor() as (cursor, conn):
            from datetime import datetime
            data_spotkania = datetime.strptime(data.data, '%Y-%m-%d') if data.data else None
            out_id = cursor.var(int)
            cursor.execute("""
                BEGIN
                    :1 := dodaj_spotkanie(:2, :3, :4);
                END;
            """, [out_id, data.temat, data.miejsce, data_spotkania])
            conn.commit()
            return {"success": True, "id_spotkania": out_id.getvalue(), "message": "Spotkanie dodane z użyciem SEQUENCE"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

# Funkcja aktualizuj_saldo_konta (Lab 11)
@app.put("/functions/aktualizuj-saldo/{id_konta}")
async def func_aktualizuj_saldo(id_konta: int, nowe_saldo: float):
    try:
        with get_cursor() as (cursor, conn):
            out_rows = cursor.var(int)
            cursor.execute("""
                BEGIN
                    :1 := aktualizuj_saldo_konta(:2, :3);
                END;
            """, [out_rows, id_konta, nowe_saldo])
            conn.commit()
            return {"success": True, "rows_updated": out_rows.getvalue(), "message": f"Saldo konta {id_konta} zaktualizowane"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

# ============================================
# PACKAGE coop_crud_pkg (Lab 12)
# ============================================

class BudynekCreate(BaseModel):
    adres: str
    liczba_pieter: int
    rok_budowy: int

# INSERT budynek przez package (Lab 12)
@app.post("/package/insert-budynek")
async def pkg_insert_budynek(data: BudynekCreate):
    try:
        with get_cursor() as (cursor, conn):
            out_id = cursor.var(int)
            cursor.execute("""
                BEGIN
                    coop_crud_pkg.insert_budynek(:1, :2, :3, :4);
                END;
            """, [data.adres, data.liczba_pieter, data.rok_budowy, out_id])
            conn.commit()
            return {"success": True, "id_budynku": out_id.getvalue(), "message": "Budynek dodany przez package"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

# UPDATE budynek przez package (Lab 12)
@app.put("/package/update-budynek/{id_budynku}")
async def pkg_update_budynek(id_budynku: int, adres: str, liczba_pieter: int):
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("""
                BEGIN
                    coop_crud_pkg.update_budynek(:1, :2, :3);
                END;
            """, [id_budynku, adres, liczba_pieter])
            conn.commit()
            return {"success": True, "message": f"Budynek {id_budynku} zaktualizowany przez package"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

# DELETE budynek przez package (Lab 12)
@app.delete("/package/delete-budynek/{id_budynku}")
async def pkg_delete_budynek(id_budynku: int):
    try:
        with get_cursor() as (cursor, conn):
            out_deleted = cursor.var(int)
            cursor.execute("""
                BEGIN
                    coop_crud_pkg.delete_budynek(:1, :2);
                END;
            """, [id_budynku, out_deleted])
            conn.commit()
            return {"success": True, "rows_deleted": out_deleted.getvalue(), "message": "Budynek usunięty przez package"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

# Funkcja pobierz_nazwisko_czlonka z obsługą wyjątków (Lab 12)
@app.get("/package/nazwisko-czlonka/{id_czlonka}")
async def pkg_nazwisko_czlonka(id_czlonka: int):
    try:
        with get_cursor() as (cursor, conn):
            result = cursor.callfunc("coop_crud_pkg.pobierz_nazwisko_czlonka", str, [id_czlonka])
            return {"id_czlonka": id_czlonka, "nazwisko": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

# Funkcja pobierz_adres_budynku z obsługą wyjątków (Lab 12)
@app.get("/package/adres-budynku/{id_budynku}")
async def pkg_adres_budynku(id_budynku: int):
    try:
        with get_cursor() as (cursor, conn):
            result = cursor.callfunc("coop_crud_pkg.pobierz_adres_budynku", str, [id_budynku])
            return {"id_budynku": id_budynku, "adres": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

# Funkcja statystyki_budynku (Lab 12)
@app.get("/package/statystyki-budynku/{id_budynku}")
async def pkg_statystyki_budynku(id_budynku: int):
    try:
        with get_cursor() as (cursor, conn):
            result = cursor.callfunc("coop_crud_pkg.statystyki_budynku", str, [id_budynku])
            return {"id_budynku": id_budynku, "statystyki": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=translate_oracle_error(str(e)))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

