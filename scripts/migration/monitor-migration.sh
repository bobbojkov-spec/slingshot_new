#!/bin/bash
# Monitor migration progress in real-time

LOG_FILE="migration.log"

echo "🔍 Monitoring migration progress..."
echo "Press Ctrl+C to stop monitoring (migration will continue in background)"
echo ""

# Function to show progress
show_progress() {
  if [ -f "$LOG_FILE" ]; then
    # Get latest progress
    tail -n 1 "$LOG_FILE" 2>/dev/null | grep -E "\[.*\]|Progress:|✅|❌|Migrating bucket" || echo "Waiting for migration to start..."
  else
    echo "Waiting for log file..."
  fi
}

# Monitor in a loop
while true; do
  clear
  echo "════════════════════════════════════════════════════════════"
  echo "📊 LIVE MIGRATION PROGRESS"
  echo "════════════════════════════════════════════════════════════"
  echo ""
  
  if [ -f "$LOG_FILE" ]; then
    # Show last 30 lines
    tail -n 30 "$LOG_FILE"
    
    # Count successes and failures
    SUCCESS=$(grep -c "✅ Migrated:" "$LOG_FILE" 2>/dev/null || echo "0")
    FAILED=$(grep -c "❌ Failed:" "$LOG_FILE" 2>/dev/null || echo "0")
    
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "📈 Summary: ✅ $SUCCESS migrated | ❌ $FAILED failed"
    echo "════════════════════════════════════════════════════════════"
  else
    echo "⏳ Waiting for migration to start..."
    echo "   (Migration log will appear here once it starts)"
  fi
  
  sleep 2
done

