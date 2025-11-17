import { useEffect, useState } from "react"
import { View, Text, TextInput, Alert, TouchableOpacity } from "react-native"
import { BusyBeeButton } from "./BusyBeeButton"
import { useFirebase } from "../context/FirebaseProvider"
import { db } from "../lib/firebase"
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore"
import { generateUniqueJoinCode } from "../lib/joinCode"

type LinkCalendarsPanelProps = {
  heading?: string
  showHeading?: boolean
}

export const LinkCalendarsPanel = ({
  heading = "Share Your Calendar",
  showHeading = true,
}: LinkCalendarsPanelProps) => {
  const { user } = useFirebase()
  const [joinCode, setJoinCode] = useState("")
  const [connectCode, setConnectCode] = useState("")
  const [status, setStatus] = useState("")
  const [connectedWith, setConnectedWith] = useState<string | null>(null)
  const [partnerInfo, setPartnerInfo] = useState<{ name?: string; email?: string } | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!user) return
      const snapshot = await getDoc(doc(db, "users", user.uid))
      if (snapshot.exists()) {
        const data = snapshot.data()
        setJoinCode(data.joinCode ?? "")
        const partnerId = data.connectedWith ?? null
        setConnectedWith(partnerId)

        if (partnerId) {
          const partnerSnap = await getDoc(doc(db, "users", partnerId))
          if (partnerSnap.exists()) {
            const partnerData = partnerSnap.data()
            setPartnerInfo({
              name: (partnerData.displayName as string | undefined) ?? undefined,
              email: (partnerData.email as string | undefined) ?? undefined,
            })
          } else {
            setPartnerInfo(null)
          }
        } else {
          setPartnerInfo(null)
        }
      } else {
        setPartnerInfo(null)
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
    setStatus(`Share this join code: ${newCode}`)
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
    const data = partner.data()
    setPartnerInfo({
      name: (data.displayName as string | undefined) ?? undefined,
      email: (data.email as string | undefined) ?? undefined,
    })
    setStatus("Calendars connected! You can now share schedules.")
  }

  const handleConfirmUnlink = async () => {
    if (!user || !connectedWith) return
    await Promise.all([
      setDoc(
        doc(db, "users", user.uid),
        { connected: null, connectedWith: null },
        { merge: true }
      ),
      setDoc(doc(db, "users", connectedWith), { connected: null, connectedWith: null }, { merge: true }),
    ])
    setConnectedWith(null)
    setPartnerInfo(null)
    setStatus("Calendars disconnected.")
  }

  const handleUnlink = () => {
    Alert.alert("Unlink calendars?", "Are you sure you want to disconnect this calendar link?", [
      { text: "Cancel", style: "cancel" },
      { text: "Unlink", style: "destructive", onPress: handleConfirmUnlink },
    ])
  }

  const partnerLabel = partnerInfo?.name ?? partnerInfo?.email ?? "BusyBee user"

  return (
    <View
      style={{
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#f0e7d8",
        backgroundColor: connectedWith ? "#fff9e8" : "#fff",
        marginTop: 24,
      }}
    >
      {showHeading ? (
        <>
          <Text style={{ fontSize: 20, fontWeight: "700" }}>{heading}</Text>
          <Text style={{ marginTop: 8 }}>
            Generate a join code so friends or teammates can sync with you.
          </Text>
        </>
      ) : null}
      <BusyBeeButton title={joinCode ? "Regenerate Join Code" : "Generate Join Code"} onPress={handleGenerate} />
      {joinCode ? (
        <View
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: "#f0e7d8",
          }}
        >
          <Text style={{ fontWeight: "600", color: "#7a6a43" }}>Your join code</Text>
          <Text style={{ fontSize: 24, letterSpacing: 1, fontWeight: "800", marginTop: 4 }}>{joinCode}</Text>
        </View>
      ) : null}

      

      {!connectedWith ? (
        <>
          <Text style={{ fontSize: 16, fontWeight: "700", marginTop: 20 }}>Connect to a friend</Text>
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
          <BusyBeeButton title="Connect Calendars" onPress={handleConnect} />
        </>
      ) : (
        <View
          style={{
            marginTop: 20,
            padding: 12,
            borderRadius: 12,
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: "#f0e7d8",
          }}
        >
          <Text style={{ fontWeight: "600", color: "#7a6a43" }}>You're connected!</Text>
          <Text style={{ marginTop: 4, fontSize: 16 }}>
            {partnerLabel}
            <Text style={{ color: "#999" }}> ({connectedWith})</Text>
          </Text>
          <TouchableOpacity
            onPress={handleUnlink}
            style={{
              marginTop: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: "#ffe6e6",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#c23b3b", fontWeight: "700" }}>Unlink calendars</Text>
          </TouchableOpacity>
        </View>
      )}

      {status ? <Text style={{ marginTop: 12, color: "#5c5131" }}>{status}</Text> : null}
    </View>
  )
}
