#!/usr/bin/env bash
set -euo pipefail
workspace=/var/www/myapi
node_bin="$workspace/.tools/node-v24.15.0-linux-x64/bin"
release_id=${1:-$(date -u +%Y%m%dT%H%M%SZ)}
[[ "$release_id" =~ ^[0-9]{8}T[0-9]{6}Z$ ]]
backend_release="/opt/lostfound/backend/releases/$release_id"
frontend_release="/opt/lostfound/frontend/releases/$release_id"
test ! -e "$backend_release"
test ! -e "$frontend_release"
export DOTNET_CLI_HOME=/tmp/lostfound-deploy-dotnet
export PATH="$node_bin:$PATH"
cd "$workspace"
dotnet restore LostFound.slnx --locked-mode
dotnet build LostFound.slnx -c Release --no-restore -m:1
dotnet test tests/LostFound.Tests/LostFound.Tests.csproj -c Release --no-build -m:1
cd "$workspace/src/frontend"
npm ci --ignore-scripts
npm test -- --watch=false
npm run build
install -d -m 0750 -o root -g lostfound "$backend_release" "$frontend_release"
dotnet publish "$workspace/src/backend/LostFound.Api/LostFound.Api.csproj" -c Release --no-build -o "$backend_release"
cp -a "$workspace/src/frontend/dist/lost-found-web/." "$frontend_release/"
chown -R root:lostfound "$backend_release" "$frontend_release"
chmod -R u=rwX,g=rX,o= "$backend_release" "$frontend_release"
ln -sfn "$backend_release" /opt/lostfound/backend/current.next
mv -Tf /opt/lostfound/backend/current.next /opt/lostfound/backend/current
ln -sfn "$frontend_release" /opt/lostfound/frontend/current.next
mv -Tf /opt/lostfound/frontend/current.next /opt/lostfound/frontend/current
systemctl restart lostfound-api
curl --fail --silent --show-error --retry 15 --retry-delay 2 --retry-connrefused --max-time 5 http://127.0.0.1:5080/health/ready >/dev/null
nginx -t
systemctl reload nginx
echo "Deployment $release_id completed"
