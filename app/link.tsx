import { ScrollView, Text } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinkCalendarsPanel } from "../components/LinkCalendarsPanel"

export default function LinkScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fdfaf3" }}>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 80 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={{ fontSize: 28, fontWeight: "700" }}>Link Calendars</Text>
        <Text style={{ marginTop: 8, color: "#555" }}>
          Share your schedule with the hive. Generate a join code or connect with an existing one.
        </Text>
        <LinkCalendarsPanel showHeading={false} />
      </ScrollView>
    </SafeAreaView>
  )
}
