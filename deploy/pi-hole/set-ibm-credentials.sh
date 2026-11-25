#!/bin/bash
set -euo pipefail
[[ $EUID == 0 ]]
config=/etc/quantum-roulette
release=/srv/quantum-roulette/current
exec 9>/run/lock/quantum-roulette-deploy.lock
flock -n 9
umask 077
next=$(mktemp "$config/.ibm.XXXXXXXX")
backup=$(mktemp "$config/.previous.XXXXXXXX")
trap 'rm -f -- "$next" "$backup"' EXIT
tr -d '\r' > "$next"

systemd-run --quiet --collect --wait --pipe --uid=pi-quantum --gid=pi-quantum \
    --working-directory="$release" --property=EnvironmentFile="$next" \
    --property=RuntimeMaxSec=75s --setenv=OPENBLAS_NUM_THREADS=1 \
    "$release/.venv/bin/python" -m backend.check_credentials

had_previous=false
if [[ -f $config/ibm.env ]]; then
    cp -- "$config/ibm.env" "$backup"
    had_previous=true
fi
mv -fT -- "$next" "$config/ibm.env"
if systemctl restart quantum-roulette-api.service; then
    for attempt in $(seq 1 25); do
        status=$(curl -fsS --max-time 2 http://127.0.0.1:8100/health 2>/dev/null || true)
        if grep -q '"hardware_connected":true' <<< "$status"; then
            printf '%s\n' "$status"
            exit 0
        fi
        sleep 2
    done
fi

if [[ $had_previous == true ]]; then
    mv -fT -- "$backup" "$config/ibm.env"
else
    rm -f -- "$config/ibm.env"
fi
systemctl restart quantum-roulette-api.service
echo 'The new credential did not pass the service health check. Restored the previous configuration.' >&2
exit 1
