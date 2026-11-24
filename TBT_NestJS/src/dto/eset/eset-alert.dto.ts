import { IsOptional, IsString } from 'class-validator';

/**
 * ESET PROTECT / ESET Inspect webhook payload.
 * All fields are optional because ESET sends different shapes
 * depending on the event type (threat, firewall, HIPS, etc.).
 */
export class EsetAlertDto {
  @IsOptional() @IsString()
  event_type?: string;       // e.g. "Threat_Event", "FirewallAggregated_Event"

  @IsOptional() @IsString()
  ipv4?: string;             // Affected machine IPv4

  @IsOptional() @IsString()
  hostname?: string;         // Affected machine hostname

  @IsOptional() @IsString()
  source_uuid?: string;

  @IsOptional() @IsString()
  occured?: string;          // ISO timestamp

  @IsOptional() @IsString()
  severity?: string;         // "Critical", "Error", "Warning", "Information"

  @IsOptional() @IsString()
  group_name?: string;       // ESET group the machine belongs to

  @IsOptional() @IsString()
  os_name?: string;

  @IsOptional() @IsString()
  threat_type?: string;      // e.g. "Virus", "Trojan"

  @IsOptional() @IsString()
  threat_name?: string;      // e.g. "Win32/Malware.A"

  @IsOptional() @IsString()
  scanner_id?: string;       // e.g. "Real-time file system protection"

  @IsOptional() @IsString()
  object_type?: string;

  @IsOptional() @IsString()
  object_url?: string;       // File path or URL of the threat

  @IsOptional() @IsString()
  action_taken?: string;     // e.g. "Cleaned", "Quarantined", "No action"

  @IsOptional() @IsString()
  username?: string;         // Logged-in user on affected machine

  @IsOptional() @IsString()
  threat_flags?: string;

  @IsOptional() @IsString()
  engine_version?: string;

  @IsOptional() @IsString()
  scan_id?: string;

  // Allow any extra fields ESET may send
  [key: string]: unknown;
}
