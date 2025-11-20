import { ScrollView, Text, TouchableOpacity, View, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
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

  const handleClick = () => {
    Alert.alert("Sign Out?", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: handleSignOut },
    ])
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fdf6e6" }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 72 }} contentInsetAdjustmentBehavior="automatic">
        <View
          style={{
            backgroundColor: "#fff",
            padding: 20,
            marginBottom: 16,
            borderRadius: 18,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 1,
          }}>
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#3e2e16" }}>
            Settings
          </Text>
          <Text style={{ marginTop: 4, color: "#666" }}>
            Fine-tune your BusyBee experience to keep your hive running smoothly.
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
            onPress={handleClick}
          />
        </View>

        <LinkCalendarsPanel heading="Link Calendars" />

      </ScrollView>
    </SafeAreaView>
  )
}
