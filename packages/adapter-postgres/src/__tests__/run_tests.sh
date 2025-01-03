#!/bin/bash

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SCHEMA_PATH="$SCRIPT_DIR/../../schema.sql"

echo -e "${YELLOW}Starting PostgreSQL test environment...${NC}"

# Determine Docker Compose command
if [[ "$OSTYPE" == "darwin"* ]]; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    DOCKER_COMPOSE_CMD="docker-compose"
fi

# Stop any existing containers
echo -e "${YELLOW}Cleaning up existing containers...${NC}"
$DOCKER_COMPOSE_CMD -f docker-compose.test.yml down

# Start fresh container
echo -e "${YELLOW}Starting PostgreSQL container...${NC}"
$DOCKER_COMPOSE_CMD -f docker-compose.test.yml up -d

# Function to check if PostgreSQL is ready
check_postgres() {
    $DOCKER_COMPOSE_CMD -f docker-compose.test.yml exec -T postgres-test pg_isready -U postgres
}

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
RETRIES=30
until check_postgres || [ $RETRIES -eq 0 ]; do
    echo -e "${YELLOW}Waiting for PostgreSQL to be ready... ($RETRIES attempts left)${NC}"
    RETRIES=$((RETRIES-1))
    sleep 1
done

if [ $RETRIES -eq 0 ]; then
    echo -e "${RED}Failed to connect to PostgreSQL${NC}"
    $DOCKER_COMPOSE_CMD -f docker-compose.test.yml logs
    exit 1
fi

echo -e "${GREEN}PostgreSQL is ready!${NC}"

# Load schema
echo -e "${YELLOW}Loading database schema...${NC}"
if [ ! -f "$SCHEMA_PATH" ]; then
    echo -e "${RED}Schema file not found at: $SCHEMA_PATH${NC}"
    exit 1
fi

# Fix: Check exit code directly instead of using $?
if ! $DOCKER_COMPOSE_CMD -f docker-compose.test.yml exec -T postgres-test psql -U postgres -d eliza_test -f - < "$SCHEMA_PATH"; then
    echo -e "${RED}Failed to load schema${NC}"
    exit 1
fi
echo -e "${GREEN}Schema loaded successfully!${NC}"

# Run the tests
echo -e "${YELLOW}Running tests...${NC}"
if ! pnpm vitest vector-extension.test.ts; then
    echo -e "${RED}Tests failed!${NC}"
    $DOCKER_COMPOSE_CMD -f docker-compose.test.yml down
    exit 1
fi

echo -e "${GREEN}Tests completed successfully!${NC}"

# Clean up
echo -e "${YELLOW}Cleaning up test environment...${NC}"
$DOCKER_COMPOSE_CMD -f docker-compose.test.yml down 