import { useEffect } from "react"
import { ActivityIndicator, View } from "react-native"
import { useRouter } from "expo-router"
import * as WebBrowser from "expo-web-browser"

WebBrowser.maybeCompleteAuthSession()

export default function OAuthRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Once auth session completes we just send the user back home
    router.replace("/")
  }, [router])

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator />
    </View>
  )
}
