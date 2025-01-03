#!/bin/bash

# Check Node.js version
REQUIRED_NODE_VERSION=23.3.0
CURRENT_NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')

if (( CURRENT_NODE_VERSION < REQUIRED_NODE_VERSION )); then
    echo "Error: Node.js version must be $REQUIRED_NODE_VERSION or higher. Current version is $CURRENT_NODE_VERSION."
    exit 1
fi

# Navigate to the script's directory
cd "$(dirname "$0")"/..

cd tests
node test1.mjs
