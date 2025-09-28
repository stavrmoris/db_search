import psycopg2
from psycopg2.extras import RealDictCursor
import os

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5434")
DB_NAME = os.getenv("DB_NAME", "task_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "postgres")

def get_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        cursor_factory=RealDictCursor
    )

def execute_query(query: str):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            try:
                rows = cur.fetchall()
            except psycopg2.ProgrammingError:
                rows = []
    return rows
