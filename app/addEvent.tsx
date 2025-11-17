import { useState } from "react"
import { View, TextInput, Text } from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import { BusyBeeButton } from "../components/BusyBeeButton"
import { useCalendar } from "../context/CalendarProvider"

export default function AddEvent() {
  const { addEvent } = useCalendar()
  const [title, setTitle] = useState("")
  const [start, setStart] = useState(new Date())
  const [end, setEnd] = useState(new Date())

  const submit = async () => {
    await addEvent({
      title,
      start,
      end
    })
  }

  const setStarting = (_event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || start
    setStart(currentDate)
    if (currentDate > end) {
      setEnd(currentDate)
    }
  }

  return (
    <View style={{ padding: 24 }}>
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
      <DateTimePicker value={start} mode="datetime" is24Hour onChange={setStarting} />

      <Text style={{ marginTop: 12, fontWeight: "600" }}>End</Text>
      <DateTimePicker
        value={end}
        mode="datetime"
        is24Hour
        onChange={(_event, selectedDate) => {
          const currentDate = selectedDate || end
          setEnd(currentDate < start ? start : currentDate)
        }}
      />

      <BusyBeeButton title="Save" onPress={submit} />
    </View>
  )
}
