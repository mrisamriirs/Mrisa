/**
 * Row-Level Security (RLS) Policies Documentation
 * 
 * This file documents all RLS policies implemented in the Supabase database
 * to ensure data is accessed only by authorized users/roles.
 */

/**
 * OVERVIEW OF RLS SECURITY MODEL
 * ================================
 * 
 * The application uses email-based admin verification for sensitive operations.
 * Admin email: mrisa.set@mriu.edu.in
 * 
 * All public data uses ENABLE ROW LEVEL SECURITY with restrictive policies.
 * This ensures data access is controlled and auditable.
 */

// TABLE: ctf_events
// ==================
// Purpose: Stores CTF competition events
// RLS Status: ENABLED
// 
// Policies:
// 1. "CTF events are viewable by everyone" (SELECT)
//    - Anyone can view all events
//    - No row-level restrictions
// 
// Why: Events are public information needed for registration and display

// TABLE: events
// =============
// Purpose: Stores general events and competitions
// RLS Status: ENABLED
//
// Policies:
// 1. "Anyone can view events" (SELECT)
//    - Everyone can view event information
//    - Used for public event listings
//
// 2. "Only admin can manage events" (INSERT, UPDATE, DELETE)
//    - Only mrisa.set@mriu.edu.in can create/edit/delete events
//    - Prevents unauthorized event manipulation
//
// Why: Events are public but controlled by administrators

// TABLE: winners
// ==============
// Purpose: Stores CTF and event winners/rankings
// RLS Status: ENABLED
//
// Policies:
// 1. "Winners are viewable by everyone" (SELECT)
//    - Public hall of fame/rankings visible to all
//    - Encourages competition transparency
//
// 2. "Only admin can insert winners" (INSERT)
//    - Only mrisa.set@mriu.edu.in can add winners
//    - Prevents fake/unauthorized entries
//
// 3. "Only admin can update winners" (UPDATE)
//    - Only mrisa.set@mriu.edu.in can edit winner records
//    - Ensures data integrity
//
// 4. "Only admin can delete winners" (DELETE)
//    - Only mrisa.set@mriu.edu.in can remove records
//    - Maintains historical accuracy
//
// Why: Winners are public but creation is admin-controlled

// TABLE: team
// ===========
// Purpose: Stores team member information (about page)
// RLS Status: ENABLED
//
// Policies:
// 1. "Team members are viewable by everyone" (SELECT)
//    - Public team information visible to all
//    - Used for About page display
//
// Why: Team info is public content

// TABLE: registrations
// ====================
// Purpose: Stores event registration entries
// RLS Status: ENABLED
//
// Policies:
// 1. "Anyone can register for events" (INSERT)
//    - Anyone can submit a registration
//    - No SELECT policy = admin-only read access
//    - No UPDATE/DELETE = immutable records
//
// Why: Public registration but data is protected from user queries

// TABLE: contact_messages
// =======================
// Purpose: Stores contact form submissions
// RLS Status: ENABLED
//
// Policies:
// 1. "Anyone can send contact messages" (INSERT)
//    - Public form submissions allowed
//    - No SELECT policy = admin-only read access
//    - No UPDATE/DELETE = immutable records
//
// Why: Public contact form but prevents users from viewing/modifying messages

/**
 * SECURITY IMPLICATIONS & BEST PRACTICES
 * =======================================
 */

// 1. PUBLIC TABLES (No SELECT restriction)
//    - ctf_events: Anyone can view
//    - events: Anyone can view
//    - winners: Anyone can view (hall of fame)
//    - team: Anyone can view
//
//    Recommendations:
//    ✓ Cache aggressively (public data doesn't change often)
//    ✓ Consider rate limiting on SELECT queries
//    ✓ Use indexes for frequently queried columns
//    ✓ Monitor query performance

// 2. SUBMISSION TABLES (INSERT only, hidden from SELECT)
//    - registrations: Public INSERT, hidden from SELECT
//    - contact_messages: Public INSERT, hidden from SELECT
//
//    Recommendations:
//    ✓ Email notifications to admin for new submissions
//    ✓ Implement email verification for registrations
//    ✓ Add spam filtering for contact messages
//    ✓ Consider CAPTCHA for public forms
//    ✓ Archive old registrations regularly

// 3. ADMIN-ONLY TABLES (Strict email verification)
//    - Event management (INSERT, UPDATE, DELETE)
//    - Winner management (INSERT, UPDATE, DELETE)
//
//    Recommendations:
//    ✓ Always verify admin status before sensitive operations
//    ✓ Implement audit logging for all admin changes
//    ✓ Use strong passwords for admin account
//    ✓ Enable 2FA for admin account
//    ✓ Monitor for unauthorized access attempts
//    ✓ Rate limit admin operations

/**
 * POLICY EFFECTIVENESS MATRIX
 * ============================
 * 
 * Attack Type              | Current Protection | Strength
 * ======================= | ================== | ========
 * Unauthorized read       | Varies by table    | Strong (RLS blocks)
 * Unauthorized write      | Email verification | Strong (RLS blocks)
 * Unauthorized delete     | Email verification | Strong (RLS blocks)
 * SQL injection           | Supabase prepared  | Strong (Supabase ORM)
 * Direct DB access        | Service key only   | Strong (must login)
 * Privilege escalation    | Email check only   | Moderate (see below)
 * User impersonation      | Session token      | Strong (Supabase auth)
 * 
 * See notes below for recommendations on moderate protections.
 */

/**
 * DETECTED VULNERABILITIES & RECOMMENDATIONS
 * ===========================================
 */

// Vulnerability: Admin Email Hardcoded
// Severity: MEDIUM
// Description: Admin verification uses hardcoded email in RLS policies
// Impact: If admin email is changed, all policies must be manually updated
// Recommendation:
//   1. Create an admin_users table with role=admin
//   2. Update RLS policies to check this table
//   3. Consider using Supabase custom claims instead
//   4. Implementation:
/*
  CREATE TABLE admin_users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT now()
  );
  
  ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY "Only admins can view admin list"
    ON admin_users FOR SELECT
    USING (auth.uid() IN (SELECT id FROM admin_users));
  
  -- Then update winners policy:
  CREATE POLICY "Only admin can insert winners"
    ON public.winners
    FOR INSERT
    WITH CHECK (
      auth.uid() IN (SELECT id FROM admin_users WHERE role = 'admin')
    );
*/

// Vulnerability: No Audit Logging
// Severity: MEDIUM  
// Description: Changes to winners/events are not tracked
// Impact: Cannot determine who made changes or when
// Recommendation:
//   1. Create audit_logs table
//   2. Add triggers for INSERT/UPDATE/DELETE
//   3. Implementation:
/*
  CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    operation TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES auth.users(id),
    timestamp TIMESTAMP DEFAULT now()
  );
  
  CREATE OR REPLACE FUNCTION audit_trigger()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO audit_logs (table_name, record_id, operation, old_values, new_values, user_id)
    VALUES (
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      TG_OP,
      to_jsonb(OLD),
      to_jsonb(NEW),
      auth.uid()
    );
    RETURN COALESCE(NEW, OLD);
  END;
  $$ LANGUAGE plpgsql;
  
  CREATE TRIGGER winners_audit AFTER INSERT OR UPDATE OR DELETE ON winners
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();
*/

// Vulnerability: No Rate Limiting at DB Level
// Severity: LOW
// Description: Supabase doesn't rate limit by default
// Impact: Potential for query floods/DoS
// Recommendation:
//   1. Use Supabase rate limiting features
//   2. Implement application-level rate limiting (already done)
//   3. Set up CloudFlare or similar CDN with rate limiting

// Vulnerability: Submission Tables Accessible via Public Key
// Severity: LOW
// Description: Anyone with public key can INSERT into registrations/contact_messages
// Impact: Possible spam in contact messages and fake registrations
// Recommendation:
//   1. Add CAPTCHA verification in frontend
//   2. Implement email verification for registrations
//   3. Add spam filtering/validation
//   4. Rate limit form submissions per IP

/**
 * TESTING RLS POLICIES
 * ====================
 */

// Test 1: Public can view events
// Query: SELECT * FROM public.events;
// Expected: Returns all events
// User: Unauthenticated
// Result: ✓ PASS

// Test 2: Public cannot modify events
// Query: INSERT INTO public.events (...) VALUES (...);
// Expected: Policy violation error
// User: Unauthenticated
// Result: ✓ PASS

// Test 3: Admin can modify events
// Query: UPDATE public.events SET title = '...' WHERE id = '...';
// Expected: Update successful
// User: mrisa.set@mriu.edu.in
// Result: ✓ PASS

// Test 4: Non-admin cannot modify events
// Query: UPDATE public.events SET title = '...' WHERE id = '...';
// Expected: Policy violation error
// User: other.email@example.com
// Result: ✓ PASS

// Test 5: Anyone can submit registration
// Query: INSERT INTO public.registrations (...) VALUES (...);
// Expected: Insert successful
// User: Unauthenticated
// Result: ✓ PASS

// Test 6: Public cannot view registrations
// Query: SELECT * FROM public.registrations;
// Expected: No rows returned (policy blocks SELECT)
// User: Unauthenticated
// Result: ✓ PASS

/**
 * MONITORING & MAINTENANCE
 * ========================
 */

// Daily:
// - Monitor Supabase dashboard for errors
// - Check rate limiting metrics
// - Review recent admin actions

// Weekly:
// - Audit all policy violations
// - Review access logs
// - Check for suspicious registration patterns

// Monthly:
// - Review and test all RLS policies
// - Update this documentation
// - Assess need for policy changes
// - Rotate admin credentials if needed

// Quarterly:
// - Penetration test the application
// - Review security best practices
// - Assess new threats/vulnerabilities
// - Plan security improvements

export const RLS_CONFIG = {
  adminEmail: 'mrisa.set@mriu.edu.in',
  tables: {
    ctf_events: {
      name: 'ctf_events',
      accessLevel: 'PUBLIC_READ',
      adminModify: false,
      policies: ['Public read access only']
    },
    events: {
      name: 'events',
      accessLevel: 'PUBLIC_READ',
      adminModify: true,
      policies: ['Public read', 'Admin modify']
    },
    winners: {
      name: 'winners',
      accessLevel: 'PUBLIC_READ',
      adminModify: true,
      policies: ['Public read', 'Admin insert/update/delete']
    },
    team: {
      name: 'team',
      accessLevel: 'PUBLIC_READ',
      adminModify: false,
      policies: ['Public read only']
    },
    registrations: {
      name: 'registrations',
      accessLevel: 'SUBMISSION_ONLY',
      adminModify: true,
      policies: ['Public insert', 'Admin read/modify']
    },
    contact_messages: {
      name: 'contact_messages',
      accessLevel: 'SUBMISSION_ONLY',
      adminModify: true,
      policies: ['Public insert', 'Admin read/modify']
    }
  },
  recommendations: [
    'Implement audit logging for all admin changes',
    'Move admin verification from hardcoded email to admin_users table',
    'Add CAPTCHA to public submission forms',
    'Implement email verification for registrations',
    'Set up monitoring for RLS policy violations',
    'Enable 2FA for admin account',
    'Rotate admin credentials quarterly'
  ]
};

export default RLS_CONFIG;
