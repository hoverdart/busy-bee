import { ScrollView, Text } from "react-native"
import { EventCard } from "../components/EventCard"
import { useCalendar, type CalendarEvent } from "../context/CalendarProvider"

export default function Schedule() {
  const { events, loading } = useCalendar()

  if (loading) return <Text>Loading…</Text>

  return (
    <ScrollView style={{ padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Your Events</Text>
      {events.map((e: CalendarEvent) => (
        <EventCard key={e.id} event={e} />
      ))}
    </ScrollView>
  )
}
