#!/bin/sh
set -eu
project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
if [ ! -t 0 ]; then printf '%s\n' 'Jalankan skrip ini langsung di Terminal.' >&2; exit 1; fi
printf '%s\n' 'Masukkan kata sandi Mac jika diminta. Migrasi hanya dapat dijalankan satu kali.'
sudo -v
existing=$(sudo mariadb --user=root --batch --skip-column-names -e "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='fleetra' AND table_name='users' AND column_name='external_id';")
if [ "$existing" != 0 ]; then printf '%s\n' 'Migrasi sudah dijalankan atau berjalan sebagian; perlu pemeriksaan sebelum mengulang.' >&2; exit 1; fi
sudo mariadb --user=root --batch fleetra < "$project_dir/database/migrations/002_dashboard_mysql.sql"
printf '%s\n' 'Migrasi kompatibilitas dashboard berhasil.'
