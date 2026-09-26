#!/usr/bin/env bash
set -euo pipefail

if [[ ! -t 0 ]]; then
  echo "Run this script in a terminal so sudo can prompt for your password." >&2
  exit 1
fi

if ! command -v sudo >/dev/null || ! command -v dnf >/dev/null; then
  echo "This script requires sudo and dnf." >&2
  exit 1
fi

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
rpm_file="$root_dir/src-tauri/target/release/bundle/rpm/Markdown Viewer-0.1.0-1.x86_64.rpm"

if [[ ! -f "$rpm_file" ]]; then
  echo "RPM not found: $rpm_file" >&2
  echo "Build it first with 'pnpm tauri:build --bundles rpm'." >&2
  exit 1
fi

package_name="$(rpm -qp --queryformat '%{NAME}' "$rpm_file")"
package_version="$(rpm -qp --queryformat '%{VERSION}-%{RELEASE}.%{ARCH}' "$rpm_file")"
installed_version="$(rpm -q --queryformat '%{VERSION}-%{RELEASE}.%{ARCH}' "$package_name" 2>/dev/null || true)"

echo "Installing $rpm_file"
sudo -v
if [[ "$installed_version" == "$package_version" ]]; then
  # dnf install is a no-op when this version is already installed.
  sudo dnf reinstall "$rpm_file"
else
  sudo dnf install "$rpm_file"
fi
