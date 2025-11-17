import { Tabs, Redirect } from "expo-router"
import { ActivityIndicator, View } from "react-native"
import { useFirebase } from "../../context/FirebaseProvider"
import { Ionicons } from "@expo/vector-icons"

const tabIcon = (name: keyof typeof Ionicons.glyphMap) => ({
  color,
  focused,
}: {
  color: string
  focused: boolean
}) => <Ionicons name={name} size={focused ? 22 : 20} color={color} />

export default function TabsLayout() {
  const { user, loading } = useFirebase()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
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
        tabBarInactiveTintColor: "#8b887e",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#ede8dd",
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontWeight: "600", fontSize: 12 },
        sceneStyle: { backgroundColor: "#fdfaf3" },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: tabIcon("home"),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "My Calendar",
          tabBarIcon: tabIcon("calendar"),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: tabIcon("settings"),
        }}
      />
    </Tabs>
  )
}
