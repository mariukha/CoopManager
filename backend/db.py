import oracledb
import os
from contextlib import contextmanager

class DatabaseConfig:
    USER = os.getenv("DB_USER", "system")
    PASSWORD = os.getenv("DB_PASSWORD", "oracle")
    DSN = os.getenv("DB_DSN", "localhost:1521/XEPDB1")

def get_connection():
    return oracledb.connect(
        user=DatabaseConfig.USER,
        password=DatabaseConfig.PASSWORD,
        dsn=DatabaseConfig.DSN
    )

@contextmanager
def get_db_connection():
    conn = None
    try:
        conn = get_connection()
        yield conn
    finally:
        if conn:
            conn.close()

@contextmanager
def get_cursor():
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        yield cursor, conn
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
