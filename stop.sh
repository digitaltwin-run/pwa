#!/bin/bash

# Stop script on first error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to stop Node.js server
stop_node_server() {
    echo -e "${YELLOW}Stopping Node.js server...${NC}"
    
    # Find and kill Node.js processes running server.js
    if pgrep -f "node.*server\.js" > /dev/null; then
        pkill -f "node.*server\.js"
        echo -e "${GREEN}✓ Node.js server stopped${NC}"
    else
        echo -e "${YELLOW}ℹ No Node.js server process found${NC}"
    fi
}

# Function to stop Docker containers
stop_docker_containers() {
    # Check if Docker is installed and running
    if ! command_exists docker; then
        echo -e "${YELLOW}ℹ Docker is not installed, skipping Docker cleanup${NC}"
        return 0
    fi

    if ! docker info > /dev/null 2>&1; then
        echo -e "${YELLOW}ℹ Docker daemon is not running, skipping Docker cleanup${NC}"
        return 0
    fi

    # Check if docker-compose is available
    local compose_cmd="docker-compose"
    if ! command_exists docker-compose; then
        if docker compose version > /dev/null 2>&1; then
            compose_cmd="docker compose"
        else
            echo -e "${YELLOW}ℹ docker-compose is not available, using docker commands directly${NC}"
            compose_cmd=""
        fi
    fi

    # Stop and remove containers
    if [ -n "$compose_cmd" ] && [ -f "docker-compose.yml" ]; then
        echo -e "${YELLOW}Stopping Docker containers...${NC}"
        $compose_cmd down --remove-orphans
        echo -e "${GREEN}✓ Docker containers stopped and removed${NC}"
    else
        echo -e "${YELLOW}ℹ No docker-compose.yml found or docker-compose not available, stopping all project containers${NC}"
        
        # Stop all running containers if any
        if [ "$(docker ps -q)" ]; then
            echo "Stopping all running containers..."
            docker stop $(docker ps -q)
        fi
        
        # Remove all stopped containers
        if [ "$(docker ps -aq)" ]; then
            echo "Removing stopped containers..."
            docker rm $(docker ps -aq)
        fi
    fi

    # Prune unused networks
    echo -e "${YELLOW}Cleaning up Docker networks...${NC}"
    docker network prune -f
}

# Function to clean up temporary files
cleanup_temp_files() {
    echo -e "${YELLOW}Cleaning up temporary files...${NC}"
    
    # Remove npm debug logs if they exist
    if [ -f "npm-debug.log" ]; then
        rm -f npm-debug.log
        echo -e "${GREEN}✓ Removed npm-debug.log${NC}"
    fi
    
    # Clean up any other temporary files if needed
    # Example: rm -rf /tmp/your-app-temp-*
}

# Main execution
echo -e "\n${GREEN}=== Stopping Digital Twin Application ===${NC}\n"

# Stop Node.js server
stop_node_server

# Stop Docker containers
stop_docker_containers

# Clean up temporary files
cleanup_temp_files

echo -e "\n${GREEN}✓ All services stopped successfully!${NC}\n"

exit 0
