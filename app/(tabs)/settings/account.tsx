import { useState } from "react"
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native"
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fdf6e6" }}>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 80 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={{ padding: 20, borderRadius: 18, backgroundColor: "#fff" }}>
          <Text style={{ fontSize: 18, fontWeight: "700" }}>Signed in as</Text>
          <Text style={{ marginTop: 6, fontSize: 24, fontWeight: "700", color: "#4c3f1e" }}>
            {user?.displayName ?? user?.email ?? "BusyBee user"}
          </Text>
          {user?.email ? <Text style={{ marginTop: 4, color: "#777" }}>{user.email}</Text> : null}
        </View>

        <View
          style={{
            marginTop: 24,
            padding: 20,
            borderRadius: 18,
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: "#ffe2d7",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#962d17" }}>Delete account</Text>
          <Text style={{ marginTop: 8, color: "#5c5131" }}>
            Removing your account permanently erases BusyBee data and unlinks any connected calendars.
          </Text>
          <TouchableOpacity
            onPress={confirmDelete}
            disabled={deleting || !user}
            style={{
              marginTop: 16,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: deleting ? "#f3b7aa" : "#f35b41",
              alignItems: "center",
            }}
          >
            {deleting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "700" }}>Delete my account</Text>
            )}
          </TouchableOpacity>
          {deleteError ? <Text style={{ marginTop: 10, color: "#b42318" }}>{deleteError}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
