#!/bin/zsh

PROJECT_FOLDER="${0:A:h}"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js bulunamadı. Node.js 22 veya daha yeni bir sürüm kurun."
  echo "https://nodejs.org/"
  read -r "?Kapatmak için Enter tuşuna basın."
  exit 1
fi

if command -v pnpm >/dev/null 2>&1; then
  PACKAGE_RUNNER=(pnpm)
elif command -v corepack >/dev/null 2>&1; then
  PACKAGE_RUNNER=(corepack pnpm)
else
  echo "pnpm bulunamadı. Önce şu komutu çalıştırın: npm install -g pnpm@11"
  read -r "?Kapatmak için Enter tuşuna basın."
  exit 1
fi

cd "$PROJECT_FOLDER" || exit 1

if [[ ! -d node_modules ]]; then
  echo "Paketler hazırlanıyor..."
  "${PACKAGE_RUNNER[@]}" install --frozen-lockfile --ignore-scripts || exit 1
fi

echo "Convert başlatılıyor..."
echo "Tarayıcı adresi: http://127.0.0.1:5173/"
echo "Durdurmak için Control + C tuşlarına basın."
echo

"${PACKAGE_RUNNER[@]}" dev
