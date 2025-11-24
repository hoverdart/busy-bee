import { useCallback, useEffect, useMemo, useState } from "react"
import * as WebBrowser from "expo-web-browser"
import * as Google from "expo-auth-session/providers/google"
import { makeRedirectUri, ResponseType } from "expo-auth-session"
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "./firebase"
import { loadGoogleCalendarEvents, loadGoogleCalendars } from "./calendar"
import { generateUniqueJoinCode } from "./joinCode"
import { persistGoogleTokens } from "./googleTokens"
import { Platform } from "react-native"

WebBrowser.maybeCompleteAuthSession()

const scopes = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
]

const normalizeEvents = (items: any[] = [], calendarId: string) =>
  items.map((event) => ({
    id: event.id ?? Math.random().toString(36).slice(2),
    title: event.summary ?? "BusyBee Event",
    start: event.start?.dateTime ?? event.start?.date ?? "",
    end: event.end?.dateTime ?? event.end?.date ?? "",
    source: "google" as const,
    calendarId,
  }))

const getClientIds = () => ({
  clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "",
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "",
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
})

export const useGoogleAuth = () => {
  const clientIds = useMemo(getClientIds, [])
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const redirectUri = makeRedirectUri({
    native:
      Platform.OS === "ios" ? 
      "com.googleusercontent.apps.319228771674-2bkrrf785dsch58uhpt35rvh20g1rtrb:/oauthredirect" // iOS client ID
      :
      "com.googleusercontent.apps.319228771674-mmaklit01o41n04os9d5076i0bca6le5:/oauthredirect",
  })

  const [request, response, promptAsync] = Google.useAuthRequest({
    ...clientIds,
    scopes,
    responseType: ResponseType.Code,
    redirectUri,
    extraParams: {
      access_type: "offline",
      prompt: "consent",
    },
  })

  useEffect(() => {
    const persistUser = async () => {
      if (response?.type !== "success") return

      setProcessing(true)
      try {
        const params = (response.params ?? {}) as Record<string, string>
        const accessToken = response.authentication?.accessToken ?? params["access_token"]
        const idToken = response.authentication?.idToken ?? params["id_token"]
        const refreshToken = response.authentication?.refreshToken ?? params["refresh_token"]
        const expiresInRaw = response.authentication?.expiresIn ?? params["expires_in"]
        const expiresIn = expiresInRaw ? Number(expiresInRaw) : 3600
        const activeClientId = request?.clientId ?? clientIds.clientId

        if (!idToken || !accessToken) {
          throw new Error("Missing Google tokens.")
        }

        await persistGoogleTokens({
          accessToken,
          refreshToken,
          expiresIn,
          clientId: activeClientId,
        })

        const credential = GoogleAuthProvider.credential(idToken)
        const userCred = await signInWithCredential(auth, credential)

        const googleCalendars = await loadGoogleCalendars(accessToken)
        const calendarSources = googleCalendars.map((calendar) => ({
          id: calendar.id,
          name: calendar.summary ?? calendar.id,
          selected: calendar.primary ?? false,
          primary: calendar.primary ?? false,
        }))
        const selectedCalendars = calendarSources.filter((calendar) => calendar.selected)
        let calendarEvents: ReturnType<typeof normalizeEvents> = []
        for (const calendar of selectedCalendars) {
          const eventsFromGoogle = await loadGoogleCalendarEvents(accessToken, calendar.id)
          calendarEvents = [...calendarEvents, ...normalizeEvents(eventsFromGoogle, calendar.id)]
        }

        const userRef = doc(db, "users", userCred.user.uid)
        const snapshot = await getDoc(userRef)
        const existingJoinCode = snapshot.exists() ? (snapshot.data()?.joinCode as string | undefined) : undefined
        const joinCode = existingJoinCode ?? (await generateUniqueJoinCode())

        await setDoc(
          userRef,
          {
            email: userCred.user.email,
            displayName: userCred.user.displayName,
            calendarEvents,
            calendars: calendarSources,
            lastSyncedAt: new Date().toISOString(),
            joinCode,
            calendarOwner: userCred.user.uid,
          },
          { merge: true }
        )

        setError(null)
      } catch (err) {
        console.error("Google sign-in failed", err)
        setError("Google sign-in failed. Please try again.")
      } finally {
        setProcessing(false)
      }
    }

    persistUser()
  }, [clientIds, request, response])

  const signIn = useCallback(async () => {
    if (!request) {
      setError("Google auth is not ready yet. Please wait a second and try again.")
      return
    }

    setError(null)
    await promptAsync()
  }, [promptAsync, request])

  return {
    signIn,
    loading: processing,
    error,
  }
}
