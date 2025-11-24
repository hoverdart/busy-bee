import { useEffect, useState } from "react"
import { ActivityIndicator, Text, View } from "react-native"
import tw from "twrnc"
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
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <View style={tw`flex-1 justify-center items-center p-6`}>
      <Text style={tw`text-[32px] font-bold mb-6`}>🐝 BusyBee</Text>
      <Text style={tw`mb-3 text-center`}>
        We buzz around in the busiest of beehives.
      </Text>
      <BusyBeeButton
        title={prompting || googleLoading ? "Signing in..." : "Log in / Sign up with Google"}
        onPress={handleSignIn}
      />
      {error ? <Text style={tw`text-red-600 mt-3`}>{error}</Text> : null}
    </View>
  )
}
