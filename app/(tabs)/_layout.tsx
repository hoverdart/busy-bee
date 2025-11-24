import { Redirect, Tabs } from "expo-router"
import { ActivityIndicator, View } from "react-native"
import tw from "twrnc"
import { Ionicons } from "@expo/vector-icons"
import { useFirebase } from "../../context/FirebaseProvider"

const tabIcon =
  (name: keyof typeof Ionicons.glyphMap) =>
  ({ color, focused }: { color: string; focused: boolean }) =>
    <Ionicons name={name} size={focused ? 24 : 20} color={color} />

export default function TabsLayout() {
  const { user, loading } = useFirebase()

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-[#fdf6e6]`}>
        <ActivityIndicator color="#f5a524" />
      </View>
    )
  }

  if (!user) {
    return <Redirect href="/" />
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#f5a524",
        tabBarInactiveTintColor: "#c5baa2",
        tabBarStyle: tw`bg-white border-t border-[#f3e3c7] h-[64px] pb-2 pt-1`,
        tabBarLabelStyle: tw`font-semibold text-[12px]`,
        sceneStyle: tw`bg-[#fdf6e6]`,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: tabIcon("home") }}  />
      <Tabs.Screen name="calendar" options={{ title: "My Calendar", tabBarIcon: tabIcon("calendar") }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: tabIcon("settings") }} />
    </Tabs>
  )
}
