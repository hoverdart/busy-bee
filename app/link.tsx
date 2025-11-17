import { useEffect, useState } from "react"
import { View, Text, TextInput } from "react-native"
import { BusyBeeButton } from "../components/BusyBeeButton"
import { useFirebase } from "../context/FirebaseProvider"
import { db } from "../lib/firebase"
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore"
import { generateUniqueJoinCode } from "../lib/joinCode"

export default function Link() {
  const { user } = useFirebase()
  const [joinCode, setJoinCode] = useState("")
  const [connectCode, setConnectCode] = useState("")
  const [status, setStatus] = useState("")
  const [connectedWith, setConnectedWith] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!user) return
      const snapshot = await getDoc(doc(db, "users", user.uid))
      if (snapshot.exists()) {
        const data = snapshot.data()
        setJoinCode(data.joinCode ?? "")
        setConnectedWith(data.connectedWith ?? null)
      }
    }
    load()
  }, [user])

  const handleGenerate = async () => {
    if (!user) {
      setStatus("Please sign in first.")
      return
    }
    const newCode = joinCode || (await generateUniqueJoinCode())
    await setDoc(
      doc(db, "users", user.uid),
      {
        joinCode: newCode,
        calendarOwner: user.uid,
      },
      { merge: true }
    )
    setJoinCode(newCode)
  }

  const handleConnect = async () => {
    if (!user) {
      setStatus("Please sign in first.")
      return
    }
    if (!connectCode.trim()) {
      setStatus("Enter a join code to connect.")
      return
    }
    const code = connectCode.trim().toUpperCase()
    if (code === joinCode) {
      setStatus("You cannot connect to your own join code.")
      return
    }

    const q = query(collection(db, "users"), where("joinCode", "==", code))
    const snapshot = await getDocs(q)
    if (snapshot.empty) {
      setStatus("No calendar found for that join code.")
      return
    }
    const partner = snapshot.docs[0]
    if (partner.id === user.uid) {
      setStatus("You cannot connect to your own join code.")
      return
    }

    await Promise.all([
      setDoc(
        doc(db, "users", user.uid),
        { connected: code, connectedWith: partner.id },
        { merge: true }
      ),
      setDoc(
        doc(db, "users", partner.id),
        {
          connected: joinCode || null,
          connectedWith: user.uid,
        },
        { merge: true }
      ),
    ])

    setConnectedWith(partner.id)
    setStatus("Calendars connected! You can now share schedules.")
  }

  if (!user) {
    return (
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 18 }}>Sign in to link calendars.</Text>
      </View>
    )
  }

  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Share Your Calendar</Text>
      <Text style={{ marginTop: 12 }}>
        Generate a join code so friends or teammates can sync with you.
      </Text>
      <BusyBeeButton title="Generate Join Code" onPress={handleGenerate} />
      {joinCode ? (
        <Text style={{ marginTop: 8, fontWeight: "600" }}>Your code: {joinCode}</Text>
      ) : null}

      <Text style={{ fontSize: 20, fontWeight: "700", marginTop: 32 }}>Connect to a friend</Text>
      <TextInput
        placeholder="Enter join code"
        autoCapitalize="characters"
        value={connectCode}
        onChangeText={setConnectCode}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 12,
          borderRadius: 8,
          marginVertical: 12,
        }}
      />
      <BusyBeeButton title="Connect" onPress={handleConnect} />

      {connectedWith ? (
        <Text style={{ marginTop: 12 }}>Connected with: {connectedWith}</Text>
      ) : null}
    </View>
  )
}
