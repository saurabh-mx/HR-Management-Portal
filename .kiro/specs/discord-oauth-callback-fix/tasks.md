# Implementation Plan

## Overview

This implementation plan addresses the Discord OAuth callback URL configuration bug by following a property-based testing approach. The plan consists of writing bug condition exploration tests first (which will fail on unfixed code), preservation tests to ensure existing behaviors remain unchanged, implementing the fix, and then verifying both test suites pass.

## Tasks

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - OAuth Redirect URL Lacks Callback Handling
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the OAuth redirect fails with incomplete URL
  - **Manual Testing Approach**: Since this involves browser OAuth flow, use manual testing with documented observations
  - Test that clicking "Login with Discord" on unfixed code redirects to incomplete URL (e.g., `http://localhost:5173` without `/auth/callback`)
  - Use browser DevTools Network tab to capture the redirect URL
  - Verify that after Discord authorization, browser redirects to incomplete URL
  - Verify that ERR_CONNECTION_REFUSED or blank page appears (no session created)
  - Check AuthContext state - confirm `session` remains `null` after redirect
  - Check Supabase Dashboard > Authentication > Logs for callback processing errors
  - Document counterexamples: specific redirect URLs, error messages, network traces
  - The test assertions should match: token exchange completes, session established, auth state change event fires (will fail on unfixed code)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS with observed counterexamples (redirect to `http://localhost:5173`, connection refused, no session)
  - Mark task complete when test is documented, observations recorded, and failure confirms bug exists
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Auth Behaviors Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-OAuth-redirect interactions
  - Test Case 1: Existing Session Recognition (Requirement 3.1)
    - Login manually (if possible via workaround), refresh page, verify session persists
  - Test Case 2: Discord Authorization Dialog Opens (Requirement 3.2)
    - Click "Login with Discord", verify Discord auth page loads (this should work on unfixed code)
  - Test Case 3: Biometric Check Validation (Requirement 3.3)
    - Attempt login without biometric toggle, verify error message appears (should work on unfixed code)
  - Test Case 4: Unauthorized User Handling (Requirement 3.4)
    - (If testable) Verify that unauthorized user handling logic exists in codebase (code inspection)
  - Test Case 5: Profile Fetching Flow (Requirement 3.5)
    - (If testable via existing session) Verify profile fetching, audit logging, theme application logic exists
  - Document observed behaviors that should be preserved after fix
  - Write test assertions capturing these preservation requirements
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS or observations confirm baseline behaviors exist
  - Mark task complete when tests are documented and preservation requirements are captured
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix for Discord OAuth callback URL configuration

  - [ ] 3.1 Add environment variable for redirect URL
    - Create or update `.env.local` file in project root
    - Add `VITE_SUPABASE_REDIRECT_URL=http://localhost:5173/auth/callback`
    - Document in project documentation that production environment needs this variable set
    - _Bug_Condition: OAuth redirect occurs with `redirectTo: window.location.origin` lacking callback path_
    - _Expected_Behavior: OAuth redirect uses proper callback URL with `/auth/callback` path enabling token exchange_
    - _Preservation: Does not affect existing session recognition, auth initiation, profile fetching, audit logging_
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.2 Update LoginModal.tsx redirectTo parameter
    - Open `src/auth/components/LoginModal.tsx`
    - Locate the `signInWithOAuth` call (around line 95)
    - Update the `redirectTo` option from `window.location.origin` to:
      ```typescript
      redirectTo: import.meta.env.VITE_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`
      ```
    - Ensure fallback logic provides default callback path if environment variable not set
    - _Bug_Condition: isBugCondition returns true when redirectTo == window.location.origin without callback path_
    - _Expected_Behavior: redirectTo includes /auth/callback path for Supabase to process OAuth response_
    - _Preservation: Only affects redirectTo parameter; all other auth logic unchanged_
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.3 Configure Supabase Dashboard redirect URLs
    - Open Supabase Dashboard for the project
    - Navigate to Authentication > URL Configuration > Redirect URLs
    - Add `http://localhost:5173/auth/callback` to allowed redirect URLs (development)
    - Document that production URL (e.g., `https://yourdomain.com/auth/callback`) must be added for production deployment
    - Verify that redirect URL pattern matches what the application will send
    - _Bug_Condition: Redirect URL not whitelisted in Supabase causes callback rejection_
    - _Expected_Behavior: Supabase Dashboard has matching redirect URLs configured to accept callback_
    - _Preservation: Dashboard configuration change; does not affect application code or existing flows_
    - _Requirements: 2.1, 2.2_

  - [ ] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - OAuth Callback Completes Successfully
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Click "Login with Discord" on FIXED code
    - Use browser DevTools Network tab to verify redirect URL now includes `/auth/callback`
    - Complete Discord authorization
    - Verify browser redirects to `http://localhost:5173/auth/callback`
    - Verify session is created and `SIGNED_IN` auth state change event fires
    - Verify AuthContext `session` is no longer `null`
    - Verify user profile is fetched and dashboard loads
    - Check Supabase Dashboard > Authentication > Logs for successful callback processing
    - **EXPECTED OUTCOME**: Test PASSES (redirect URL includes callback path, session created, OAuth flow completes)
    - Document successful outcomes: complete redirect URL, session state, profile data loaded
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Auth Behaviors Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run all preservation test cases from step 2
    - Test Case 1: Existing Session Recognition - After successful OAuth login, refresh page, verify session persists
    - Test Case 2: Discord Authorization Dialog - Click login button, verify Discord auth page still opens correctly
    - Test Case 3: Biometric Check Validation - Attempt login without toggle, verify error message still appears
    - Test Case 4: Unauthorized User Handling - Verify "ACCESS DENIED" modal logic still works (if testable)
    - Test Case 5: Profile Fetching Flow - Verify profile fetched, audit logged, theme applied, auto-sync triggered (for admins)
    - Test Case 6: Multiple Login/Logout Cycles - Perform login/logout/login cycle, verify no state corruption
    - **EXPECTED OUTCOME**: All preservation tests PASS (no regressions, existing behaviors unchanged)
    - Confirm all existing authentication behaviors work exactly as before the fix
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Verify that OAuth flow completes successfully with proper callback URL
  - Verify that all preservation tests pass (no regressions in existing auth behaviors)
  - Test in both local development and (if available) staging environment
  - Document any environment-specific configuration needed for production deployment
  - If any issues arise, document them and ask the user for guidance

## Notes

- **Testing Methodology**: This implementation follows an observation-first, property-based testing approach where bug condition tests are written before the fix and should fail on unfixed code
- **Manual Testing Required**: Since OAuth flows involve browser redirects and external authorization, manual testing with browser DevTools is necessary to capture network traces and verify redirect URLs
- **Environment Configuration**: Production deployment requires setting `VITE_SUPABASE_REDIRECT_URL` environment variable and configuring the production callback URL in Supabase Dashboard
- **Preservation Focus**: All existing authentication behaviors (session recognition, auth dialogs, biometric validation, profile fetching) must remain unchanged after the fix
