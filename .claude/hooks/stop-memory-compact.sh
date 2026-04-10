#!/bin/bash
# Remind the agent to save memory if the session was substantive.
# Outputs a message that Claude reads as a user prompt after stopping.
echo "Session ended. If this session involved significant work — decisions made, implementation progress, bugs found, or direction changes — invoke the memory-compact skill to preserve context for future sessions. Skip if the session was trivial."
