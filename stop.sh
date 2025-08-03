#!/bin/bash

# Stop script on first error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default port if not found in .env
DEFAULT_PORT=3000

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get port from .env file
get_server_port() {
    local env_file="./.env"
    local port=$DEFAULT_PORT
    
    if [ -f "$env_file" ]; then
        # Try to get port from .env file
        local env_port=$(grep -E '^PORT=' "$env_file" | cut -d '=' -f2 | tr -d "'\"" | tr -d ' ')
        if [ -n "$env_port" ]; then
            port=$env_port
        fi
    fi
    
    echo "$port"
}

# Function to stop process on specific port
stop_process_on_port() {
    local port=$1
    local process_name=$2
    local pid=""
    
    # Try lsof first
    if command_exists lsof; then
        pid=$(lsof -ti :$port)
    fi
    
    # If lsof didn't find anything, try ss
    if [ -z "$pid" ] && command_exists ss; then
        pid=$(ss -tulpn 2>/dev/null | grep ":$port " | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u)
    fi
    
    # If still nothing, try netstat
    if [ -z "$pid" ] && command_exists netstat; then
        pid=$(netstat -tulpn 2>/dev/null | grep ":$port " | grep -o '[0-9]*/' | cut -d/ -f1 | sort -u)
    fi
    
    # If we found PIDs, kill them
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}Found process $process_name (PID: $pid) using port $port, killing it...${NC}"
        kill -9 $pid 2>/dev/null || true
        # Give it a moment to die
        sleep 1
        # Verify it's dead
        if command_exists lsof; then
            if lsof -ti :$port >/dev/null; then
                echo -e "${RED}⚠ Process $process_name still running on port $port, trying force kill...${NC}"
                kill -9 $(lsof -ti :$port) 2>/dev/null || true
            fi
        fi
        echo -e "${GREEN}✓ Process $process_name on port $port stopped${NC}"
        return 0
    fi
    
    # If we get here, try one last time with fuser if available
    if command_exists fuser; then
        if fuser $port/tcp >/dev/null 2>&1; then
            echo -e "${YELLOW}Found process using port $port with fuser, killing it...${NC}"
            fuser -k $port/tcp >/dev/null 2>&1 || true
            sleep 1
            if ! fuser $port/tcp >/dev/null 2>&1; then
                echo -e "${GREEN}✓ Process on port $port stopped using fuser${NC}"
                return 0
            fi
        fi
    fi
    
    echo -e "${YELLOW}ℹ No process found running on port $port${NC}"
    return 1
}

# Function to stop Node.js server
stop_node_server() {
    echo -e "${YELLOW}Stopping Node.js server...${NC}"
    
    # Stop process on main port from .env
    local port=$(get_server_port)
    stop_process_on_port $port "Node.js server"
    
    # Also stop process on port 5001 if it's different
    if [ "$port" != "5001" ]; then
        stop_process_on_port 5001 "Node.js server (port 5001)" || true
    fi
    
    # Fallback to the old method if no process was found on ports
    if pgrep -f "node.*server\.js" > /dev/null; then
        echo -e "${YELLOW}Found Node.js processes, killing them...${NC}"
        pkill -f "node.*server\.js"
        echo -e "${GREEN}✓ All Node.js server processes stopped${NC}"
    else
        echo -e "${GREEN}✓ No Node.js server processes found running${NC}"
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
