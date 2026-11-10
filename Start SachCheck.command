#!/bin/sh
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install Node.js 22 or newer from https://nodejs.org/"
  printf "Press Enter to close..."
  read -r _
  exit 1
fi
npm start
