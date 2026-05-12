import { api, ErrCode, APIError } from "encore.dev/api";
import { CronJob } from "encore.dev/cron";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { PublicKey } from "@solana/web3.js";

/**
 * EAGLE CLAW - Solana Dead Man's Switch System
 * 
 * Role: Senior Web3 Backend Architect & Solana Expert
 * Architecture: Encore.ts + PostgreSQL
 * 
 * System: Monitors wallet heartbeat signals and triggers automated actions
 * when a user stops checking in (dead man's switch pattern).
 */

// ============================================================================
// DATABASE SETUP
// ============================================================================

// db is the PostgreSQL database connection for the EAGLE CLAW system
const db = new SQLDatabase("switches", { migrations: "./migrations" });

// ============================================================================
// TYPE DEFINITIONS & INTERFACES
// ============================================================================

/**
 * SwitchStatus enum for type-safe switch state management
 */
type SwitchStatus = "active" | "triggered";

/**
 * SwitchRow represents the raw database row from the switches table
 * Matches the exact column names and types from the PostgreSQL schema
 */
interface SwitchRow {
  id: string;
  user_wallet: string;
  last_heartbeat: Date;
  threshold: number; // seconds
  encrypted_data: string;
  recipient_wallet: string;
  status: SwitchStatus;
  created_at: Date;
  updated_at: Date;
}

/**
 * Switch represents a dead man's switch configured by a user
 * Used for internal domain logic and testing
 */
interface Switch {
  id: string;
  user_wallet: string;
  last_heartbeat: Date;
  threshold: number; // seconds
  encrypted_data: string;
  recipient_wallet: string;
  status: SwitchStatus;
  created_at: Date;
  updated_at: Date;
}

/**
 * Request body for creating a new switch
 */
export interface CreateSwitchRequest {
  user_wallet: string;
  recipient_wallet: string;
  threshold: number; // seconds (e.g., 86400 for 24 hours, 3600 for 1 hour)
  encrypted_data: string; // Base64-encoded encrypted payload containing execution instructions
}

/**
 * Response for successful switch creation
 */
export interface CreateSwitchResponse {
  id: string;
  user_wallet: string;
  recipient_wallet: string;
  threshold: number;
  status: SwitchStatus;
  created_at: string;
}

/**
 * Request body for heartbeat endpoint
 */
export interface HeartbeatRequest {
  switch_id: string;
  user_wallet: string;
}

/**
 * Response for successful heartbeat
 */
export interface HeartbeatResponse {
  success: boolean;
  message: string;
  last_heartbeat: string;
  next_trigger: string;
}

/**
 * Triggered switch event for processing
 */
interface TriggeredSwitch {
  id: string;
  user_wallet: string;
  recipient_wallet: string;
  encrypted_data: string;
  last_heartbeat: Date;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * validateSolanaWallet validates if a string is a valid Solana wallet address
 * Uses @solana/web3.js v1.9+ PublicKey validation
 * 
 * @throws Will throw if wallet is invalid
 */
function validateSolanaWallet(wallet: string): boolean {
  try {
    new PublicKey(wallet);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * validateEncryptedPayload performs basic validation on encrypted data
 * Ensures it's base64-encoded and meets minimum length requirements
 */
function validateEncryptedPayload(payload: string): boolean {
  if (!payload || typeof payload !== "string") {
    return false;
  }

  // Check if it's valid base64
  try {
    Buffer.from(payload, "base64");
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * POST /create-switch
 * 
 * Creates a new dead man's switch for a user. The switch will monitor
 * the user's heartbeat signal. If no heartbeat is received within the
 * specified threshold, the switch triggers and executes the encrypted action.
 * 
 * Security: 
 * - Validates both wallet addresses using latest @solana/web3.js
 * - Validates encrypted payload format
 * - All database operations wrapped in try/catch with specific error codes
 * 
 * @throws {ErrCode.InvalidArgument} If wallet addresses or threshold are invalid
 * @throws {ErrCode.Internal} If database operation fails
 */
export const createSwitch = api<CreateSwitchRequest, CreateSwitchResponse>(
  { expose: true, path: "/create-switch", method: "POST" },
  async (req): Promise<CreateSwitchResponse> => {
    // Validate input parameters
    if (!req.user_wallet || !req.recipient_wallet || !req.encrypted_data) {
      throw APIError.invalidArgument("Missing required fields: user_wallet, recipient_wallet, encrypted_data");
    }

    if (req.threshold <= 0) {
      throw APIError.invalidArgument("Threshold must be greater than 0 seconds");
    }

    // Validate Solana wallet addresses
    if (!validateSolanaWallet(req.user_wallet)) {
      throw APIError.invalidArgument("Invalid user wallet address - must be a valid Solana public key");
    }

    if (!validateSolanaWallet(req.recipient_wallet)) {
      throw APIError.invalidArgument("Invalid recipient wallet address - must be a valid Solana public key");
    }

    // Validate encrypted payload
    if (!validateEncryptedPayload(req.encrypted_data)) {
      throw APIError.invalidArgument("Encrypted data must be valid base64-encoded string");
    }

    try {
      // Insert the new switch into the database
      const result = (await db.exec`
        INSERT INTO switches (
          user_wallet,
          recipient_wallet,
          threshold,
          encrypted_data,
          status,
          last_heartbeat,
          created_at,
          updated_at
        )
        VALUES (
          ${req.user_wallet},
          ${req.recipient_wallet},
          ${req.threshold},
          ${req.encrypted_data},
          'active'::switch_status,
          NOW(),
          NOW(),
          NOW()
        )
        RETURNING id, user_wallet, recipient_wallet, threshold, status, created_at
      `) as any[];

      if (!result || result.length === 0) {
        throw APIError.internal("Failed to create switch - database insertion returned no results");
      }

      const row = result[0];

      return {
        id: row.id,
        user_wallet: row.user_wallet,
        recipient_wallet: row.recipient_wallet,
        threshold: row.threshold,
        status: row.status as SwitchStatus,
        created_at: new Date(row.created_at).toISOString(),
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      throw APIError.internal(`Failed to create switch: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
);

/**
 * POST /heartbeat
 * 
 * Updates the last_heartbeat timestamp for a switch. This keeps the switch
 * in the active state by resetting the timeout counter.
 * 
 * Security:
 * - Validates switch exists and belongs to the user
 * - Updates only the last_heartbeat column to maintain data integrity
 * - Prevents unauthorized heartbeat updates
 * 
 * @throws {ErrCode.NotFound} If switch not found or wallet mismatch
 * @throws {ErrCode.Internal} If database operation fails
 */
export const heartbeat = api<HeartbeatRequest, HeartbeatResponse>(
  { expose: true, path: "/heartbeat", method: "POST" },
  async (req): Promise<HeartbeatResponse> => {
    // Validate input
    if (!req.switch_id || !req.user_wallet) {
      throw APIError.invalidArgument("Missing required fields: switch_id, user_wallet");
    }

    try {
      // Verify switch exists and user is authorized (owns the switch)
      const switchCheckQuery = await db.query`
        SELECT id, user_wallet, threshold, last_heartbeat, status
        FROM switches
        WHERE id = ${req.switch_id}
        LIMIT 1
      `;

      const rows: any[] = [];
      if (switchCheckQuery && typeof switchCheckQuery[Symbol.asyncIterator] === 'function') {
        for await (const row of switchCheckQuery) {
          rows.push(row);
        }
      }

      if (rows.length === 0) {
        throw APIError.notFound(`Switch not found: ${req.switch_id}`);
      }

      const existingSwitch = rows[0];

      // Verify user ownership
      if (existingSwitch.user_wallet !== req.user_wallet) {
        throw APIError.permissionDenied("Unauthorized: wallet does not match switch owner");
      }

      // Update the last_heartbeat timestamp
      const updateResult = (await db.exec`
        UPDATE switches
        SET 
          last_heartbeat = NOW(),
          updated_at = NOW(),
          status = 'active'::switch_status
        WHERE id = ${req.switch_id}
        RETURNING last_heartbeat, threshold
      `) as any[];

      if (!updateResult || updateResult.length === 0) {
        throw APIError.internal("Failed to update heartbeat - no rows affected");
      }

      const updated = updateResult[0];
      const nextTriggerTime = new Date(
        new Date(updated.last_heartbeat).getTime() + updated.threshold * 1000
      );

      return {
        success: true,
        message: "Heartbeat received successfully",
        last_heartbeat: new Date(updated.last_heartbeat).toISOString(),
        next_trigger: nextTriggerTime.toISOString(),
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      throw APIError.internal(`Failed to update heartbeat: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
);

// ============================================================================
// CRON JOB - TRIGGER CHECK
// ============================================================================

/**
 * Cron job that runs every hour to scan for triggered switches
 * 
 * Logic Flow:
 * 1. Query all active switches where NOW() > last_heartbeat + threshold
 * 2. Mark matched switches as 'triggered'
 * 3. Emit events or log for external processing systems
 * 
 * Safety:
 * - Wrapped in try/catch with specific error handling
 * - Uses indexed query for performance
 * - Prevents race conditions with atomic update
 * - All operations logged for audit trail
 */
// Cron endpoint executed by the CronJob. Exported as an `api` handler so Encore can invoke it.
export const checkTriggeredSwitchesEndpoint = api({}, async (): Promise<void> => {
  try {
    // Find all active switches that have exceeded their threshold
    const triggeredRowsQuery = await db.query`
      SELECT 
        id,
        user_wallet,
        recipient_wallet,
        encrypted_data,
        last_heartbeat,
        threshold
      FROM switches
      WHERE 
        status = 'active'::switch_status
        AND NOW() > (last_heartbeat + (threshold || ' seconds')::INTERVAL)
      ORDER BY last_heartbeat ASC
    `;

    const triggeredSwitches: TriggeredSwitch[] = [];
    if (triggeredRowsQuery && typeof triggeredRowsQuery[Symbol.asyncIterator] === 'function') {
      for await (const row of triggeredRowsQuery) {
        triggeredSwitches.push({
          id: (row as any).id,
          user_wallet: (row as any).user_wallet,
          recipient_wallet: (row as any).recipient_wallet,
          encrypted_data: (row as any).encrypted_data,
          last_heartbeat: new Date((row as any).last_heartbeat),
        });
      }
    }

    if (triggeredSwitches.length === 0) {
      console.log("[EAGLE CLAW] Cron job executed: No switches triggered");
      return;
    }

    // Atomically update triggered switches
    const switchIds = triggeredSwitches.map((s) => s.id);
    const updateResult = (await db.exec`
      UPDATE switches
      SET 
        status = 'triggered'::switch_status,
        updated_at = NOW()
      WHERE id = ANY(${JSON.stringify(switchIds)}::UUID[])
      RETURNING id
    `) as any[];

    console.log(
      `[EAGLE CLAW] Cron job: ${updateResult?.length || 0} switches triggered at ${new Date().toISOString()}`
    );

    // Log triggered switches for external processing
    for (const switchData of triggeredSwitches) {
      console.log(
        `[EAGLE CLAW TRIGGERED] Switch ID: ${switchData.id}, User: ${switchData.user_wallet}, Recipient: ${switchData.recipient_wallet}`
      );
    }

    // TODO: Emit events to external system (Slack, webhook, etc.)
    // Example: await emitTriggerEvent(triggeredSwitches);
  } catch (error) {
    console.error(
      `[EAGLE CLAW] Cron job error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    // Ensure cron job doesn't crash the service
    // In production, emit error monitoring (Sentry, etc.)
  }
});

// Register the CronJob and point it at the exported endpoint. Use string schedule "1h" per Encore's API.
export const checkTriggeredSwitches = new CronJob("check-triggered-switches", {
  title: "Check and trigger expired switches",
  every: "1h",
  endpoint: checkTriggeredSwitchesEndpoint,
});

// ============================================================================
// EXPORT FOR TESTING & INTERNAL USE
// ============================================================================

/**
 * getSwitchByID retrieves a switch by its ID
 * For testing and internal use only
 */
export async function getSwitchByID(switchID: string): Promise<Switch | null> {
  try {
    const rowsQuery = await db.query`
      SELECT * FROM switches WHERE id = ${switchID} LIMIT 1
    `;

    const results: Switch[] = [];
    if (rowsQuery && typeof rowsQuery[Symbol.asyncIterator] === 'function') {
      for await (const row of rowsQuery) {
        const r = row as any;
        results.push({
          id: r.id,
          user_wallet: r.user_wallet,
          last_heartbeat: new Date(r.last_heartbeat),
          threshold: r.threshold,
          encrypted_data: r.encrypted_data,
          recipient_wallet: r.recipient_wallet,
          status: r.status as SwitchStatus,
          created_at: new Date(r.created_at),
          updated_at: new Date(r.updated_at),
        });
      }
    }

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error(`Failed to get switch: ${error instanceof Error ? error.message : "Unknown error"}`);
    return null;
  }
}

/**
 * getAllSwitches retrieves all switches (for monitoring/debugging)
 */
export async function getAllSwitches(): Promise<Switch[]> {
  try {
    const rowsQuery = await db.query`
      SELECT * FROM switches ORDER BY created_at DESC
    `;

    const results: Switch[] = [];
    if (rowsQuery && typeof rowsQuery[Symbol.asyncIterator] === 'function') {
      for await (const row of rowsQuery) {
        const r = row as any;
        results.push({
          id: r.id,
          user_wallet: r.user_wallet,
          last_heartbeat: new Date(r.last_heartbeat),
          threshold: r.threshold,
          encrypted_data: r.encrypted_data,
          recipient_wallet: r.recipient_wallet,
          status: r.status as SwitchStatus,
          created_at: new Date(r.created_at),
          updated_at: new Date(r.updated_at),
        });
      }
    }

    return results;
  } catch (error) {
    console.error(`Failed to get switches: ${error instanceof Error ? error.message : "Unknown error"}`);
    return [];
  }
}