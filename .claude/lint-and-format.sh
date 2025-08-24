#!/bin/bash

# Read the Claude payload from stdin
PAYLOAD=$(cat)

# Extract the tool name and file path(s) from the payload
TOOL_NAME=$(echo "$PAYLOAD" | jq -r '.tool.name' 2>/dev/null)
FILE_PATH=$(echo "$PAYLOAD" | jq -r '.tool.params.file_path' 2>/dev/null)

# For MultiEdit, get the file_path from params
if [ "$TOOL_NAME" = "MultiEdit" ]; then
  FILE_PATH=$(echo "$PAYLOAD" | jq -r '.tool.params.file_path' 2>/dev/null)
fi

# Check if we got a valid file path
if [ "$FILE_PATH" != "null" ] && [ -n "$FILE_PATH" ]; then
  # Check if it's a JavaScript/TypeScript file
  if echo "$FILE_PATH" | grep -E '\.(ts|tsx|js|jsx)$' > /dev/null; then
    # Run ESLint with auto-fix
    npx eslint --fix "$FILE_PATH" 2>/dev/null || true
    
    # Run Prettier
    npx prettier --write "$FILE_PATH" 2>/dev/null || true
    
    echo "✅ Linted and formatted: $FILE_PATH"
  fi
fi

# Always exit successfully to not block Claude's workflow
exit 0