# Bugfix Requirements Document

## Introduction

After completing the Discord OAuth login flow, users encounter an "ERR_CONNECTION_REFUSED" error when the browser attempts to redirect back to the application. This critical authentication bug prevents users from successfully logging in, blocking access to the entire application. The issue stems from an incomplete OAuth callback URL configuration that prevents Supabase from properly handling the OAuth token exchange after Discord authorization.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user successfully authenticates with Discord OAuth THEN the browser attempts to redirect to `window.location.origin` (e.g., `http://localhost:5173`) without the required Supabase callback hash fragment, resulting in connection refused error

1.2 WHEN the OAuth redirect occurs without proper callback handling THEN the Supabase Auth library cannot complete the token exchange, causing the authentication flow to fail

1.3 WHEN the redirect URL is missing the callback path or fragment THEN the application cannot process the OAuth response, leaving the user on an error page

### Expected Behavior (Correct)

2.1 WHEN a user successfully authenticates with Discord OAuth THEN the browser SHALL redirect to a complete callback URL that allows Supabase to process the OAuth response and establish a valid session

2.2 WHEN the OAuth redirect occurs with proper callback handling THEN the Supabase Auth library SHALL successfully complete the token exchange and create an authenticated session

2.3 WHEN the redirect URL includes the proper callback configuration THEN the application SHALL process the OAuth response, authenticate the user, and redirect them to the main application interface

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user who is already authenticated visits the application THEN the system SHALL CONTINUE TO recognize their existing session without requiring re-authentication

3.2 WHEN Discord OAuth authorization is initiated THEN the system SHALL CONTINUE TO open the Discord authorization dialog correctly

3.3 WHEN the biometric check toggle is not enabled THEN the system SHALL CONTINUE TO show an error message preventing login until verification is enabled

3.4 WHEN an unauthorized Discord user attempts to login THEN the system SHALL CONTINUE TO show the "ACCESS DENIED" modal and sign them out

3.5 WHEN a user successfully authenticates and is authorized THEN the system SHALL CONTINUE TO fetch their profile from the employees table, log the login audit action, apply department theming, and trigger auto-sync for admin users
