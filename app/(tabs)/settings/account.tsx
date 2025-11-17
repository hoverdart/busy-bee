import { ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useFirebase } from "../../../context/FirebaseProvider"

export default function AccountSettings() {
  const { user } = useFirebase()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fdfaf3" }}>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 80 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={{ padding: 20, borderRadius: 18, backgroundColor: "#fff" }}>
          <Text style={{ fontSize: 18, fontWeight: "700" }}>Signed in as</Text>
          <Text style={{ marginTop: 6, fontSize: 24, fontWeight: "700", color: "#4c3f1e" }}>
            {user?.displayName ?? user?.email ?? "BusyBee user"}
          </Text>
          {user?.email ? <Text style={{ marginTop: 4, color: "#777" }}>{user.email}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
