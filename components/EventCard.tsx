import { Text, View } from "react-native"
import tw from "twrnc"
import type { CalendarEvent } from "../context/CalendarProvider"

type EventCardProps = {
  event: CalendarEvent
}

const formatDate = (d: string | Date) => (d instanceof Date ? d.toLocaleString() : d);

const EventCard: React.FC<EventCardProps> = ({ event }) => (
  <View
    style={tw`p-4 bg-white rounded-xl my-[10px] border border-[#eee]`}
  >
    <Text style={tw`font-bold`}>{event.title}</Text>
    <Text>{formatDate(event.start)} → {formatDate(event.end)}</Text>
  </View>
)
export default EventCard
