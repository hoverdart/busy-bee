import Constants from "expo-constants"
import { ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      marginVertical: 6,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderColor: "#f1e8d9",
    }}
  >
    <Text style={{ color: "#7a6a43" }}>{label}</Text>
    <Text style={{ fontWeight: "600" }}>{value}</Text>
  </View>
)

export default function AboutSettings() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fdf6e6" }}>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={{ padding: 20, borderRadius: 18, backgroundColor: "#fff" }}>
          <Text style={{ fontSize: 20, fontWeight: "700" }}>BusyBee</Text>
          <Text style={{ marginTop: 6, color: "#555" }}>
            Helping pairs stay perfectly in sync with their schedules.
          </Text>

          <View style={{ marginTop: 18 }}>
            <InfoRow label="Version" value={Constants.expoConfig?.version ?? "1.0.0"} />
            <InfoRow label="Build" value={Constants.expoConfig?.runtimeVersion ?? "—"} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
