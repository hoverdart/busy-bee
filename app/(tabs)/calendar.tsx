import { useMemo, useState } from "react"
import { Alert, Text, TouchableOpacity, View, ScrollView } from "react-native"
import tw from "twrnc"
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

const parseDateKey = (key: string) => {
  const [year, month, day] = key.split("-").map((part) => Number.parseInt(part, 10))
  return new Date(year, (month ?? 1) - 1, day ?? 1)
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

const EventRow = ({ event, onLongPress }: { event: CalendarEvent; onLongPress: (event: CalendarEvent) => void }) => {
  const start = event.start instanceof Date ? event.start : new Date(event.start)
  const end = event.end instanceof Date ? event.end : new Date(event.end)
  return (
    <TouchableOpacity
      onLongPress={() => onLongPress(event)}
      style={tw`p-3 rounded-xl border border-[#eee] mb-3 bg-white`}
    >
      <Text style={tw`font-semibold`}>{event.title}</Text>
      <Text style={tw`text-[#555] mt-1`}>
        {start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} -{" "}
        {end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
      </Text>
    </TouchableOpacity>
  )
}

export default function CalendarTab() {
  const router = useRouter()
  const { events, removeEvent, calendars, toggleCalendar } = useCalendar()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDateKey, setSelectedDateKey] = useState(dateKey(new Date()))
  const [filtersExpanded, setFiltersExpanded] = useState(false)

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

  const renderDayCard = () => (
    <View style={tw`pt-4 justify-center items-center`}>
      <Text style={tw`text-xl font-bold mb-3`}>
        {parseDateKey(selectedDateKey).toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </Text>
    </View>
  )

  const renderCalendarFilters = () =>
    calendars.length ? (
      <View style={tw`mb-4`}>
        <TouchableOpacity
          onPress={() => setFiltersExpanded((prev) => !prev)}
          style={tw`flex-row justify-between items-center py-[10px]`}
        >
          <Text style={tw`text-lg font-bold text-[#3e2e16]`}>Select calendars</Text>
          <Text style={tw`text-lg`}>{filtersExpanded ? "▲" : "▼"}</Text>
        </TouchableOpacity>
        {filtersExpanded ? (
          <View
            style={tw`flex-row flex-wrap pt-2 mt-4 border-t border-[#f0e1c7]`}
          >
            {calendars.map((calendar) => (
              <TouchableOpacity
                key={calendar.id}
                onPress={() => toggleCalendar(calendar.id)}
                style={[
                  tw`px-3 py-2 rounded-full border mr-2 mb-2`,
                  calendar.selected ? tw`bg-[#f5a524] border-[#f5a524]` : tw`bg-white border-[#e7dcc7]`,
                ]}
              >
                <Text style={[tw`font-semibold`, calendar.selected ? tw`text-white` : tw`text-[#7a6a43]`]}>
                  {calendar.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>
    ) : null

  return (
    <SafeAreaView style={tw`flex-1 bg-[#fdf6e6]`}>
      <ScrollView contentContainerStyle={tw`pb-18 px-6`}>
        <View style={tw`flex-1 pt-6`}>
          <View style={tw`bg-white p-6 rounded-2xl shadow-sm elevation-1`}>
            <Text style={tw`text-[28px] font-bold text-[#3e2e16]`}>My Calendar</Text>
            <Text style={tw`mt-1 text-[#7c6b52]`}>
              Tap a date to view events. Long-press an event to remove it.
            </Text>
          </View>

          <View style={tw`mt-4 p-4 rounded-2xl bg-white shadow-sm elevation-1`}>
            <View style={tw`flex-row justify-between items-center`}>
              <TouchableOpacity onPress={() => changeMonth(-1)}>
                <Text style={tw`text-lg`}>◀</Text>
              </TouchableOpacity>
              <Text style={tw`text-lg font-semibold`}>
                {currentMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <Text style={tw`text-lg`}>▶</Text>
              </TouchableOpacity>
            </View>

            <View style={tw`flex-row justify-between mt-3`}>
              {daysOfWeek.map((day) => (
                <Text key={day} style={tw`w-[14%] text-center font-semibold text-[#888]`}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={tw`flex-row flex-wrap mt-2`}>
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
                    style={[
                      tw`w-[14.28%] aspect-square items-center justify-center rounded-lg my-1`,
                      isSelected ? tw`bg-[#f5a524]` : tw`bg-transparent`,
                    ]}
                  >
                    <Text
                      style={[
                        tw`font-semibold`,
                        { color: isCurrentMonth ? (isSelected ? "#fff" : "#222") : "#bbb" },
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                    {hasEvents ? (
                      <View
                        style={[
                          tw`mt-1 w-[6px] h-[6px] rounded-[3px]`,
                          isSelected ? tw`bg-white` : tw`bg-[#f5a524]`,
                        ]}
                      />
                    ) : null}
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </View>

        {renderDayCard()}

        <View style={tw`mt-4`}>
          {selectedEvents.length ? (
            selectedEvents.map((item, index) => (
              <EventRow key={`${item.id}-${index}`} event={item} onLongPress={handleRemove} />
            ))
          ) : (
            <Text style={tw`text-[#777]`}>No events for this day.</Text>
          )}
        </View>

        {renderCalendarFilters()}

        <View style={tw`pt-4 pb-6`}>
          <BusyBeeButton title="Add Event" onPress={() => router.push("/addEvent")} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
      
