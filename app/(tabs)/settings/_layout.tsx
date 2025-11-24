import { Stack } from "expo-router"
import tw from "twrnc"

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTitleStyle: tw`font-bold`,
        contentStyle: tw`bg-[#fdfaf3]`,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="account" options={{ title: "Your Account" }} />
      <Stack.Screen name="about" options={{ title: "About BusyBee" }} />
    </Stack>
  )
}
