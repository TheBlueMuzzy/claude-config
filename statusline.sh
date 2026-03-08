#!/bin/bash
input=$(cat)

# Extract values — try jq first, fall back to python
if command -v jq &>/dev/null; then
  model=$(echo "$input" | jq -r '.model.display_name // "Claude"')
  used=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
else
  eval $(python3 -c "
import sys,json
d=json.load(sys.stdin)
m=d.get('model',{}).get('display_name','Claude')
u=d.get('context_window',{}).get('used_percentage','')
print(f'model=\"{m}\" used=\"{u}\"')
" <<< "$input" 2>/dev/null)
fi

# No data yet
if [ -z "$used" ]; then
  printf "%s | CTX: --" "$model"
  exit 0
fi

# Integer percentage (bash can't do float math without bc)
pct=${used%%.*}
pct=${pct:-0}

# Color thresholds
if [ "$pct" -ge 78 ]; then
  color="\033[31m"       # Red — about to compact
elif [ "$pct" -ge 65 ]; then
  color="\033[38;5;208m" # Orange — getting close
elif [ "$pct" -ge 50 ]; then
  color="\033[33m"       # Yellow — getting there
else
  color="\033[32m"       # Green — plenty of room
fi
reset="\033[0m"

# Progress bar (10 blocks)
filled=$(( (pct + 5) / 10 ))
[ $filled -gt 10 ] && filled=10
[ $filled -lt 0 ] && filled=0

bar=""
for ((i=0; i<filled; i++)); do bar+="▓"; done
for ((i=filled; i<10; i++)); do bar+="░"; done

printf "${color}CTX: %s %d%%${reset} | %s" "$bar" "$pct" "$model"
