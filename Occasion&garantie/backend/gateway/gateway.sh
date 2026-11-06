#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# Passerelle SMS Occasion & Garantie - a executer dans Termux
# Le telephone interroge le serveur toutes les 5s et envoie
# les SMS avec sa propre carte SIM (aucun IP publique requis).
# ============================================================
set -u

API_URL="${API_URL:-https://www.occasionetgarantie.store/api/sms-gateway}"
GATEWAY_KEY="${GATEWAY_KEY:-REMPLACE_MOI}"
DEVICE_ID="${DEVICE_ID:-$(getprop ro.product.model 2>/dev/null | tr ' ' '-')}"
INTERVAL="${INTERVAL:-5}"

command -v jq >/dev/null 2>&1 || { echo "jq manquant -> pkg install jq"; exit 1; }
command -v termux-sms-send >/dev/null 2>&1 || { echo "termux-api manquant -> pkg install termux-api (et installer l'app Termux:API)"; exit 1; }

termux-wake-lock 2>/dev/null || true

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

ack_one() {
  local id="$1" status="$2" error="$3" payload
  payload=$(jq -n --arg d "$DEVICE_ID" --argjson id "$id" --arg s "$status" --arg e "$error" \
    '{deviceId:$d, results:[{id:$id, status:$s, error:$e}]}')
  local i
  for i in 1 2 3; do
    if curl -s -m 20 -o /dev/null -X POST "$API_URL/ack" \
      -H "x-gateway-key: $GATEWAY_KEY" -H "Content-Type: application/json" -d "$payload"; then
      return 0
    fi
    sleep 3
  done
  log "ACK echec pour #$id"
}

log "Passerelle demarree - device=$DEVICE_ID"
curl -s -m 20 "$API_URL/health" -H "x-gateway-key: $GATEWAY_KEY" | head -c 300; echo

while true; do
  payload=$(jq -n --arg d "$DEVICE_ID" '{deviceId:$d, limit:10}')
  resp=$(curl -s -m 20 -X POST "$API_URL/pull" \
    -H "x-gateway-key: $GATEWAY_KEY" -H "Content-Type: application/json" -d "$payload")

  if [ -z "$resp" ]; then
    sleep "$INTERVAL"; continue
  fi

  count=$(echo "$resp" | jq -r '.messages | length' 2>/dev/null)
  if [ "$count" = "null" ] || [ -z "$count" ]; then
    log "Reponse invalide: $(echo "$resp" | head -c 200)"
    sleep "$INTERVAL"; continue
  fi

  i=0
  while [ "$i" -lt "$count" ]; do
    id=$(echo "$resp" | jq -r ".messages[$i].id")
    phone=$(echo "$resp" | jq -r ".messages[$i].phone")
    msg=$(echo "$resp" | jq -r ".messages[$i].message")
    log "Envoi #$id -> $phone"
    if termux-sms-send -n "$phone" "$msg"; then
      log "OK #$id"
      ack_one "$id" "sent" ""
    else
      log "ECHEC #$id"
      ack_one "$id" "failed" "termux-sms-send a echoue"
    fi
    i=$((i + 1))
  done

  sleep "$INTERVAL"
done
