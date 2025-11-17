import { Stack } from "expo-router"
import { FirebaseProvider } from "../context/FirebaseProvider"
import { CalendarProvider } from "../context/CalendarProvider"

export default function RootLayout() {
  return (
    <FirebaseProvider>
      <CalendarProvider>
        <Stack />
      </CalendarProvider>
    </FirebaseProvider>
  )
}
