import { Stack } from "expo-router"
import { FirebaseProvider } from "../context/FirebaseProvider"
import { CalendarProvider } from "../context/CalendarProvider"

const screenStyle = {
  headerShown: false,
  contentStyle: { backgroundColor: "#fdf6e6" },
}

export default function RootLayout() {
  return (
    <FirebaseProvider>
      <CalendarProvider>
        <Stack screenOptions={screenStyle}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="addEvent" options={{ headerShown: true, title: "Add Event" }} />
          <Stack.Screen name="link" options={{ headerShown: true, title: "Link Calendars" }} />
        </Stack>
      </CalendarProvider>
    </FirebaseProvider>
  )
}
