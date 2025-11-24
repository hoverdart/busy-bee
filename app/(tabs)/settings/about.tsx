import Constants from "expo-constants"
import { Linking, Pressable, ScrollView, Text, View } from "react-native"
import tw from "twrnc"
import { SafeAreaView } from "react-native-safe-area-context"

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={tw`flex-row justify-between my-[6px] py-[6px] border-b border-[#f1e8d9]`}>
    <Text style={tw`text-[#7a6a43]`}>{label}</Text>
    <Text style={tw`font-semibold`}>{value}</Text>
  </View>
)

export default function AboutSettings() {
  const handleOpenLink = (url: string) => {
    Linking.openURL(url)
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-[#fdf6e6]`}>
      <ScrollView contentContainerStyle={tw`p-6 pb-25`} contentInsetAdjustmentBehavior="automatic">
        <View style={tw`p-5 rounded-[18px] bg-white`}>
          <Text style={tw`text-xl font-bold`}>BusyBee</Text>
          <Text style={tw`mt-[6px] text-[#555]`}>
            Helping pairs stay perfectly in sync with their schedules.
          </Text>

          <View style={tw`mt-[18px]`}>
            <InfoRow label="Version" value={Constants.expoConfig?.version ?? "1.0.0"} />
            <InfoRow label="Build" value={typeof Constants.expoConfig?.runtimeVersion === "string" ? Constants.expoConfig.runtimeVersion : "—"} />
          </View>
        </View>

        <View style={tw`p-5 rounded-[18px] bg-white mt-6`}>
          <View>
            <View style={tw`flex-row justify-between items-center my-[6px] py-[6px] border-b border-[#f1e8d9]`}>
              <Text style={tw`text-[#7a6a43]`}>Privacy Policy</Text>
              <Pressable
                onPress={() => handleOpenLink("https://busybee.shauryav.com/privacy")}
                style={tw`px-3 py-[6px] rounded-full border border-[#7a6a43] bg-[#fdf6e6]`}
              >
                <Text style={tw`font-semibold text-[#7a6a43] text-xs`}>Open</Text>
              </Pressable>
            </View>
          </View>
            
          
          <View>
            <View style={tw`flex-row justify-between items-center my-[6px] py-[6px] border-b border-[#f1e8d9]`}>
              <Text style={tw`text-[#7a6a43]`}>Terms of Use</Text>
              <Pressable
                onPress={() => handleOpenLink("https://busybee.shauryav.com/terms")}
                style={tw`px-3 py-[6px] rounded-full border border-[#7a6a43] bg-[#fdf6e6]`}
              >
                <Text style={tw`font-semibold text-[#7a6a43] text-xs`}>Open</Text>
              </Pressable>
            </View>
          </View>
            
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}
