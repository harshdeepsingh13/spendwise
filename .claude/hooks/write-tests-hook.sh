#!/usr/bin/env bash
# Post-edit hook: spawns a background claude sub-agent to write/run tests for the edited file.
# Fires after Edit or Write tool use.

# Recursion guard — sub-agents inherit this env var so grandchild hooks bail immediately
if [ "${CLAUDE_IN_TEST_HOOK:-0}" = "1" ]; then
  exit 0
fi

# Read the full hook JSON payload from stdin first, then parse it
HOOK_JSON=$(cat)
FILE_PATH=$(echo "$HOOK_JSON" | python3 -c "
import json, sys
try:
    data = json.loads(sys.stdin.read())
    print(data.get('tool_input', {}).get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null || echo "")

# Nothing to do
[ -z "$FILE_PATH" ] && exit 0

# Skip files that should never trigger test generation
case "$FILE_PATH" in
  *.test.*|*.spec.*) exit 0 ;;
  *node_modules*)    exit 0 ;;
  *.md|*.json|*.env*|*.sh|*.yaml|*.yml) exit 0 ;;
  *vitest.config*|*vite.config*|*.claude/*) exit 0 ;;
  */test/setup*) exit 0 ;;
esac

# Per-file PID lock — prevents concurrent sub-agents for the same file
LOCK_KEY=$(echo "$FILE_PATH" | shasum -a 256 | cut -c1-16)
LOCK_FILE="/tmp/claude-test-hook-${LOCK_KEY}.pid"

if [ -f "$LOCK_FILE" ]; then
  OLD_PID=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    exit 0  # Agent still running for this file; skip
  fi
fi

# Spawn sub-agent in background; log to /tmp for debugging
# Prompt is piped via stdin to avoid --allowedTools variadic flag consuming positional args
LOG_FILE="/tmp/claude-test-hook-$(date +%s).log"
echo "/write-tests $FILE_PATH" | CLAUDE_IN_TEST_HOOK=1 claude \
  --print \
  --dangerously-skip-permissions \
  --allowedTools "Read,Edit,Write,Bash,Glob,Grep" \
  > "$LOG_FILE" 2>&1 &

AGENT_PID=$!
echo "$AGENT_PID" > "$LOCK_FILE"
disown $AGENT_PID

exit 0
