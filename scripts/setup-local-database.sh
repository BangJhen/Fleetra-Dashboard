#!/bin/sh
# Run in the user's Terminal. The MariaDB application credential stays in .data.
set -eu
project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
schema_file="$project_dir/database/migrations/001_initial_mysql.sql"
data_dir="$project_dir/.data"
credential_file="$data_dir/fleetra-db.cnf"
if [ ! -t 0 ]; then
  printf '%s\n' 'Jalankan skrip ini langsung di Terminal.' >&2
  exit 1
fi
if [ -e "$credential_file" ]; then
  printf '%s\n' 'Kredensial FLEETRA sudah ada. Hentikan dan periksa database sebelum mengulang.' >&2
  exit 1
fi
printf '%s\n' 'Masukkan kata sandi Mac jika sudo memintanya.'
sudo -v
existing=$(sudo mariadb --user=root --batch --skip-column-names -e "SELECT (SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='fleetra') + (SELECT COUNT(*) FROM mysql.user WHERE user='fleetra_app' AND host='localhost');")
if [ "$existing" != 0 ]; then
  printf '%s\n' 'Database fleetra atau akun fleetra_app sudah ada. Hentikan dan periksa sebelum melanjutkan.' >&2
  exit 1
fi
umask 077
mkdir -p "$data_dir"
app_password=$(openssl rand -hex 24)
( set -C; printf '[client]\nuser=fleetra_app\npassword=%s\n' "$app_password" > "$credential_file" )
printf '%s\n' 'Membuat database dan tabel. Database fleetra harus belum ada.'
{
  printf '%s\n' 'CREATE DATABASE fleetra CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'
  printf '%s\n' 'USE fleetra;'
  cat "$schema_file"
  cat "$project_dir/database/migrations/002_dashboard_mysql.sql"
  printf "CREATE USER 'fleetra_app'@'localhost' IDENTIFIED BY '%s';\n" "$app_password"
  printf '%s\n' "GRANT SELECT, INSERT, UPDATE, DELETE ON fleetra.* TO 'fleetra_app'@'localhost';"
} | sudo mariadb --user=root --batch
mariadb --defaults-extra-file="$credential_file" --protocol=socket fleetra --batch -e 'SHOW TABLES;'
printf '%s\n' 'Database dan akun aplikasi lokal berhasil disiapkan.'
