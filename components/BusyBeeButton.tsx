import { Text, TouchableOpacity } from "react-native"

type BusyBeeButtonProps = {
  title: string
  onPress: () => void | Promise<void>
}

export const BusyBeeButton = ({ title, onPress }: BusyBeeButtonProps) => (
  <TouchableOpacity
    style={{
      backgroundColor: "#FFD600",
      padding: 14,
      borderRadius: 10,
      marginVertical: 10,
    }}
    onPress={onPress}
  >
    <Text style={{ textAlign: "center", fontWeight: "600" }}>{title}</Text>
  </TouchableOpacity>
)
