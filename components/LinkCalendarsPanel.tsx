import { useEffect, useState } from "react"
import { View, Text, TextInput, Alert, TouchableOpacity } from "react-native"
import tw from "twrnc"
import { BusyBeeButton } from "./BusyBeeButton"
import { useFirebase } from "../context/FirebaseProvider"
import { useCalendar } from "../context/CalendarProvider"
import { db } from "../lib/firebase"
import { arrayUnion, arrayRemove, collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore"
import { generateUniqueJoinCode } from "../lib/joinCode"

type LinkCalendarsPanelProps = {
  heading?: string
  showHeading?: boolean
}

export type PartnerConnection = {
  id: string
  name?: string
  email?: string
  joinCode?: string | null
}

const ensureArray = <T,>(value: T | T[] | null | undefined): T[] => {
  if (!value) return []
  return Array.isArray(value) ? value.filter(Boolean) : [value]
}

export const LinkCalendarsPanel = ({ heading = "Share Your Calendar", showHeading = true }: LinkCalendarsPanelProps) => {
  const { user } = useFirebase()
  const { reload } = useCalendar()
  const [joinCode, setJoinCode] = useState("")
  const [connectCodeInput, setConnectCodeInput] = useState("")
  const [status, setStatus] = useState("")
  const [connectedWith, setConnectedWith] = useState<string[]>([])
  const [connections, setConnections] = useState<PartnerConnection[]>([])

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setJoinCode("")
        setConnectedWith([])
        setConnections([])
        return
      }
      const snapshot = await getDoc(doc(db, "users", user.uid))
      if (snapshot.exists()) {
        const data = snapshot.data()
        setJoinCode(data.joinCode ?? "")
        const partnerIds = ensureArray<string>(data.connectedWith as string[] | string | null | undefined)
        setConnectedWith(partnerIds)

        if (partnerIds.length) {
          const partnerSnaps = await Promise.all(
            partnerIds.map(async (partnerId) => {
              const partnerSnap = await getDoc(doc(db, "users", partnerId))
              if (!partnerSnap.exists()) return null
              const partnerData = partnerSnap.data()
              return {
                id: partnerId,
                name: (partnerData.displayName as string | undefined) ?? undefined,
                email: (partnerData.email as string | undefined) ?? undefined,
                joinCode: (partnerData.joinCode as string | undefined) ?? null,
              }
            })
          )
          setConnections(partnerSnaps.filter(Boolean) as PartnerConnection[])
        } else {
          setConnections([])
        }
      } else {
        setConnections([])
        setConnectedWith([])
        setJoinCode("")
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
    if (!connectCodeInput.trim()) {
      setStatus("Enter a join code to connect.")
      return
    }
    const code = connectCodeInput.trim().toUpperCase()
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

    const partnerData = partner.data()
    const partnerConnections = ensureArray<string>(
      partnerData.connectedWith as string[] | string | null | undefined
    )
    if (partnerConnections.includes(user.uid)) {
      setStatus("You are already connected to this calendar.")
      return
    }
    if (connectedWith.includes(partner.id)) {
      setStatus("You are already connected to this calendar.")
      return
    }

    const partnerJoinCode = (partnerData.joinCode as string | undefined) ?? code

    await Promise.all([
      setDoc(
        doc(db, "users", user.uid),
        { connected: arrayUnion(code), connectedWith: arrayUnion(partner.id) },
        { merge: true }
      ),
      setDoc(
        doc(db, "users", partner.id),
        {
          connected: arrayUnion(joinCode || null),
          connectedWith: arrayUnion(user.uid),
        },
        { merge: true }
      ),
    ])

    await reload()

    setConnectedWith((prev) => (prev.includes(partner.id) ? prev : [...prev, partner.id]))
    setConnections((prev) => {
      if (prev.some((existing) => existing.id === partner.id)) return prev
      return [
        ...prev,
        {
          id: partner.id,
          name: (partnerData.displayName as string | undefined) ?? undefined,
          email: (partnerData.email as string | undefined) ?? undefined,
          joinCode: partnerJoinCode,
        },
      ]
    })
    setConnectCodeInput("")
    setStatus("Calendars connected! You can now share schedules.")
  }

  const handleConfirmUnlink = async (partner: PartnerConnection) => {
    if (!user) return
    const userUpdates: Record<string, any> = {
      connectedWith: arrayRemove(partner.id),
    }
    if (partner.joinCode) {
      userUpdates.connected = arrayRemove(partner.joinCode)
    }
    const partnerUpdates: Record<string, any> = {
      connectedWith: arrayRemove(user.uid),
    }
    if (joinCode) {
      partnerUpdates.connected = arrayRemove(joinCode)
    }
    await Promise.all([
      setDoc(doc(db, "users", user.uid), userUpdates, { merge: true }),
      setDoc(doc(db, "users", partner.id), partnerUpdates, { merge: true }),
    ])
    await reload()
    setConnectedWith((prev) => prev.filter((id) => id !== partner.id))
    setConnections((prev) => prev.filter((existing) => existing.id !== partner.id))
    setStatus("Calendars disconnected.")
  }

  const handleUnlink = (partner: PartnerConnection) => {
    const partnerLabel = partner.name ?? partner.email ?? "this calendar"
    Alert.alert("Unlink calendars?", `Disconnect from ${partnerLabel}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Unlink", style: "destructive", onPress: () => handleConfirmUnlink(partner) },
    ])
  }

  const hasConnections = connections.length > 0

  return (
    <View
      style={[
        tw`p-[18px] rounded-2xl border border-[#f0e7d8] mt-6`,
        hasConnections ? tw`bg-[#fff9e8]` : tw`bg-white`,
      ]}
    >
      {showHeading ? (
        <>
          <Text style={tw`text-xl font-bold`}>{heading}</Text>
          <Text style={tw`mt-2`}>Generate a join code so friends or family can sync with you.</Text>
        </>
      ) : null}
      {!joinCode && <BusyBeeButton title={joinCode ? "Regenerate Join Code" : "Generate Join Code"} onPress={handleGenerate} />}
      {joinCode ? (
        <View
          style={tw`mt-3 p-3 rounded-xl bg-white border border-[#f0e7d8]`}
        >
          <Text style={tw`font-semibold text-[#7a6a43]`}>Your join code</Text>
          <Text style={tw`text-2xl tracking-[1px] font-extrabold mt-1`}>{joinCode}</Text>
        </View>
      ) : null}

      
      {hasConnections ? (
        <View
          style={tw`mt-5 p-3 rounded-xl bg-white border border-[#f0e7d8]`}
        >
          <Text style={tw`font-semibold text-[#7a6a43]`}>Connected calendars</Text>
          {connections.map((partner) => {
            const partnerLabel = partner.name ?? partner.email ?? "BusyBee user"
            return (
              <View
                key={partner.id}
                style={tw`mt-3 border border-[#f0e7d8] rounded-lg p-[10px] bg-[#fffdf5]`}
              >
                <Text style={tw`mt-1 text-base`}>
                  {partnerLabel}
                  <Text style={tw`text-[#999]`}> ({partner.id})</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => handleUnlink(partner)}
                  style={tw`mt-3 py-2 rounded-lg bg-[#ffe6e6] items-center`}
                >
                  <Text style={tw`text-[#c23b3b] font-bold`}>Unlink calendars</Text>
                </TouchableOpacity>
              </View>
            )
          })}
        </View>
      ) : (
        <Text style={tw`mt-4 text-[#7a6a43]`}>No linked calendars yet.</Text>
      )}


      <Text style={tw`text-lg font-bold mt-5`}>Connect to a friend</Text>
      <TextInput
        placeholder="Enter join code"
        autoCapitalize="characters"
        value={connectCodeInput}
        maxLength={5}
        onChangeText={setConnectCodeInput}
        style={tw`border border-[#ccc] p-3 rounded-lg my-3`}
      />
      
      <BusyBeeButton title="Connect Calendars" onPress={handleConnect} />
      {status ? <Text style={tw`mt-3 text-[#5c5131]`}>{status}</Text> : null}
    </View>
  )
}
