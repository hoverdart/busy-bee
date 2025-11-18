import { useEffect, useMemo, useState } from "react"
import { View, TextInput, Text, TouchableOpacity, Platform, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker"
import { BusyBeeButton } from "../components/BusyBeeButton"
import { useCalendar } from "../context/CalendarProvider"

const isIOS = Platform.OS === "ios"
const isWeb = Platform.OS === "web"
const manualCalendarOption = { id: "manual", name: "BusyBee (My Calendar)" }

type FormErrors = {
  title?: string
  description?: string
}

export default function AddEvent() {
  const { addEvent, calendars } = useCalendar()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [start, setStart] = useState(() => new Date())
  const [end, setEnd] = useState(() => {
    const initial = new Date()
    initial.setHours(initial.getHours() + 1)
    return initial
  })
  const [showStartDatePicker, setShowStartDatePicker] = useState(isIOS)
  const [showEndDatePicker, setShowEndDatePicker] = useState(isIOS)
  const [showStartTimePicker, setShowStartTimePicker] = useState(isIOS)
  const [showEndTimePicker, setShowEndTimePicker] = useState(isIOS)
  const [errors, setErrors] = useState<FormErrors>({})

  const calendarOptions = useMemo(
    () => [manualCalendarOption, ...calendars.map((calendar) => ({ id: calendar.id, name: calendar.name ?? calendar.id }))],
    [calendars]
  )
  const [selectedCalendarId, setSelectedCalendarId] = useState(calendarOptions[0]?.id ?? manualCalendarOption.id)

  useEffect(() => {
    setSelectedCalendarId((current) => {
      if (calendarOptions.some((calendar) => calendar.id === current)) return current
      const primary = calendars.find((calendar) => calendar.primary)
      if (primary) return primary.id
      return calendarOptions[0]?.id ?? manualCalendarOption.id
    })
  }, [calendarOptions, calendars])

  const formatDate = (date: Date) =>
    date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })

  const submit = async () => {
    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()
    const nextErrors: FormErrors = {}
    if (!trimmedTitle) nextErrors.title = "Please add a title."
    if (!trimmedDescription) nextErrors.description = "Please add a description."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    await addEvent({
      title: trimmedTitle,
      description: trimmedDescription,
      start,
      end,
      calendarId: selectedCalendarId,
    })
    setErrors({})
    setTitle("")
    setDescription("")
  }

  const formatWebValue = useMemo(() => {
    const pad = (value: number) => value.toString().padStart(2, "0")
    return (date: Date) =>
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
        date.getHours()
      )}:${pad(date.getMinutes())}`
  }, [])

  const setDatePortion = (base: Date, source: Date) => {
    const next = new Date(base)
    next.setFullYear(source.getFullYear(), source.getMonth(), source.getDate())
    return next
  }

  const setTimePortion = (base: Date, source: Date) => {
    const next = new Date(base)
    next.setHours(source.getHours(), source.getMinutes(), 0, 0)
    return next
  }

  const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowStartDatePicker(false)
    if (event.type === "dismissed") return

    const datePortion = selectedDate ? setDatePortion(start, selectedDate) : start
    setStart(datePortion)
    if (datePortion > end) setEnd(datePortion)
  }

  const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowEndDatePicker(false)
    if (event.type === "dismissed") return

    const datePortion = selectedDate ? setDatePortion(end, selectedDate) : end
    setEnd(datePortion < start ? start : datePortion)
  }

  const handleStartTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowStartTimePicker(false)
    if (event.type === "dismissed") return

    const nextTime = selectedDate ? setTimePortion(start, selectedDate) : start
    setStart(nextTime)
    if (nextTime > end) setEnd(nextTime)
  }

  const handleEndTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowEndTimePicker(false)
    if (event.type === "dismissed") return

    const nextTime = selectedDate ? setTimePortion(end, selectedDate) : end
    setEnd(nextTime < start ? start : nextTime)
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

  const fieldContainerStyle = {
    borderWidth: 1,
    borderColor: "#e3d6c0",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  } as const
  const textInputBaseStyle = { fontSize: 16 }

  const errorTextStyle = { color: "#b42318", marginTop: 4, fontSize: 13 }

  const cardStyle = {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 18,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  } as const

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fdf6e6" }}>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 24, fontWeight: "700", color: "#3e2e16" }}>Create Event</Text>

        <View style={cardStyle}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#3e2e16" }}>Event details</Text>

          <Text style={{ marginTop: 16, fontWeight: "500", color: "#5b4b2e" }}>Title</Text>
          <TextInput
            value={title}
            onChangeText={(value) => {
              setTitle(value)
              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }))
            }}
            placeholder="What are you planning?"
            placeholderTextColor="#b8a17a"
            style={[
              fieldContainerStyle,
              textInputBaseStyle,
              { shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
            ]}
          />
          {errors.title ? <Text style={errorTextStyle}>{errors.title}</Text> : null}

          <Text style={{ marginTop: 16, fontWeight: "500", color: "#5b4b2e" }}>Description</Text>
          <TextInput
            value={description}
            onChangeText={(value) => {
              setDescription(value)
              if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }))
            }}
            placeholder="Add a short note so you remember the details."
            placeholderTextColor="#b8a17a"
            style={[fieldContainerStyle, textInputBaseStyle, { height: 120, textAlignVertical: "top" }]}
            multiline
          />
          {errors.description ? <Text style={errorTextStyle}>{errors.description}</Text> : null}
        </View>

        <View style={cardStyle}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#3e2e16" }}>When</Text>

          <Text style={{ marginTop: 16, fontWeight: "500", color: "#5b4b2e" }}>
            {isWeb ? "Start date & time" : "Start date"}
          </Text>
          {isWeb ? (
            <>
              <TextInput
                value={formatWebValue(start)}
                onChangeText={(value) => updateFromWeb(value, "start")}
                placeholder="YYYY-MM-DDTHH:MM"
                placeholderTextColor="#b8a17a"
                style={[fieldContainerStyle, textInputBaseStyle]}
              />
              <Text style={{ marginTop: 6, color: "#7a6a43" }}>Use 24h time (e.g. 2024-08-05T13:45).</Text>
            </>
          ) : (
            <>
              {isIOS ? (
                <Text style={{ marginTop: 6, color: "#3e2e16", fontWeight: "600" }}>{formatDate(start)}</Text>
              ) : (
                <TouchableOpacity style={fieldContainerStyle} onPress={() => setShowStartDatePicker(true)}>
                  <Text style={{ color: "#3e2e16", fontWeight: "600" }}>{formatDate(start)}</Text>
                </TouchableOpacity>
              )}
              {showStartDatePicker ? (
                <DateTimePicker
                  value={start}
                  mode="date"
                  display={isIOS ? "inline" : "default"}
                  onChange={handleStartDateChange}
                />
              ) : null}
            </>
          )}

          {!isWeb ? (
            <>
              <Text style={{ marginTop: 16, fontWeight: "500", color: "#5b4b2e" }}>Start time</Text>
              {isIOS ? (
                <Text style={{ marginTop: 6, color: "#3e2e16", fontWeight: "600" }}>{formatTime(start)}</Text>
              ) : (
                <TouchableOpacity style={fieldContainerStyle} onPress={() => setShowStartTimePicker(true)}>
                  <Text style={{ color: "#3e2e16", fontWeight: "600" }}>{formatTime(start)}</Text>
                </TouchableOpacity>
              )}
              {showStartTimePicker ? (
                <DateTimePicker
                  value={start}
                  mode="time"
                  display={isIOS ? "spinner" : "default"}
                  is24Hour
                  onChange={handleStartTimeChange}
                />
              ) : null}
            </>
          ) : null}

          <View style={{ height: 1, backgroundColor: "#f2e9d9", marginVertical: 18 }} />

          <Text style={{ fontWeight: "500", color: "#5b4b2e" }}>{isWeb ? "End date & time" : "End date"}</Text>
          {isWeb ? (
            <>
              <TextInput
                value={formatWebValue(end)}
                onChangeText={(value) => updateFromWeb(value, "end")}
                placeholder="YYYY-MM-DDTHH:MM"
                placeholderTextColor="#b8a17a"
                style={[fieldContainerStyle, textInputBaseStyle]}
              />
              <Text style={{ marginTop: 6, color: "#7a6a43" }}>Use 24h time (e.g. 2024-08-05T15:00).</Text>
            </>
          ) : (
            <>
              {isIOS ? (
                <Text style={{ marginTop: 6, color: "#3e2e16", fontWeight: "600" }}>{formatDate(end)}</Text>
              ) : (
                <TouchableOpacity style={fieldContainerStyle} onPress={() => setShowEndDatePicker(true)}>
                  <Text style={{ color: "#3e2e16", fontWeight: "600" }}>{formatDate(end)}</Text>
                </TouchableOpacity>
              )}
              {showEndDatePicker ? (
                <DateTimePicker
                  value={end}
                  mode="date"
                  display={isIOS ? "inline" : "default"}
                  minimumDate={start}
                  onChange={handleEndDateChange}
                />
              ) : null}
            </>
          )}

          {!isWeb ? (
            <>
              <Text style={{ marginTop: 16, fontWeight: "500", color: "#5b4b2e" }}>End time</Text>
              {isIOS ? (
                <Text style={{ marginTop: 6, color: "#3e2e16", fontWeight: "600" }}>{formatTime(end)}</Text>
              ) : (
                <TouchableOpacity style={fieldContainerStyle} onPress={() => setShowEndTimePicker(true)}>
                  <Text style={{ color: "#3e2e16", fontWeight: "600" }}>{formatTime(end)}</Text>
                </TouchableOpacity>
              )}
              {showEndTimePicker ? (
                <DateTimePicker
                  value={end}
                  mode="time"
                  display={isIOS ? "spinner" : "default"}
                  is24Hour
                  onChange={handleEndTimeChange}
                />
              ) : null}
            </>
          ) : null}
        </View>

        <View style={cardStyle}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#3e2e16" }}>Add to calendar</Text>
          <Text style={{ marginTop: 8, color: "#7a6a43" }}>
            Choose where BusyBee should save this event. You can always sync with Google again later.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 16 }}>
            {calendarOptions.map((calendar) => {
              const isSelected = calendar.id === selectedCalendarId
              return (
                <TouchableOpacity
                  key={calendar.id}
                  onPress={() => setSelectedCalendarId(calendar.id)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1.5,
                    borderColor: isSelected ? "#f5a524" : "#e7dcc7",
                    backgroundColor: isSelected ? "#f5a524" : "transparent",
                    marginRight: 8,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: isSelected ? "#fff" : "#7a6a43", fontWeight: "600" }}>{calendar.name}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <BusyBeeButton title="Save" onPress={submit} />
      </ScrollView>
    </SafeAreaView>
  )
}
