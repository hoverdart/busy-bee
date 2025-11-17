import { Text, View } from "react-native"
import type { CalendarEvent } from "../context/CalendarProvider"

type EventCardProps = {
  event: CalendarEvent
}

export const EventCard = ({ event }: EventCardProps) => (
  <View
    style={{
      padding: 16,
      backgroundColor: "#fff",
      borderRadius: 10,
      marginVertical: 10,
      borderWidth: 1,
      borderColor: "#eee",
    }}
  >
    <Text style={{ fontWeight: "700" }}>{event.title}</Text>
    <Text>{event.start} → {event.end}</Text>
  </View>
)
