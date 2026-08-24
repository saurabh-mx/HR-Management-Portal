# Discord OAuth Callback Fix Design

## Overview

The Discord OAuth login flow fails after successful Discord authorization due to an incomplete redirect URL configuration. The current implementation uses `window.location.origin` (e.g., `http://localhost:5173`) as the `redirectTo` parameter, which lacks the necessary Supabase callback handling path or hash fragment. This prevents Supabase Auth from completing the OAuth token exchange, resulting in ERR_CONNECTION_REFUSED errors and blocked user access.

The fix requires configuring the `redirectTo` URL to include the proper Supabase OAuth callback path (`/auth/callback` or hash fragment `#access_token=...`) so that the Supabase Auth client can intercept and process the OAuth response, establish a session, and allow the AuthProvider to fetch the user profile.

## Glossary

- **Bug_Condition (C)**: The condition where Discord OAuth redirect occurs with an incomplete callback URL lacking Supabase-required paths/fragments
- **Property (P)**: The desired behavior where OAuth redirects include proper callback handling, enabling successful token exchange and session creation
- **Preservation**: Existing authentication behaviors (session recognition, auth initiation, biometric check, unauthorized user handling, profile fetching) that must remain unchanged
- **signInWithOAuth**: The Supabase Auth method in `LoginModal.tsx` that initiates OAuth flow with Discord provider
- **redirectTo**: The OAuth parameter specifying where the browser redirects after Discord authorization completes
- **onAuthStateChange**: The Supabase Auth listener in `AuthProvider` that responds to session changes and triggers profile fetching
- **Token Exchange**: The OAuth process where Supabase exchanges the authorization code from Discord for access tokens
- **Callback URL**: The URL configured in Supabase Dashboard and passed to OAuth provider for post-authorization redirect

## Bug Details

### Bug Condition

The bug manifests when a user successfully authenticates with Discord and the OAuth flow attempts to redirect back to the application. The `signInWithOAuth` function in `LoginModal.tsx` specifies `redirectTo: window.location.origin`, which produces a URL like `http://localhost:5173` or `https://yourdomain.com`. This URL lacks the callback path or hash fragment that Supabase Auth expects to process the OAuth response (access tokens, refresh tokens, user metadata).

When Discord redirects to this incomplete URL, Supabase Auth cannot intercept the response. The browser attempts to navigate directly to the origin without any callback processing, which may result in:
- ERR_CONNECTION_REFUSED if the origin doesn't properly serve the route
- A blank page with no session established
- The onAuthStateChange listener never firing with SIGNED_IN event

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type OAuthRedirectConfig
  OUTPUT: boolean
  
  RETURN input.provider == 'discord'
         AND input.redirectTo == window.location.origin
         AND NOT hasSupabaseCallbackPath(input.redirectTo)
         AND NOT hasSupabaseCallbackFragment(input.redirectTo)
END FUNCTION

HELPER FUNCTION hasSupabaseCallbackPath(url)
  RETURN url includes '/auth/callback' OR url includes '#access_token='
END FUNCTION
```

### Examples

**Example 1: Local Development**
- **Current Behavior**: `redirectTo: 'http://localhost:5173'`
- **Expected**: `redirectTo: 'http://localhost:5173/auth/callback'` or relying on hash fragment handling
- **Result**: Connection refused or session not established

**Example 2: Production Deployment**
- **Current Behavior**: `redirectTo: 'https://hr-portal.example.com'`
- **Expected**: `redirectTo: 'https://hr-portal.example.com/auth/callback'`
- **Result**: Redirect fails to create authenticated session

**Example 3: Supabase Implicit Flow (Hash Fragment)**
- **Current Behavior**: `redirectTo: 'http://localhost:5173'` without hash handling
- **Expected**: Supabase client auto-handles hash fragment like `http://localhost:5173#access_token=...`
- **Result**: Hash fragment not processed, session not created

**Example 4: Environment-Based URL**
- **Expected Behavior**: Development and production environments use correct callback URLs based on environment variables
- **Result**: Consistent OAuth flow across all environments

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Existing authenticated sessions must continue to be recognized without requiring re-authentication (Requirement 3.1)
- Discord OAuth authorization dialog must continue to open correctly when login button is clicked (Requirement 3.2)
- Biometric check toggle validation must continue to show error message when not enabled (Requirement 3.3)
- Unauthorized Discord users must continue to see "ACCESS DENIED" modal and be signed out (Requirement 3.4)
- Post-authentication flow must continue to fetch profile from employees table, log audit action, apply department theming, and trigger auto-sync for admin users (Requirement 3.5)

**Scope:**
All authentication flows and behaviors that do NOT involve the OAuth redirect URL configuration should be completely unaffected by this fix. This includes:
- Session state management and persistence
- Auth state change listeners and handlers
- Profile fetching and employee validation logic
- Theme application based on department
- Audit logging for login events
- Auto-sync trigger for admin users
- Access denied modal display for unauthorized users

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely root cause is:

1. **Incomplete Redirect URL**: The `redirectTo` parameter uses `window.location.origin` which provides only the base URL (protocol + host + port) without any path. Supabase Auth requires either:
   - **Explicit callback path**: `/auth/callback` route that the Supabase client monitors
   - **Implicit hash fragment handling**: The client auto-processes hash fragments like `#access_token=...` when present in the URL
   
   The current configuration provides neither, causing Supabase to fail silent processing.

2. **Missing Callback Route**: The application may not have a dedicated `/auth/callback` route configured in the routing system, or if using hash-based implicit flow, the root route may not properly initialize Supabase Auth to process hash fragments.

3. **Environment-Specific URL Configuration**: The hardcoded `window.location.origin` doesn't account for different environments (local dev, staging, production) that may require different callback URLs. Using environment variables for callback URL configuration is best practice.

4. **Supabase Dashboard Redirect Configuration Mismatch**: The redirect URL configured in Supabase Dashboard (Project Settings > Authentication > URL Configuration) may not match what the application is sending, causing Supabase to reject or mishandle the callback.

## Correctness Properties

Property 1: Bug Condition - OAuth Callback Completes Successfully

_For any_ OAuth redirect where Discord authorization succeeds (user grants permission), the fixed `signInWithOAuth` configuration SHALL use a `redirectTo` URL that includes proper Supabase callback handling (explicit path or environment-based configuration), enabling the Supabase Auth client to complete token exchange, establish an authenticated session, and trigger the `SIGNED_IN` auth state change event.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Existing Auth Behaviors Unchanged

_For any_ authentication interaction that does NOT involve the OAuth redirect URL configuration (session recognition, auth initiation, profile fetching, audit logging, theme application, auto-sync, unauthorized user handling), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct, the fix involves updating the OAuth redirect URL configuration:

**File**: `src/auth/components/LoginModal.tsx`

**Function**: `onClick` handler for Discord login button (lines 94-98)

**Specific Changes**:

1. **Environment-Based Redirect URL Configuration**:
   - Add environment variable `VITE_SUPABASE_REDIRECT_URL` to `.env.local` and production environment
   - Default to `${window.location.origin}/auth/callback` if not specified
   - This ensures consistent callback handling across environments

2. **Update redirectTo Parameter**:
   ```typescript
   // BEFORE (line 95):
   options: { redirectTo: window.location.origin }
   
   // AFTER:
   options: { 
     redirectTo: import.meta.env.VITE_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`
   }
   ```

3. **Alternative Approach (If Using Implicit Flow)**:
   - If the application relies on Supabase's implicit flow (hash fragments), ensure `redirectTo` points to a route where Supabase client is initialized
   - Use `window.location.origin` but ensure the root component/route properly initializes Supabase Auth
   - This is less recommended as explicit callback paths are more reliable

4. **Supabase Dashboard Configuration**:
   - Add callback URLs to Supabase Dashboard > Authentication > URL Configuration > Redirect URLs:
     - `http://localhost:5173/auth/callback` (development)
     - `https://yourdomain.com/auth/callback` (production)
   - Ensure wildcard redirects are not used in production for security

5. **Optional: Create Callback Route**:
   - If the application doesn't have an `/auth/callback` route, it's not strictly necessary
   - Supabase Auth client intercepts the callback URL automatically via `onAuthStateChange`
   - However, having a dedicated callback route can improve user experience (show loading state)

### Environment Variable Configuration

**File**: `.env.local` (and production environment variables)

Add:
```env
VITE_SUPABASE_REDIRECT_URL=http://localhost:5173/auth/callback
```

Production:
```env
VITE_SUPABASE_REDIRECT_URL=https://your-production-domain.com/auth/callback
```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code (OAuth flow fails), then verify the fix enables successful authentication and preserves all existing auth behaviors.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that OAuth redirect with incomplete URL prevents session creation.

**Test Plan**: Manually test the Discord OAuth flow on UNFIXED code and observe the redirect behavior. Use browser DevTools Network tab to inspect the redirect URL and confirm it lacks callback handling. Attempt to complete login and verify that session is not created.

**Test Cases**:
1. **Local Development OAuth Flow**: Click "Login with Discord" on `http://localhost:5173`, authorize on Discord, observe redirect to `http://localhost:5173` (no callback path), verify connection refused or no session (will fail on unfixed code)
2. **Network Inspection**: Capture the OAuth redirect URL in Network tab, confirm it shows `http://localhost:5173` without `/auth/callback` or hash fragment (will fail on unfixed code)
3. **Session State After Redirect**: Check browser console and application state after failed redirect, verify `session` remains `null` in AuthContext (will fail on unfixed code)
4. **Supabase Auth Logs**: Check Supabase Dashboard > Authentication > Logs for failed callback processing (will show errors on unfixed code)

**Expected Counterexamples**:
- Browser redirects to incomplete URL (`http://localhost:5173`) without callback handling
- ERR_CONNECTION_REFUSED error or blank page displayed
- No `SIGNED_IN` auth state change event fired
- Session remains `null` in AuthContext
- Supabase logs show callback processing errors or no callback events

**Root Cause Confirmation**: If these counterexamples are observed, it confirms that the incomplete redirect URL is preventing Supabase Auth from processing the OAuth response. If NOT observed (OAuth succeeds), we need to re-hypothesize the root cause.

### Fix Checking

**Goal**: Verify that for all OAuth redirects with proper callback URL configuration, the fixed function completes token exchange and establishes authenticated session.

**Pseudocode:**
```
FOR ALL oauthRedirect WHERE isDiscordOAuth(oauthRedirect) DO
  result := signInWithOAuth_fixed(provider: 'discord', redirectTo: properCallbackURL)
  ASSERT tokenExchangeCompleted(result)
  ASSERT sessionEstablished(result)
  ASSERT authStateChangeEventFired(result, 'SIGNED_IN')
END FOR
```

**Test Plan**: After implementing the fix, test the complete OAuth flow from login button click through Discord authorization to successful session creation.

**Test Cases**:
1. **Complete OAuth Flow (Local)**: Click login, authorize on Discord, verify redirect to `http://localhost:5173/auth/callback`, confirm session created and user profile loaded
2. **Session Persistence**: After successful OAuth login, refresh the page and verify session persists (should remain logged in)
3. **Profile Fetching**: Verify that after successful OAuth, the `fetchProfile` function is called and employee data is loaded
4. **Audit Logging**: Confirm that `USER_LOGIN` audit action is logged after successful OAuth authentication
5. **Department Theme Application**: Verify that department-specific theme color is applied after profile is fetched
6. **Admin Auto-Sync Trigger**: For admin users, verify that auto-sync background process is triggered after login

### Preservation Checking

**Goal**: Verify that for all authentication interactions NOT involving OAuth redirect URL configuration, the fixed code produces the same behavior as the original code.

**Pseudocode:**
```
FOR ALL authInteraction WHERE NOT isOAuthRedirectConfig(authInteraction) DO
  ASSERT originalAuthBehavior(authInteraction) = fixedAuthBehavior(authInteraction)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It validates that the fix is surgical and only affects OAuth redirect configuration
- It ensures no unintended side effects in session management, profile fetching, or auth state handling
- It provides confidence that existing user flows remain unaffected

**Test Plan**: Test all existing auth behaviors on FIXED code and compare with expected behavior documented in requirements.

**Test Cases**:

1. **Existing Session Recognition (Requirement 3.1)**:
   - Scenario: User with existing valid session visits the application
   - Expected: User should remain authenticated without re-login
   - Verification: Refresh page after login, verify session persists and profile loads without showing login modal

2. **Discord Authorization Dialog (Requirement 3.2)**:
   - Scenario: User clicks "Login with Discord" button
   - Expected: Discord OAuth authorization dialog opens correctly
   - Verification: Click login button, verify Discord authorization page loads with correct scopes

3. **Biometric Check Validation (Requirement 3.3)**:
   - Scenario: User clicks login without enabling biometric check toggle
   - Expected: Error message "Biometric verification required before proceeding." is displayed
   - Verification: Attempt login with toggle disabled, verify error appears and OAuth flow does not initiate

4. **Unauthorized User Handling (Requirement 3.4)**:
   - Scenario: Discord user not in employees table attempts to login
   - Expected: "ACCESS DENIED" modal shown, user signed out
   - Verification: Login with Discord account not in roster, verify modal appears with correct message and session is cleared

5. **Profile Fetching and Post-Login Actions (Requirement 3.5)**:
   - Scenario: Authorized user successfully logs in
   - Expected: Profile fetched, audit logged, theme applied, auto-sync triggered (for admins)
   - Verification: Login as authorized user, verify:
     - Employee data loaded into `profile` state
     - `USER_LOGIN` audit action logged
     - Department theme color applied to UI
     - (For admin users) Auto-sync background process initiated

6. **Multiple Login/Logout Cycles**:
   - Scenario: User logs in, logs out, logs in again
   - Expected: Each cycle should work correctly with proper session management
   - Verification: Perform multiple login/logout cycles, verify no state corruption or stale data

7. **Network Interruption Handling**:
   - Scenario: Network interruption occurs during profile fetching
   - Expected: Application handles gracefully without breaking auth state
   - Verification: Simulate network failure during `fetchProfile`, verify error handling works correctly

### Unit Tests

- Test `signInWithOAuth` with updated `redirectTo` configuration to ensure proper URL format
- Test environment variable fallback logic (VITE_SUPABASE_REDIRECT_URL or default callback path)
- Test that callback URL includes correct protocol, host, port, and path
- Test edge case where environment variable is empty string (should use fallback)

### Property-Based Tests

- Generate random environment configurations (different origins, ports, protocols) and verify callback URL is correctly constructed
- Generate random session states and verify that existing session recognition works across all states
- Test OAuth flow with various Discord user metadata formats and verify profile fetching handles all cases

### Integration Tests

- Test complete OAuth flow from login button click through Discord authorization to successful dashboard access
- Test OAuth flow in different browser contexts (new tab, incognito, different browsers)
- Test that unauthorized users cannot bypass access controls through direct OAuth attempts
- Test that multiple concurrent OAuth attempts are handled correctly without race conditions
- Verify Supabase Dashboard shows successful authentication events after OAuth completes
