CREATE TABLE IF NOT EXISTS hospitals (
  hira_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL,
  type_code TEXT,
  type_name TEXT,
  address TEXT NOT NULL,
  province_code TEXT,
  province_name TEXT,
  district_code TEXT,
  district_name TEXT,
  town TEXT,
  phone TEXT,
  homepage TEXT,
  longitude REAL,
  latitude REAL,
  established_date TEXT,
  verification_status TEXT NOT NULL DEFAULT 'api-retrieved'
    CHECK (verification_status IN ('api-retrieved', 'verified')),
  source_name TEXT NOT NULL DEFAULT '건강보험심사평가원 병원기본정보 API',
  source_url TEXT NOT NULL DEFAULT 'https://www.hira.or.kr/ra/hosp/getHealthMap.do?pgmid=HIRAA030501000000',
  source_checked_at TEXT NOT NULL,
  snapshot_updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  raw_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hospitals_name_normalized
  ON hospitals(name_normalized);
CREATE INDEX IF NOT EXISTS idx_hospitals_region
  ON hospitals(province_code, district_code, town);
CREATE INDEX IF NOT EXISTS idx_hospitals_checked
  ON hospitals(source_checked_at DESC);

CREATE TABLE IF NOT EXISTS hospital_departments (
  hira_id TEXT NOT NULL,
  department_code TEXT NOT NULL,
  source_checked_at TEXT NOT NULL,
  PRIMARY KEY (hira_id, department_code),
  FOREIGN KEY (hira_id) REFERENCES hospitals(hira_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_hospital_departments_code
  ON hospital_departments(department_code, hira_id);

CREATE TABLE IF NOT EXISTS hospital_sync_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  started_at TEXT NOT NULL,
  finished_at TEXT,
  rows_seen INTEGER NOT NULL DEFAULT 0,
  rows_written INTEGER NOT NULL DEFAULT 0,
  error_message TEXT
);

