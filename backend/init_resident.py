
from db import get_cursor
import oracledb

def init_resident_portal_db():
    print("Initializing Resident Portal DB objects...")
    try:
        with get_cursor() as (cursor, conn):
            # Create View
            print("Creating view V_MOJE_OPLATY...")
            cursor.execute("""
                CREATE OR REPLACE VIEW v_moje_oplaty AS
                SELECT 
                    o.id_oplaty,
                    o.id_mieszkania,
                    u.nazwa_uslugi,
                    o.kwota,
                    o.zuzycie,
                    u.jednostka_miary,
                    o.data_naliczenia,
                    o.status_oplaty
                FROM oplata o
                JOIN uslugi u ON o.id_uslugi = u.id_uslugi
            """)
            print("View created.")

            # Create Procedure
            print("Creating procedure ZGLOS_NAPRAWE...")
            cursor.execute("""
                CREATE OR REPLACE PROCEDURE zglos_naprawe(
                    p_id_mieszkania IN NUMBER,
                    p_opis IN VARCHAR2,
                    p_id_naprawy OUT NUMBER
                ) AS
                BEGIN
                    INSERT INTO naprawa (id_mieszkania, opis, status)
                    VALUES (p_id_mieszkania, p_opis, 'zgloszona')
                    RETURNING id_naprawy INTO p_id_naprawy;
                END;
            """)
            print("Procedure created.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    init_resident_portal_db()
