import { ScrollView, Text, TouchableOpacity, View, Alert } from "react-native"
import tw from "twrnc"
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
    style={tw`flex-row items-center justify-between py-4 border-b border-[#f0e7d8]`}
  >
    <View style={tw`flex-row items-center gap-3 flex-1`}>
      <View style={tw`w-10 h-10 rounded-xl items-center justify-center bg-[#fff5dd]`}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={tw`flex-1`}>
        <Text style={[tw`text-base font-semibold`, { color }]}>{title}</Text>
        {subtitle ? <Text style={tw`text-[13px] text-[#777]`}>{subtitle}</Text> : null}
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
    <SafeAreaView style={tw`flex-1 bg-[#fdf6e6]`}>
      <ScrollView contentContainerStyle={tw`p-6 pb-18`} contentInsetAdjustmentBehavior="automatic">
        <View style={tw`bg-white p-5 mb-4 rounded-[18px] shadow-sm elevation-1`}>
          <Text style={tw`text-[28px] font-bold text-[#3e2e16]`}>Settings</Text>
          <Text style={tw`mt-1 text-[#666]`}>
            Fine-tune your BusyBee experience to keep your hive running smoothly.
          </Text>
        </View>

        <View style={tw`rounded-[18px] bg-white px-5 pb-1 shadow-sm elevation-1`}>
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
