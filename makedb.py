import sqlite3, os
from sqlite3 import Error

DBFILE = "map.db"
SQLFILE = "makemap.sql"

if os.path.exists(DBFILE):
    os.remove(DBFILE)

conn = sqlite3.connect(DBFILE)
with open(SQLFILE) as f:
    conn.executescript(f.read())
conn.commit()
conn.close()

print("Database created!")