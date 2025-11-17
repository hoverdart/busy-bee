import { useState } from "react"
import { View, TextInput, Text } from "react-native"
import { BusyBeeButton } from "../components/BusyBeeButton"
import { useCalendar } from "../context/CalendarProvider"

export default function AddEvent() {
  const { addEvent } = useCalendar()
  const [title, setTitle] = useState("")

  const submit = async () => {
    const now = new Date().toISOString()

    await addEvent({
      title,
      start: now,
      end: now,
    })
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

      <BusyBeeButton title="Save" onPress={submit} />
    </View>
  )
}
