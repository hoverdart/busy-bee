import { Text, View } from "react-native"
import type { CalendarEvent } from "../context/CalendarProvider"

type EventCardProps = {
  event: CalendarEvent
}

const formatDate = (d: string | Date) => (d instanceof Date ? d.toLocaleString() : d);

const EventCard: React.FC<EventCardProps> = ({ event }) => (
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
    <Text>{formatDate(event.start)} → {formatDate(event.end)}</Text>
  </View>
)
export default EventCard
