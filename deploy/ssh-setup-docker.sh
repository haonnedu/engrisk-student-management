#!/bin/bash

# SSH into server and setup Docker before deployment
# This script will SSH into your server and run the Docker setup

set -e

# Server details
SERVER_IP="103.216.117.100"
SERVER_USER="root"
SERVER_PASSWORD="tMlB5PJbeO7%rJpJE#Wc"
SSH_PORT="24700"

echo "🚀 Setting up Docker on server via SSH..."

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo "Installing sshpass..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install hudochenkov/sshpass/sshpass
        else
            echo "Please install sshpass manually on macOS"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt update && sudo apt install -y sshpass
    else
        echo "Please install sshpass manually for your OS"
        exit 1
    fi
fi

# Copy setup script to server
echo "📤 Copying setup script to server..."
sshpass -p "$SERVER_PASSWORD" scp -P $SSH_PORT -o StrictHostKeyChecking=no deploy/setup-docker.sh $SERVER_USER@$SERVER_IP:/tmp/

# Make script executable and run it
echo "🔧 Running Docker setup on server..."
sshpass -p "$SERVER_PASSWORD" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
    chmod +x /tmp/setup-docker.sh
    /tmp/setup-docker.sh
EOF

echo "✅ Docker setup completed on server!"
echo "You can now run the GitHub Actions deployment."
