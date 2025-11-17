import { useMemo, useState } from "react"
import { Alert, Text, TouchableOpacity, View, FlatList } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useCalendar, type CalendarEvent } from "../../context/CalendarProvider"
import { BusyBeeButton } from "../../components/BusyBeeButton"
import { useRouter } from "expo-router"

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const dateKey = (value: Date | string) => {
  const d = value instanceof Date ? value : new Date(value)
  const year = d.getFullYear()
  const month = `${d.getMonth() + 1}`.padStart(2, "0")
  const day = `${d.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

const buildMonthMatrix = (anchor: Date) => {
  const firstDay = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const startDay = new Date(firstDay)
  startDay.setDate(firstDay.getDate() - firstDay.getDay())
  const days: Date[] = []
  for (let i = 0; i < 42; i += 1) {
    days.push(new Date(startDay))
    startDay.setDate(startDay.getDate() + 1)
  }
  return days
}

const EventRow = ({
  event,
  onLongPress,
}: {
  event: CalendarEvent
  onLongPress: (event: CalendarEvent) => void
}) => {
  const start = event.start instanceof Date ? event.start : new Date(event.start)
  const end = event.end instanceof Date ? event.end : new Date(event.end)
  return (
    <TouchableOpacity
      onLongPress={() => onLongPress(event)}
      style={{
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#eee",
        marginBottom: 12,
        backgroundColor: "#fff",
      }}
    >
      <Text style={{ fontWeight: "600" }}>{event.title}</Text>
      <Text style={{ color: "#555", marginTop: 4 }}>
        {start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} -{" "}
        {end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
      </Text>
    </TouchableOpacity>
  )
}

export default function CalendarTab() {
  const router = useRouter()
  const { events, removeEvent } = useCalendar()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDateKey, setSelectedDateKey] = useState(dateKey(new Date()))

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    events.forEach((event) => {
      const key = dateKey(event.start)
      if (!map[key]) map[key] = []
      map[key].push(event)
    })
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    })
    return map
  }, [events])

  const selectedEvents = eventsByDay[selectedDateKey] ?? []

  const monthDays = useMemo(() => buildMonthMatrix(currentMonth), [currentMonth])

  const handleRemove = (event: CalendarEvent) => {
    Alert.alert("Remove event", `Remove "${event.title}" from your calendar?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await removeEvent(event)
        },
      },
    ])
  }

  const changeMonth = (direction: number) => {
    const next = new Date(currentMonth)
    next.setMonth(currentMonth.getMonth() + direction)
    setCurrentMonth(next)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fdfaf3" }}>
      <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: "700" }}>My Calendar</Text>
      <Text style={{ marginTop: 4, color: "#666" }}>Tap a date to view events. Long-press an event to remove it.</Text>

      <View
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 16,
          backgroundColor: "#fff",
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 1,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <Text style={{ fontSize: 18 }}>◀</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "600" }}>
            {currentMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)}>
            <Text style={{ fontSize: 18 }}>▶</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
          {daysOfWeek.map((day) => (
            <Text key={day} style={{ width: "14%", textAlign: "center", fontWeight: "600", color: "#888" }}>
              {day}
            </Text>
          ))}
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
          {monthDays.map((day) => {
            const key = dateKey(day)
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
            const isSelected = selectedDateKey === key
            const hasEvents = !!eventsByDay[key]?.length
            return (
              <TouchableOpacity
                key={key + day.getTime()}
                onPress={() => {
                  setSelectedDateKey(key)
                }}
                style={{
                  width: "14.28%",
                  aspectRatio: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  marginVertical: 4,
                  backgroundColor: isSelected ? "#f5a524" : "transparent",
                }}
              >
                <Text style={{ color: isCurrentMonth ? (isSelected ? "#fff" : "#222") : "#bbb", fontWeight: "600" }}>
                  {day.getDate()}
                </Text>
                {hasEvents ? (
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: isSelected ? "#fff" : "#f5a524",
                      marginTop: 4,
                    }}
                  />
                ) : null}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      <View style={{ flex: 1, marginTop: 24}}>
        <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 12 }}>
          {new Date(selectedDateKey).toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>
        {selectedEvents.length ? (
          <FlatList
            data={selectedEvents}
            keyExtractor={(item, index) =>
              `${item.id}-${new Date(item.start).getTime()}-${index}`
            }
            renderItem={({ item }) => <EventRow event={item} onLongPress={handleRemove} />}
            style={{ flex: 1}}
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        ) : (
          <Text style={{ color: "#777" }}>No events for this day.</Text>
        )}
      </View>

    </View>
    

  </SafeAreaView>
  )
}
