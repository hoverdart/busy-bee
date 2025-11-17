import AsyncStorage from "@react-native-async-storage/async-storage"

const TOKEN_STORAGE_KEY = "busybee:googleTokens"
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"

type StoredTokens = {
  accessToken: string
  refreshToken?: string | null
  expiresAt: number
  clientId?: string | null
}

type PersistTokenOptions = {
  accessToken: string
  refreshToken?: string | null
  expiresIn: number
  clientId?: string | null
}

export const persistGoogleTokens = async ({
  accessToken,
  refreshToken,
  expiresIn,
  clientId,
}: PersistTokenOptions) => {
  const existing = (await getStoredGoogleTokens()) ?? undefined
  const expiresAt = Date.now() + expiresIn * 1000
  const payload: StoredTokens = {
    accessToken,
    refreshToken: refreshToken ?? existing?.refreshToken ?? null,
    expiresAt,
    clientId: clientId ?? existing?.clientId ?? null,
  }
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(payload))
}

export const clearGoogleTokens = async () => {
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY)
}

export const getStoredGoogleTokens = async (): Promise<StoredTokens | null> => {
  const raw = await AsyncStorage.getItem(TOKEN_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredTokens
  } catch {
    return null
  }
}

export const refreshAccessToken = async () => {
  const tokens = await getStoredGoogleTokens()
  if (!tokens?.refreshToken || !tokens.clientId) return null
  try {
    const params = new URLSearchParams({
      client_id: tokens.clientId,
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken,
    })
    const res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    })
    if (!res.ok) {
      console.warn("Failed to refresh Google token", await res.text())
      return null
    }
    const json = await res.json()
    if (!json.access_token) return null
    await persistGoogleTokens({
      accessToken: json.access_token as string,
      refreshToken: tokens.refreshToken,
      expiresIn: Number(json.expires_in ?? 3600),
      clientId: tokens.clientId,
    })
    return json.access_token as string
  } catch (err) {
    console.warn("Failed to refresh Google token", err)
    return null
  }
}

export const getValidAccessToken = async () => {
  const tokens = await getStoredGoogleTokens()
  if (!tokens) return null
  if (Date.now() < tokens.expiresAt - 30 * 1000) {
    return tokens.accessToken
  }
  return refreshAccessToken()
}
