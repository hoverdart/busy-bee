import { useEffect, useState } from "react"
import { ActivityIndicator, Text, View } from "react-native"
import { BusyBeeButton } from "../components/BusyBeeButton"
import { useRouter } from "expo-router"
import { useFirebase } from "../context/FirebaseProvider"
import { useGoogleAuth } from "../lib/google"

export default function AuthGate() {
  const router = useRouter()
  const { user, loading } = useFirebase()
  const { signIn, loading: googleLoading, error } = useGoogleAuth()
  const [prompting, setPrompting] = useState(false)

  useEffect(() => {
    if (user) {
      router.replace("/(tabs)/home")
    }
  }, [router, user])

  const handleSignIn = async () => {
    try {
      setPrompting(true)
      await signIn()
    } finally {
      setPrompting(false)
    }
  }

  if (loading || user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
      <Text style={{ fontSize: 32, fontWeight: "700", marginBottom: 24 }}>🐝 BusyBee</Text>
      <Text style={{ marginBottom: 12, textAlign: "center" }}>
        Stay aligned with your hive and never double-book again.
      </Text>
      <BusyBeeButton
        title={prompting || googleLoading ? "Signing in..." : "Log in / Sign up with Google"}
        onPress={handleSignIn}
      />
      {error ? <Text style={{ color: "red", marginTop: 12 }}>{error}</Text> : null}
    </View>
  )
}
