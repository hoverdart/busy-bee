import { ActivityIndicator, Text, View } from "react-native"
import { BusyBeeButton } from "../components/BusyBeeButton"
import { useRouter } from "expo-router"
import { useState } from "react"
import { useFirebase } from "../context/FirebaseProvider"
import { useGoogleAuth } from "../lib/google"
import { signOut } from "firebase/auth"
import { auth } from "../lib/firebase"

export default function Home() {
  const router = useRouter()
  const { user, loading } = useFirebase()
  const { signIn, loading: googleLoading, error } = useGoogleAuth()
  const [prompting, setPrompting] = useState(false)

  const handleSignIn = async () => {
    try {
      setPrompting(true)
      await signIn()
    } finally {
      setPrompting(false)
    }
  }

  const handleSignOut = async () => {
    await signOut(auth)
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    )
  }

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text style={{ fontSize: 32, fontWeight: "700", marginBottom: 24 }}>🐝 BusyBee</Text>
        <Text style={{ marginBottom: 12 }}>We buzz around in the busiest of beehives.</Text>
        <BusyBeeButton
          title={prompting || googleLoading ? "Signing in..." : "Log in/Sign up with Google"}
          onPress={handleSignIn}
        />
        {error ? <Text style={{ color: "red", marginTop: 12 }}>{error}</Text> : null}
      </View>
    )
  }

  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 32, fontWeight: "700" }}>🐝 BusyBee</Text>

      <Text style={{ marginVertical: 12 }}>Welcome, {user.displayName}!</Text>
      <BusyBeeButton title="View Schedule" onPress={() => router.push("/schedule")} />
      <BusyBeeButton title="Link Calendars" onPress={() => router.push("/link")} />
      <BusyBeeButton title="Add Event" onPress={() => router.push("/addEvent")} />
      <BusyBeeButton title="Sign Out" onPress={handleSignOut} />
    </View>
  )
}
