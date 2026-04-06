import { DROPBOX_APP_KEY, REDIRECT_URI, DROPBOX_FILE_PATH } from '../config'

const TOKEN_URL = 'https://api.dropboxapi.com/oauth2/token'

// ── PKCE helpers ─────────────────────────────────────────────────────────────

function b64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function generateVerifier() {
  return b64url(crypto.getRandomValues(new Uint8Array(32)))
}

async function generateChallenge(verifier) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return b64url(hash)
}

// ── OAuth flow ────────────────────────────────────────────────────────────────

export async function startOAuthFlow() {
  const verifier = generateVerifier()
  const challenge = await generateChallenge(verifier)
  sessionStorage.setItem('pkce_verifier', verifier)

  const params = new URLSearchParams({
    client_id: DROPBOX_APP_KEY,
    response_type: 'code',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    redirect_uri: REDIRECT_URI,
    token_access_type: 'offline',
  })

  window.location.href = `https://www.dropbox.com/oauth2/authorize?${params}`
}

export async function handleOAuthCallback(code) {
  const verifier = sessionStorage.getItem('pkce_verifier')
  if (!verifier) throw new Error('No PKCE verifier found')

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: DROPBOX_APP_KEY,
      code_verifier: verifier,
      redirect_uri: REDIRECT_URI,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token exchange failed: ${text}`)
  }

  const data = await res.json()
  storeTokens(data)
  sessionStorage.removeItem('pkce_verifier')
}

// ── Token management ──────────────────────────────────────────────────────────

function storeTokens(data) {
  localStorage.setItem('dbx_access_token', data.access_token)
  if (data.refresh_token) localStorage.setItem('dbx_refresh_token', data.refresh_token)
  localStorage.setItem('dbx_token_expiry', String(Date.now() + data.expires_in * 1000))
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem('dbx_refresh_token')
  if (!refresh) throw new Error('No refresh token — please reconnect Dropbox')

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh,
      client_id: DROPBOX_APP_KEY,
    }),
  })

  if (!res.ok) throw new Error('Token refresh failed')
  const data = await res.json()
  storeTokens(data)
  return data.access_token
}

async function getToken() {
  const expiry = Number(localStorage.getItem('dbx_token_expiry') || 0)
  if (Date.now() > expiry - 60_000) return refreshAccessToken()
  return localStorage.getItem('dbx_access_token')
}

export function isConnected() {
  return !!localStorage.getItem('dbx_refresh_token')
}

export function disconnect() {
  ;['dbx_access_token', 'dbx_refresh_token', 'dbx_token_expiry'].forEach(k =>
    localStorage.removeItem(k)
  )
}

// ── File operations ───────────────────────────────────────────────────────────

export async function downloadLogbook() {
  const token = await getToken()

  const res = await fetch('https://content.dropboxapi.com/2/files/download', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Dropbox-API-Arg': JSON.stringify({ path: DROPBOX_FILE_PATH }),
    },
  })

  if (res.status === 409) return null  // file doesn't exist yet
  if (!res.ok) throw new Error(`Download failed: ${res.status}`)
  return res.json()
}

export async function uploadLogbook(data) {
  const token = await getToken()

  const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({
        path: DROPBOX_FILE_PATH,
        mode: 'overwrite',
        autorename: false,
        mute: true,
      }),
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  return res.json()
}
