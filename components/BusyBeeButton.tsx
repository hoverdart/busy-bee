import { Text, TouchableOpacity } from "react-native"
import tw from "twrnc"

type BusyBeeButtonProps = {
  title: string
  onPress: () => void | Promise<void>
}

export const BusyBeeButton = ({ title, onPress }: BusyBeeButtonProps) => (
  <TouchableOpacity
    style={tw`bg-[#FFD600] p-[14px] rounded-xl my-[10px]`}
    onPress={onPress}
  >
    <Text style={tw`text-center font-semibold`}>{title}</Text>
  </TouchableOpacity>
)
