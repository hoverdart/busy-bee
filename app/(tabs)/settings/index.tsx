import { ScrollView, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { BusyBeeButton } from "../../../components/BusyBeeButton"
import { signOut } from "firebase/auth"
import { auth } from "../../../lib/firebase"
import { clearGoogleTokens } from "../../../lib/googleTokens"
import { LinkCalendarsPanel } from "../../../components/LinkCalendarsPanel"

const SettingRow = ({
  title,
  subtitle,
  icon,
  onPress,
  color = "#111",
}: {
  title: string
  subtitle?: string
  icon: React.ComponentProps<typeof Ionicons>["name"]
  onPress: () => void
  color?: string
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderColor: "#f0e7d8",
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff5dd",
        }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color }}>{title}</Text>
        {subtitle ? <Text style={{ fontSize: 13, color: "#777" }}>{subtitle}</Text> : null}
      </View>
    </View>
    <Ionicons name="chevron-forward-outline" size={18} color="#bbb" />
  </TouchableOpacity>
)

export default function SettingsHome() {
  const router = useRouter()

  const handleSignOut = async () => {
    await Promise.all([signOut(auth), clearGoogleTokens()])
    router.replace("/")
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fdfaf3" }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={{ padding: 20, borderRadius: 18, backgroundColor: "#fff7ea", marginBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: "700" }}>Settings</Text>
          <Text style={{ marginTop: 6, color: "#7a6a43" }}>
            Fine-tune BusyBee so your hive runs smoothly.
          </Text>
        </View>

        <View
          style={{
            borderRadius: 18,
            backgroundColor: "#fff",
            paddingHorizontal: 20,
            paddingBottom: 4,
            shadowColor: "#000",
            shadowOpacity: 0.04,
            shadowRadius: 12,
            elevation: 1,
          }}
        >
          <SettingRow
            title="Account"
            subtitle="Manage your profile details"
            icon="person-circle-outline"
            onPress={() => router.push("/(tabs)/settings/account")}
          />
          <SettingRow
            title="About BusyBee"
            subtitle="Version info & mission"
            icon="information-circle-outline"
            onPress={() => router.push("/(tabs)/settings/about")}
          />
          <SettingRow
            title="Sign Out"
            subtitle="Log out of this device"
            icon="exit-outline"
            color="#c23b3b"
            onPress={handleSignOut}
          />
        </View>

        <LinkCalendarsPanel heading="Link Calendars" />

      </ScrollView>
    </SafeAreaView>
  )
}
