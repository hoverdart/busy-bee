import { useCallback, useEffect, useMemo, useState } from "react"
import * as WebBrowser from "expo-web-browser"
import * as Google from "expo-auth-session/providers/google"
import { ResponseType } from "expo-auth-session"
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "./firebase"
import { loadGoogleCalendarEvents } from "./calendar"

WebBrowser.maybeCompleteAuthSession()

const scopes = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/calendar.readonly",
]

const normalizeEvents = (items: any[] = []) =>
  items.map((event) => ({
    id: event.id ?? Math.random().toString(36).slice(2),
    title: event.summary ?? "BusyBee Event",
    start: event.start?.dateTime ?? event.start?.date ?? "",
    end: event.end?.dateTime ?? event.end?.date ?? "",
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
  console.log("oiufdhsahfdsahfdsahk;fashdk");

  const [request, response, promptAsync] = Google.useAuthRequest({
    ...clientIds,
    scopes,
    responseType: ResponseType.Token,
    extraParams: {
      response_type: "token id_token",
      prompt: "consent",
      include_granted_scopes: "true",
    },
  })

  useEffect(() => {
    const persistUser = async () => {
      if (response?.type !== "success") return

      const accessToken = response.authentication?.accessToken ?? response.params?.access_token
      const idToken = response.authentication?.idToken ?? response.params?.id_token

      if (!accessToken || !idToken) {
        setError("Google response didn't include tokens. Please try again.")
        return
      }

      setProcessing(true)
      try {
        const credential = GoogleAuthProvider.credential(idToken)
        const userCred = await signInWithCredential(auth, credential)

        const eventsFromGoogle = await loadGoogleCalendarEvents(accessToken)
        const calendarEvents = normalizeEvents(eventsFromGoogle)

        await setDoc(
          doc(db, "users", userCred.user.uid),
          {
            email: userCred.user.email,
            displayName: userCred.user.displayName,
            photoURL: userCred.user.photoURL,
            calendarEvents,
            lastSyncedAt: new Date().toISOString(),
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
  }, [response])

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
