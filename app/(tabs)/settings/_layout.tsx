import { Stack } from "expo-router"

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: "#fdfaf3" },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="account" options={{ title: "Your Account" }} />
      <Stack.Screen name="about" options={{ title: "About BusyBee" }} />
    </Stack>
  )
}
