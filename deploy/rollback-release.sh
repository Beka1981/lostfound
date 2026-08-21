#!/usr/bin/env bash
set -euo pipefail
backend_release=${1:?absolute backend release required}
frontend_release=${2:?absolute frontend release required}
[[ "$backend_release" == /opt/lostfound/backend/releases/* ]]
[[ "$frontend_release" == /opt/lostfound/frontend/releases/* ]]
test -f "$backend_release/LostFound.Api.dll"
test -f "$frontend_release/browser/index.html"
ln -sfn "$backend_release" /opt/lostfound/backend/current.next
mv -Tf /opt/lostfound/backend/current.next /opt/lostfound/backend/current
ln -sfn "$frontend_release" /opt/lostfound/frontend/current.next
mv -Tf /opt/lostfound/frontend/current.next /opt/lostfound/frontend/current
nginx -t
systemctl restart lostfound-api
curl --fail --silent --show-error --retry 15 --retry-delay 2 --retry-connrefused --max-time 5 http://127.0.0.1:5080/health/ready >/dev/null
systemctl reload nginx
echo "Application rollback completed; database was not changed"
