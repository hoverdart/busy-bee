import { useMemo, useState } from "react"
import { View, TextInput, Text, TouchableOpacity, Platform, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker"
import { BusyBeeButton } from "../components/BusyBeeButton"
import { useCalendar } from "../context/CalendarProvider"

const isIOS = Platform.OS === "ios"
const isWeb = Platform.OS === "web"

export default function AddEvent() {
  const { addEvent } = useCalendar()
  const [title, setTitle] = useState("")
  const [start, setStart] = useState(new Date())
  const [end, setEnd] = useState(new Date())
  const [showStartPicker, setShowStartPicker] = useState(isIOS)
  const [showEndPicker, setShowEndPicker] = useState(isIOS)

  const submit = async () => {
    await addEvent({
      title,
      start,
      end,
    })
  }

  const formatDateTime = (date: Date) =>
    date.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })

  const formatWebValue = useMemo(() => {
    const pad = (value: number) => value.toString().padStart(2, "0")
    return (date: Date) =>
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
        date.getHours()
      )}:${pad(date.getMinutes())}`
  }, [])

  const handleStartChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowStartPicker(false)
    if (event.type === "dismissed") return

    const currentDate = selectedDate || start
    setStart(currentDate)
    if (currentDate > end) setEnd(currentDate)
  }

  const handleEndChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowEndPicker(false)
    if (event.type === "dismissed") return

    const currentDate = selectedDate || end
    setEnd(currentDate < start ? start : currentDate)
  }

  const updateFromWeb = (value: string, type: "start" | "end") => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return

    if (type === "start") {
      setStart(parsed)
      if (parsed > end) setEnd(parsed)
    } else {
      setEnd(parsed < start ? start : parsed)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fdf6e6" }}>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
      <Text style={{ fontSize: 24, fontWeight: "600" }}>Create Event</Text>

      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Event title"
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 12,
          borderRadius: 8,
          marginVertical: 12,
        }}
      />

      <Text style={{ marginTop: 12, fontWeight: "600" }}>Start</Text>
      {isWeb ? (
        <TextInput
          value={formatWebValue(start)}
          onChangeText={(value) => updateFromWeb(value, "start")}
          placeholder="YYYY-MM-DDTHH:MM"
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 12,
            borderRadius: 8,
            marginTop: 8,
          }}
        />
      ) : (
        <>
          {!isIOS && (
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                padding: 12,
                borderRadius: 8,
                marginTop: 8,
              }}
              onPress={() => setShowStartPicker(true)}
            >
              <Text>{formatDateTime(start)}</Text>
            </TouchableOpacity>
          )}
          {showStartPicker ? (
            <DateTimePicker
              value={start}
              mode="date"
              display={isIOS ? "inline" : "default"}
              is24Hour
              onChange={handleStartChange}
            />
          ) : null}
        </>
      )}

      <Text style={{ marginTop: 12, fontWeight: "600" }}>End</Text>
      {isWeb ? (
        <TextInput
          value={formatWebValue(end)}
          onChangeText={(value) => updateFromWeb(value, "end")}
          placeholder="YYYY-MM-DDTHH:MM"
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 12,
            borderRadius: 8,
            marginTop: 8,
          }}
        />
      ) : (
        <>
          {!isIOS && (
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                padding: 12,
                borderRadius: 8,
                marginTop: 8,
              }}
              onPress={() => setShowEndPicker(true)}
            >
              <Text>{formatDateTime(end)}</Text>
            </TouchableOpacity>
          )}
          {showEndPicker ? (
            <DateTimePicker
              value={end}
              mode="date"
              display={isIOS ? "inline" : "default"}
              is24Hour
              minimumDate={start}
              onChange={handleEndChange}
            />
          ) : null}
        </>
      )}

        <BusyBeeButton title="Save" onPress={submit} />
      </ScrollView>
    </SafeAreaView>
  )
}
