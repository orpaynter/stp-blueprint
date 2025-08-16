#!/bin/sh
# OrPaynter MCP Server STDIO mode startup script
set -e

# Change to script directory
cd "$(dirname "$0")"

# Create independent virtual environment (if it doesn't exist)
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..." >&2
    uv venv
    echo "Installing dependencies..." >&2
    echo "Note: Dependency installation may take several minutes. Please wait..." >&2
    uv sync
fi

# Check necessary environment variables
if [[ -z "$ORPAYNTER_DB_PATH" ]]; then
    echo "Warning: ORPAYNTER_DB_PATH environment variable not set, using default /tmp/orpaynter.db" >&2
fi

if [[ -z "$ORPAYNTER_UPLOADS_DIR" ]]; then
    echo "Warning: ORPAYNTER_UPLOADS_DIR environment variable not set, using default /tmp/orpaynter_uploads" >&2
fi

if [[ -z "$SENDGRID_API_KEY" ]]; then
    echo "Warning: SENDGRID_API_KEY environment variable not set - email notifications will be disabled" >&2
fi

if [[ -z "$TWILIO_ACCOUNT_SID" ]] || [[ -z "$TWILIO_AUTH_TOKEN" ]] || [[ -z "$TWILIO_PHONE_NUMBER" ]]; then
    echo "Warning: Twilio credentials not set - SMS notifications will be disabled" >&2
fi

# Start STDIO mode MCP server
uv run server.py --transport stdio
