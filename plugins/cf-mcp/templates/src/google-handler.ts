/**
 * Google OAuth handler for the {{SERVICE_NAME}} MCP server.
 * Adapted from cloudflare/ai/demos/remote-mcp-github-oauth/src/github-handler.ts
 *
 * Three routes:
 * - GET /authorize  — shows approval dialog, then redirects to Google
 * - POST /authorize — processes form approval, redirects to Google
 * - GET /callback   — exchanges code for token, fetches user info, completes auth
 */

import { env } from 'cloudflare:workers';
import type { AuthRequest, OAuthHelpers } from '@cloudflare/workers-oauth-provider';
import { Hono } from 'hono';
import { fetchGoogleToken, getGoogleAuthorizeUrl, type GoogleUserInfo, type Props } from './utils';
import {
  addApprovedClient,
  bindStateToSession,
  createOAuthState,
  generateCSRFProtection,
  isClientApproved,
  OAuthError,
  renderApprovalDialog,
  validateCSRFToken,
  validateOAuthState,
} from './workers-oauth-utils';

const app = new Hono<{ Bindings: Env & { OAUTH_PROVIDER: OAuthHelpers } }>();

app.get('/authorize', async (c) => {
  const oauthReqInfo = await c.env.OAUTH_PROVIDER.parseAuthRequest(c.req.raw);
  const { clientId } = oauthReqInfo;
  if (!clientId) {
    return c.text('Invalid request', 400);
  }

  // Skip approval dialog if client was already approved
  if (await isClientApproved(c.req.raw, clientId, env.COOKIE_ENCRYPTION_KEY)) {
    const { stateToken } = await createOAuthState(oauthReqInfo, c.env.OAUTH_KV);
    const { setCookie: sessionBindingCookie } = await bindStateToSession(stateToken);
    return redirectToGoogle(c.req.raw, stateToken, { 'Set-Cookie': sessionBindingCookie });
  }

  // Show approval dialog with CSRF protection
  const { token: csrfToken, setCookie } = generateCSRFProtection();

  return renderApprovalDialog(c.req.raw, {
    client: await c.env.OAUTH_PROVIDER.lookupClient(clientId),
    csrfToken,
    server: {
      name: '{{SERVICE_NAME_CLASS}} MCP Server',
      description: '{{DESCRIPTION}}',
    },
    setCookie,
    state: { oauthReqInfo },
  });
});

app.post('/authorize', async (c) => {
  try {
    const formData = await c.req.raw.formData();

    validateCSRFToken(formData, c.req.raw);

    const encodedState = formData.get('state');
    if (!encodedState || typeof encodedState !== 'string') {
      return c.text('Missing state in form data', 400);
    }

    let state: { oauthReqInfo?: AuthRequest };
    try {
      state = JSON.parse(atob(encodedState));
    } catch (_e) {
      return c.text('Invalid state data', 400);
    }

    if (!state.oauthReqInfo || !state.oauthReqInfo.clientId) {
      return c.text('Invalid request', 400);
    }

    // Remember this client as approved
    const approvedClientCookie = await addApprovedClient(
      c.req.raw,
      state.oauthReqInfo.clientId,
      c.env.COOKIE_ENCRYPTION_KEY,
    );

    // Create OAuth state and bind to session
    const { stateToken } = await createOAuthState(state.oauthReqInfo, c.env.OAUTH_KV);
    const { setCookie: sessionBindingCookie } = await bindStateToSession(stateToken);

    const headers = new Headers();
    headers.append('Set-Cookie', approvedClientCookie);
    headers.append('Set-Cookie', sessionBindingCookie);

    return redirectToGoogle(c.req.raw, stateToken, Object.fromEntries(headers));
  } catch (error: any) {
    console.error('POST /authorize error:', error);
    if (error instanceof OAuthError) {
      return error.toResponse();
    }
    return c.text(`Internal server error: ${error.message}`, 500);
  }
});

async function redirectToGoogle(
  request: Request,
  stateToken: string,
  headers: Record<string, string> = {},
) {
  return new Response(null, {
    status: 302,
    headers: {
      ...headers,
      location: getGoogleAuthorizeUrl({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: new URL('/callback', request.url).href,
        scope: 'openid email profile',
        state: stateToken,
      }),
    },
  });
}

/**
 * OAuth callback — exchanges code for token, fetches Google user info, completes authorization.
 */
app.get('/callback', async (c) => {
  let oauthReqInfo: AuthRequest;
  let clearSessionCookie: string;

  try {
    const result = await validateOAuthState(c.req.raw, c.env.OAUTH_KV);
    oauthReqInfo = result.oauthReqInfo;
    clearSessionCookie = result.clearCookie;
  } catch (error: any) {
    if (error instanceof OAuthError) {
      return error.toResponse();
    }
    return c.text('Internal server error', 500);
  }

  if (!oauthReqInfo.clientId) {
    return c.text('Invalid OAuth request data', 400);
  }

  // Exchange code for Google access token
  const [accessToken, errResponse] = await fetchGoogleToken({
    client_id: c.env.GOOGLE_CLIENT_ID,
    client_secret: c.env.GOOGLE_CLIENT_SECRET,
    code: c.req.query('code'),
    redirect_uri: new URL('/callback', c.req.url).href,
  });
  if (errResponse) return errResponse;

  // Fetch user info from Google
  const userResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userResp.ok) {
    return c.text('Failed to fetch user info from Google', 500);
  }
  const user = await userResp.json<GoogleUserInfo>();

  // Complete the OAuth flow — return token to MCP client
  const { redirectTo } = await c.env.OAUTH_PROVIDER.completeAuthorization({
    metadata: {
      label: user.name || user.email,
    },
    props: {
      email: user.email,
      name: user.name,
      picture: user.picture,
    } as Props,
    request: oauthReqInfo,
    scope: oauthReqInfo.scope,
    userId: user.email,
  });

  const headers = new Headers({ Location: redirectTo });
  if (clearSessionCookie) {
    headers.set('Set-Cookie', clearSessionCookie);
  }

  return new Response(null, {
    status: 302,
    headers,
  });
});

export { app as GoogleHandler };
