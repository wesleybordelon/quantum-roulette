#!/bin/bash
set -euo pipefail

archive=$1
revision=$2
base=/srv/quantum-roulette
config=/etc/quantum-roulette
[[ $EUID == 0 && $revision =~ ^[a-f0-9]{40}$ ]]
exec 9>/run/lock/quantum-roulette-deploy.lock
flock -n 9

install -d -o root -g root -m 0755 "$base" "$base/releases"
install -d -o root -g root -m 0750 "$config"
for account in qr-build qr-web pi-quantum; do
    if ! getent passwd "$account" >/dev/null; then
        useradd --system --no-create-home --shell /usr/sbin/nologin "$account"
    fi
done
if [[ ! -e $config/hardware.env ]]; then
    umask 077
    secret=$(mktemp "$config/.hardware.XXXXXXXX")
    python3 -c 'import secrets; print("QUANTUM_ACCESS_CODE=" + secrets.token_urlsafe(24))' > "$secret"
    mv -T -- "$secret" "$config/hardware.env"
    umask 022
fi

stage=$(mktemp -d "$base/staging.XXXXXXXX")
release=$base/releases/$revision
units=(quantum-roulette-api quantum-roulette)
previous=$(readlink "$base/current" || true)
activating=false

cleanup() {
    local status=$? unit
    if [[ $status -ne 0 && $activating == true ]]; then
        set +e
        echo 'Activation failed. Restoring the previous game services.' >&2
        if [[ -n $previous ]]; then
            ln -s -- "$previous" "$stage/rollback"
            mv -fT -- "$stage/rollback" "$base/current"
        else
            rm -f -- "$base/current"
        fi
        for unit in "${units[@]}"; do
            if [[ -f $stage/$unit.service ]]; then
                install -m 0644 "$stage/$unit.service" "/etc/systemd/system/$unit.service"
            else
                systemctl disable --now "$unit.service"
                rm -f -- "/etc/systemd/system/$unit.service"
            fi
        done
        systemctl daemon-reload
        for unit in "${units[@]}"; do
            if [[ -f $stage/$unit.service ]]; then systemctl restart "$unit.service"; fi
        done
    fi
    if [[ $stage == "$base"/staging.* && -d $stage ]]; then
        rm -rf --one-file-system -- "$stage"
    fi
    return "$status"
}
trap cleanup EXIT

if [[ ! -d $release ]]; then
    chmod 0755 "$stage"
    install -d -o qr-build -g qr-build -m 0755 "$stage/source"
    install -d -o qr-build -g qr-build -m 0700 "$stage/cache"
    runuser -u qr-build -- tar -xzf - -C "$stage/source" < "$archive"

    common=(--collect --wait --pipe --uid=qr-build --gid=qr-build
        --working-directory="$stage/source" --setenv=HOME="$stage/cache"
        --property=NoNewPrivileges=yes --property=Nice=7 --property=IOWeight=15)
    systemd-run --unit=quantum-roulette-release-api "${common[@]}" \
        --property=CPUQuota=110% --property=MemoryMax=300M \
        --setenv=OPENBLAS_NUM_THREADS=1 --setenv=OMP_NUM_THREADS=1 \
        /bin/bash -eu -c 'python3 -m venv .venv; .venv/bin/python -m pip --disable-pip-version-check install --only-binary=:all: -r requirements.txt; .venv/bin/python -m pip check; .venv/bin/python -m unittest discover -s tests -p "test_*.py"'
    systemd-run --unit=quantum-roulette-release-web "${common[@]}" \
        --property=CPUQuota=150% --property=MemoryHigh=850M --property=MemoryMax=1280M --property=MemorySwapMax=256M \
        --setenv=PATH=/opt/pi-games-node/bin:/usr/bin:/bin --setenv=NODE_OPTIONS=--max-old-space-size=800 \
        --setenv=NEXT_TELEMETRY_DISABLED=1 \
        /bin/bash -eu -c 'npm ci --ignore-scripts --no-audit --no-fund; npm run build -- --webpack'

    # The build UID owns only staging. Neither running service can change a release.
    chown -hRP root:root "$stage/source"
    chmod 0755 "$stage/source"
    mv -T -- "$stage/source" "$release"
fi

chmod 0700 "$stage"
for unit in "${units[@]}"; do
    source_unit=/etc/systemd/system/$unit.service
    if [[ -f $source_unit ]]; then cp -- "$source_unit" "$stage/$unit.service"; fi
done
activating=true
ln -s -- "$release" "$stage/new-current"
mv -fT -- "$stage/new-current" "$base/current"
for unit in "${units[@]}"; do
    install -m 0644 "$release/deploy/pi-hole/$unit.service" "/etc/systemd/system/$unit.service"
done
systemctl daemon-reload
systemctl enable "${units[@]}"
systemctl restart "${units[@]}"

state=
for attempt in $(seq 1 35); do
    state=$(curl -fsS --max-time 2 http://127.0.0.1:8100/health 2>/dev/null || true)
    if grep -q '"access_configured":true' <<< "$state" \
        && curl -fsS --max-time 3 http://192.168.4.44:3101/ -o /dev/null; then
        break
    fi
    sleep 2
done
grep -q '"access_configured":true' <<< "$state"
curl -fsS --max-time 4 http://192.168.4.44:3101/ -o /dev/null
code=$(curl -sS --max-time 5 -o /dev/null -w '%{http_code}' -X POST http://192.168.4.44:3101/api/quantum-spin)
[[ $code == 401 ]]
activating=false
printf 'Active release: %s\nBackend: %s\nUnauthenticated spin rejected (HTTP %s)\n' "$revision" "$state" "$code"
