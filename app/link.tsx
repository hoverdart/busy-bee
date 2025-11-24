import { ScrollView, Text } from "react-native"
import tw from "twrnc"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinkCalendarsPanel } from "../components/LinkCalendarsPanel"

export default function LinkScreen() {
  return (
    <SafeAreaView style={tw`flex-1 bg-[#fdf6e6]`}>
      <ScrollView contentContainerStyle={tw`p-6 pb-20`} contentInsetAdjustmentBehavior="automatic">
        <Text style={tw`text-[28px] font-bold`}>Link Calendars</Text>
        <Text style={tw`mt-2 text-[#555]`}>
          Share your schedule with the hive. Generate a join code or connect with an existing one.
        </Text>
        <LinkCalendarsPanel showHeading={false} />
      </ScrollView>
    </SafeAreaView>
  )
}
