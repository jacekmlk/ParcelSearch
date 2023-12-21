CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
    username TEXT NOT NULL, 
    hash TEXT NOT NULL
);
CREATE UNIQUE INDEX username ON users (username);

CREATE TABLE parcels (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    date DATETIME,
    parcel TEXT NOT NULL,
    voivodeship TEXT NOT NULL,
    powiat TEXT NOT NULL,
    gmina TEXT NOT NULL,
    region TEXT NOT NULL,
    geom_wkt TEXT NOT NULL,
    link TEXT,
    contact TEXT,
    comment TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX id ON parcels (id);