#!/bin/bash

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print functions
info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
validate_env() {
  local env=$1
  if [[ ! "$env" =~ ^(staging|prod)$ ]]; then
    error "Invalid environment: $env"
    echo "Usage: $0 <staging|prod>"
    exit 1
  fi
}

# Confirm action
confirm() {
  local message=$1
  read -p "$(echo -e ${YELLOW}$message${NC} [y/N]: )" -n 1 -r
  echo
  [[ $REPLY =~ ^[Yy]$ ]]
}

# Get project ID from tfvars
get_project_id() {
  local env=$1
  grep 'project_id' terraform/environments/$env.tfvars | cut -d'"' -f2
}

# Get region from tfvars
get_region() {
  local env=$1
  grep 'region' terraform/environments/$env.tfvars | cut -d'"' -f2
}
