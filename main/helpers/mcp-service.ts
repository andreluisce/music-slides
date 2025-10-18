import { spawn, ChildProcess } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

interface MCPServer {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  client?: Client;
  transport?: StdioClientTransport;
  process?: ChildProcess;
}

class MCPService {
  private servers: Map<string, MCPServer> = new Map();

  /**
   * Initialize MCP servers from configuration
   */
  async initializeServers(config: Record<string, any>) {
    for (const [name, serverConfig] of Object.entries(config.mcpServers || {})) {
      await this.addServer(name, serverConfig as any);
    }
  }

  /**
   * Add and start an MCP server
   */
  async addServer(name: string, config: { command: string; args: string[]; env?: Record<string, string> }) {
    try {
      console.log(`[MCP] Starting server: ${name}`);
      
      const server: MCPServer = {
        name,
        command: config.command,
        args: config.args,
        env: config.env
      };

      // Start the MCP server process
      server.process = spawn(config.command, config.args, {
        env: { ...process.env, ...config.env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      if (!server.process.stdout || !server.process.stdin) {
        throw new Error(`Failed to start MCP server: ${name}`);
      }

      // Create transport and client
      server.transport = new StdioClientTransport({
        reader: server.process.stdout,
        writer: server.process.stdin
      });

      server.client = new Client(
        {
          name: 'lyrics-slide-show',
          version: '1.0.0'
        },
        {
          capabilities: {}
        }
      );

      // Connect to the server
      await server.client.connect(server.transport);
      
      this.servers.set(name, server);
      console.log(`[MCP] Server ${name} started successfully`);

    } catch (error) {
      console.error(`[MCP] Failed to start server ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get tools available from an MCP server
   */
  async getTools(serverName: string) {
    const server = this.servers.get(serverName);
    if (!server?.client) {
      throw new Error(`MCP server ${serverName} not found or not connected`);
    }

    const response = await server.client.listTools();
    return response.tools;
  }

  /**
   * Call a tool on an MCP server
   */
  async callTool(serverName: string, toolName: string, arguments_: any = {}) {
    const server = this.servers.get(serverName);
    if (!server?.client) {
      throw new Error(`MCP server ${serverName} not found or not connected`);
    }

    const response = await server.client.callTool({
      name: toolName,
      arguments: arguments_
    });

    return response;
  }

  /**
   * Stop all MCP servers
   */
  async stopAllServers() {
    for (const [name, server] of this.servers) {
      try {
        if (server.client) {
          await server.client.close();
        }
        if (server.process) {
          server.process.kill();
        }
        console.log(`[MCP] Stopped server: ${name}`);
      } catch (error) {
        console.error(`[MCP] Error stopping server ${name}:`, error);
      }
    }
    this.servers.clear();
  }

  /**
   * Stop a specific MCP server
   */
  async stopServer(name: string) {
    const server = this.servers.get(name);
    if (server) {
      try {
        if (server.client) {
          await server.client.close();
        }
        if (server.process) {
          server.process.kill();
        }
        this.servers.delete(name);
        console.log(`[MCP] Stopped server: ${name}`);
      } catch (error) {
        console.error(`[MCP] Error stopping server ${name}:`, error);
      }
    }
  }

  /**
   * Check if a server is running
   */
  isServerRunning(name: string): boolean {
    const server = this.servers.get(name);
    return !!(server?.client && server?.process && !server.process.killed);
  }

  /**
   * Get list of running servers
   */
  getRunningServers(): string[] {
    return Array.from(this.servers.keys()).filter(name => this.isServerRunning(name));
  }
}

// Global MCP service instance
export const mcpService = new MCPService();

// MCP configuration for this app
export const MCP_CONFIG = {
  mcpServers: {
    "firecrawl-mcp": {
      command: "npx",
      args: ["-y", "firecrawl-mcp"],
      env: {
        FIRECRAWL_API_KEY: "fc-77eeb671a72741ea85ed92b32f41e8b9"
      }
    }
  }
};

// Initialize MCP service
export async function initializeMCP() {
  try {
    await mcpService.initializeServers(MCP_CONFIG);
    console.log('[MCP] Service initialized successfully');
    return true;
  } catch (error) {
    console.error('[MCP] Failed to initialize service:', error);
    return false;
  }
}

// Cleanup function for app shutdown
export async function cleanupMCP() {
  await mcpService.stopAllServers();
  console.log('[MCP] Service cleaned up');
}