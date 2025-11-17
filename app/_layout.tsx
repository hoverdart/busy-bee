import { Stack } from "expo-router"
import { FirebaseProvider } from "../context/FirebaseProvider"
import { CalendarProvider } from "../context/CalendarProvider"

export default function RootLayout() {
  return (
    <FirebaseProvider>
      <CalendarProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="addEvent" options={{ headerShown: true, title: "Add Event" }} />
          <Stack.Screen name="link" options={{ headerShown: true, title: "Link Calendars" }} />
        </Stack>
      </CalendarProvider>
    </FirebaseProvider>
  )
}
