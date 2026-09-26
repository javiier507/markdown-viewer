#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f /etc/os-release ]]; then
  echo "Cannot detect the operating system." >&2
  exit 1
fi

# shellcheck source=/dev/null
source /etc/os-release
if [[ "${ID:-}" != "fedora" ]]; then
  echo "This setup script supports Fedora only." >&2
  exit 1
fi

if [[ ! -t 0 ]]; then
  echo "Run this script in a terminal so sudo can prompt for your password." >&2
  exit 1
fi

if ! command -v sudo >/dev/null || ! command -v dnf >/dev/null; then
  echo "This script requires sudo and dnf." >&2
  exit 1
fi

packages=(
  webkit2gtk4.1-devel
  gtk3-devel
  openssl-devel
  libappindicator-gtk3-devel
  librsvg2-devel
  patchelf
)

echo "Installing Fedora dependencies for Tauri. sudo will prompt for your password."
sudo -v
sudo dnf install "${packages[@]}"

echo "Dependencies installed. Run 'pnpm tauri info' and 'pnpm tauri:build' to verify."
