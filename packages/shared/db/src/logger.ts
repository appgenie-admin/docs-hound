/**
 * Simple logger that writes to stderr and respects MCP_MODE
 * In MCP mode, logging is disabled to avoid polluting the JSON-RPC protocol
 */

const isMCPMode = process.env.MCP_MODE === 'true'

export const logger = {
  info: (message: string) => {
    if (!isMCPMode) {
      // Write to stderr to avoid breaking stdout-based protocols
      console.error(message)
    }
  },
  error: (message: string) => {
    // Always log errors, even in MCP mode
    console.error(message)
  },
  debug: (message: string) => {
    if (!isMCPMode && process.env.DEBUG) {
      console.error(message)
    }
  },
}
