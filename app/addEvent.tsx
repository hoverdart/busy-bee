import { useEffect, useMemo, useState } from "react";
import { View, TextInput, Text, TouchableOpacity, Platform, ScrollView } from "react-native";
import tw from "twrnc";
import { useFirebase } from "@/context/FirebaseProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import DatePicker from 'react-native-date-picker';
import { BusyBeeButton } from "../components/BusyBeeButton";
import { useCalendar } from "../context/CalendarProvider";


type FormErrors = {
  title?: string
  description?: string
}

export default function AddEvent() {
  const { addEvent, calendars } = useCalendar();
  const { user } = useFirebase()
  const [errors, setErrors] = useState<FormErrors>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(() => {
    const initial = new Date()
    initial.setHours(initial.getHours() + 1)
    return initial
  });
  const [submitted, setSubmitted] = useState(false);
  const calendarOptions = useMemo(
    () => [ ...calendars.map((calendar) => ({ id: calendar.id, name: calendar.name ?? calendar.id }))],
    [calendars]
  )
  const [selectedCalendarId, setSelectedCalendarId] = useState(user?.email) //this is the standard starting calendar

  useEffect(() => {
    setSelectedCalendarId((current) => {
      if (calendarOptions.some((calendar) => calendar.id === current)) return current
      const primary = calendars.find((calendar) => calendar.primary)
      if (primary) return primary.id
      return calendarOptions[0]?.id
    })
  }, [calendarOptions, calendars])

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
      start: start,
      end: end,
      calendarId: selectedCalendarId!
    })
    setErrors({});
    setTitle("");
    setDescription("");
    setSubmitted(true);
  }

  const fieldContainerStyle = tw`border border-[#e3d6c0] bg-white p-[14px] rounded-xl mt-[10px]`
  const textInputBaseStyle = tw`text-base`
  const errorTextStyle = tw`text-[#b42318] mt-1 text-[13px]`
  const cardStyle = tw`bg-white p-5 rounded-[18px] mt-5 shadow-md elevation-2`

  return (
    <SafeAreaView style={tw`flex-1 bg-[#fdf6e6]`}>
      <ScrollView contentContainerStyle={tw`p-6 pb-30`} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
        <Text style={tw`text-2xl font-bold text-[#3e2e16]`}>Create Event</Text>

        <View style={cardStyle}>
          <Text style={tw`text-lg font-semibold text-[#3e2e16]`}>Event details</Text>

          <Text style={tw`mt-4 font-medium text-[#5b4b2e]`}>Title</Text>
          <TextInput value={title}
            onChangeText={(value) => {
              setTitle(value)
              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }))
            }}
            placeholder="What are you planning?"
            placeholderTextColor="#b8a17a"
            style={[fieldContainerStyle, textInputBaseStyle, tw`shadow-sm elevation-1`]}
          />
          {errors.title ? <Text style={errorTextStyle}>{errors.title}</Text> : null}

          <Text style={tw`mt-4 font-medium text-[#5b4b2e]`}>Description</Text>
          <TextInput
            value={description}
            onChangeText={(value) => {
              setDescription(value)
              if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }))
            }}
            placeholder="Add a short note so you remember the details."
            placeholderTextColor="#b8a17a"
            style={[fieldContainerStyle, textInputBaseStyle, tw`h-[120px]`, { textAlignVertical: "top" }]}
            multiline
          />
          {errors.description ? <Text style={errorTextStyle}>{errors.description}</Text> : null}
        </View>

        <View style={cardStyle}>
          <Text style={tw`text-lg font-semibold text-[#3e2e16]`}>When</Text>

          <Text style={tw`mt-4 font-medium text-[#5b4b2e]`}>Starting Datetime </Text>
          <DatePicker open={true} date={start} onDateChange={(date) => {setStart(new Date(date)); }} />

          <View style={tw`h-px bg-[#f2e9d9] my-[18px]`} />

          <Text style={tw`font-medium text-[#5b4b2e]`}>End Datetime</Text>
          <DatePicker open={true} date={end} minimumDate = {start} onDateChange={(date) => {setEnd(new Date(date)); }} />
        </View>

        <View style={cardStyle}>
          <Text style={tw`text-lg font-semibold text-[#3e2e16]`}>Add to calendar</Text>
          <Text style={tw`mt-2 text-[#7a6a43]`}>
            Choose where BusyBee should save this event. You can always sync with Google again later.
          </Text>
          <View style={tw`flex-row flex-wrap mt-4`}>
            {calendarOptions.map((calendar) => {
              const isSelected = calendar.id === selectedCalendarId
              return (
                <TouchableOpacity
                  key={calendar.id}
                  onPress={() => setSelectedCalendarId(calendar.id)}
                  style={[
                    tw`px-[14px] py-2 rounded-full border mr-2 mb-[10px]`,
                    isSelected ? tw`bg-[#f5a524] border-[#f5a524]` : tw`bg-transparent border-[#e7dcc7]`,
                  ]}>
                  <Text style={[tw`font-semibold`, isSelected ? tw`text-white` : tw`text-[#7a6a43]`]}>
                    {calendar.name}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <BusyBeeButton title="Save" onPress={submit} />
        <Text>{submitted && "Event added!"}</Text>
      </ScrollView>
    </SafeAreaView>
  )
}
