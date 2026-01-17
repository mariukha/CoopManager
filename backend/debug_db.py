from db import get_cursor
import oracledb

def check_schema():
    try:
        with get_cursor() as (cursor, conn):
            print("Checking tables...")
            cursor.execute("SELECT table_name FROM user_tables")
            print("Tables:", [row[0] for row in cursor.fetchall()])
            
            print("\nChecking views...")
            cursor.execute("SELECT view_name FROM user_views")
            print("Views:", [row[0] for row in cursor.fetchall()])
            
            print("\nChecking columns in OPLATA:")
            cursor.execute("SELECT column_name, data_type FROM user_tab_columns WHERE table_name = 'OPLATA'")
            for row in cursor.fetchall():
                print(f" - {row[0]} ({row[1]})")

            print("\nChecking columns in USLUGI:")
            cursor.execute("SELECT column_name, data_type FROM user_tab_columns WHERE table_name = 'USLUGI'")
            for row in cursor.fetchall():
                print(f" - {row[0]} ({row[1]})")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_schema()
