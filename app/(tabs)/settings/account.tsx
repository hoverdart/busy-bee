import { useState } from "react"
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native"
import tw from "twrnc"
import { SafeAreaView } from "react-native-safe-area-context"
import { useFirebase } from "../../../context/FirebaseProvider"
import { deleteUser } from "firebase/auth"
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "../../../lib/firebase"

export default function AccountSettings() {
  const { user } = useFirebase()
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const unlinkPartnerIfNeeded = async (connectedWith?: string | null) => {
    if (!connectedWith) return
    try {
      await setDoc(
        doc(db, "users", connectedWith),
        {
          connected: null,
          connectedWith: null,
        },
        { merge: true }
      )
    } catch (err) {
      console.warn("Failed to unlink partner", err)
    }
  }

  const performDelete = async () => {
    if (!user) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const userRef = doc(db, "users", user.uid)
      const snapshot = await getDoc(userRef)
      const connectedWith = snapshot.exists() ? ((snapshot.data()?.connectedWith as string | null | undefined) ?? null) : null
      await unlinkPartnerIfNeeded(connectedWith)
      await deleteDoc(userRef)
      await deleteUser(user)
    } catch (err: any) {
      console.error("Delete account failed", err)
      if (err?.code === "auth/requires-recent-login") {
        setDeleteError("Please sign in again before deleting your account.")
      } else {
        setDeleteError("Something went wrong while deleting your account. Please try again.")
      }
    } finally {
      setDeleting(false)
    }
  }

  const confirmDelete = () => {
    if (!user || deleting) return
    Alert.alert(
      "Delete account?",
      "This removes your events and disconnects anyone you have linked with. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: performDelete },
      ]
    )
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-[#fdf6e6]`}>
      <ScrollView contentContainerStyle={tw`p-6 pb-20`} contentInsetAdjustmentBehavior="automatic">
        <View style={tw`p-5 rounded-[18px] bg-white`}>
          <Text style={tw`text-lg font-bold`}>Signed in as</Text>
          <Text style={tw`mt-[6px] text-[24px] font-bold text-[#4c3f1e]`}>
            {user?.displayName ?? user?.email ?? "BusyBee user"}
          </Text>
          {user?.email ? <Text style={tw`mt-1 text-[#777]`}>{user.email}</Text> : null}
        </View>

        <View style={tw`mt-6 p-5 rounded-[18px] bg-white border border-[#ffe2d7]`}>
          <Text style={tw`text-lg font-bold text-[#962d17]`}>Delete account</Text>
          <Text style={tw`mt-2 text-[#5c5131]`}>
            Removing your account permanently erases BusyBee data and unlinks any connected calendars.
          </Text>
          <TouchableOpacity
            onPress={confirmDelete}
            disabled={deleting || !user}
            style={[tw`mt-4 py-3 rounded-xl items-center`, deleting ? tw`bg-[#f3b7aa]` : tw`bg-[#f35b41]`]}
          >
            {deleting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={tw`text-white font-bold`}>Delete my account</Text>
            )}
          </TouchableOpacity>
          {deleteError ? <Text style={tw`mt-[10px] text-[#b42318]`}>{deleteError}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
