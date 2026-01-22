#!/bin/bash
# Ralph - Execute All Phases Sequentially
# This script runs all 5 phases in background using Claude CLI

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/.claude/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create logs directory
mkdir -p "$LOG_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] ✓${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ✗${NC} $1"
}

header() {
    echo ""
    echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  $1${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Change to project directory
cd "$PROJECT_DIR"

header "ROOOM OS - Ralph Execution Plan"
log "Project: $PROJECT_DIR"
log "Logs: $LOG_DIR"
log "Started: $(date)"
echo ""

# Phase definitions
declare -a PHASES=(
    "1|Design System Polish|polish|30|Corriger les 239 violations du design system. Fichiers prioritaires: AIConsole.module.css, embed-packs/packs.css, embed/embed.css, embed-chat/chat.css. Remplacer toutes les couleurs hardcodées par var(--token) et tous les espacements px par var(--space-X). npm run build doit passer.|POLISH_COMPLETE"
    "2|Settings Persistence|feature|25|Connecter Settings.tsx à Supabase. Créer src/services/settings.ts avec CRUD. Créer src/hooks/useSettings.ts avec React Query. Refactorer Settings.tsx pour utiliser le hook avec optimistic updates. npm run build doit passer.|FEATURE_COMPLETE"
    "3|AI Integration|feature|30|Implémenter intégration LLM réelle. Créer src/services/ai.ts avec streaming support. Compléter chatAIService.ts. Refactorer AIConsole.tsx pour afficher des réponses LLM réelles. Intégrer YODA dans Chat.tsx. npm run build doit passer.|FEATURE_COMPLETE"
    "4|Partial Pages|feature|65|Compléter les pages partielles. Clients: ajouter historique activité. Team: implémenter système invitations. Inventory: ajouter génération QR codes. Packs: compléter analytics. npm run build doit passer.|FEATURE_COMPLETE"
    "5|Final Polish|polish|25|Polish final de application. Audit accessibilité et corrections. Performance optimization. Ajouter états loading et error partout. Empty states informatifs. Vérifier 0 violations design system. Créer POLISH-REPORT.md. npm run build doit passer.|POLISH_COMPLETE"
)

run_phase() {
    local phase_num="$1"
    local phase_name="$2"
    local agent="$3"
    local max_iter="$4"
    local prompt="$5"
    local promise="$6"
    local log_file="$LOG_DIR/phase${phase_num}_${TIMESTAMP}.log"

    header "Phase $phase_num: $phase_name"
    log "Agent: $agent"
    log "Max iterations: $max_iter"
    log "Log file: $log_file"
    log "Completion promise: $promise"
    echo ""

    # Build the full prompt with startup sequence
    local full_prompt="Read .claude/context/STARTUP.md then .claude/context/RULES.md then .claude/context/CONTEXT.md then .claude/agents/${agent}-agent.md. MISSION: ${prompt}"

    log "Starting Claude CLI..."

    # Run claude in print mode (non-interactive) with the prompt
    if claude -p "$full_prompt" --max-turns "$max_iter" 2>&1 | tee "$log_file"; then
        success "Phase $phase_num completed!"
        echo "$promise" >> "$log_file"
        return 0
    else
        error "Phase $phase_num failed!"
        return 1
    fi
}

# Main execution
main() {
    local start_time=$(date +%s)
    local failed_phases=()

    for phase_def in "${PHASES[@]}"; do
        IFS='|' read -r num name agent iter prompt promise <<< "$phase_def"

        if ! run_phase "$num" "$name" "$agent" "$iter" "$prompt" "$promise"; then
            failed_phases+=("$num")
            error "Phase $num failed. Continuing with next phase..."
        fi

        # Brief pause between phases
        sleep 2
    done

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    header "EXECUTION COMPLETE"
    log "Total time: $((duration / 60)) minutes $((duration % 60)) seconds"
    log "Logs saved to: $LOG_DIR"

    if [ ${#failed_phases[@]} -eq 0 ]; then
        success "All 5 phases completed successfully!"
        echo ""
        log "Running final verification..."
        npm run build && success "Build passed!" || error "Build failed!"
    else
        error "Failed phases: ${failed_phases[*]}"
        log "Check logs for details."
    fi

    echo ""
    log "Done at $(date)"
}

# Run main function
main 2>&1 | tee "$LOG_DIR/master_${TIMESTAMP}.log"
