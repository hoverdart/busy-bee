import { useEffect, useMemo, useState } from "react"
import { ScrollView, View, Text } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { BusyBeeButton } from "../../components/BusyBeeButton"
import { useFirebase } from "../../context/FirebaseProvider"
import { useCalendar, type CalendarEvent } from "../../context/CalendarProvider"
import { db } from "../../lib/firebase"
import { doc, getDoc } from "firebase/firestore"

type PartnerProfile = {
  id: string
  displayName?: string | null
  calendarEvents: CalendarEvent[]
}

const toDate = (value: Date | string) => (value instanceof Date ? value : new Date(value))

const formatRange = (start: Date, end: Date) =>
  `${start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })} · ${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - ${end.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={{ marginTop: 24 }}>
    <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 8 }}>{title}</Text>
    {children}
  </View>
)

type CombinedEvent = CalendarEvent & { owner: "me" | "partner" }

const EventCard = ({
  event,
  owner,
  partnerName,
}: {
  event: CalendarEvent
  owner?: "me" | "partner"
  partnerName?: string | null
}) => {
  const start = toDate(event.start)
  const end = toDate(event.end)
  return (
    <View
      style={{
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#eee",
        marginBottom: 12,
        backgroundColor: "#fff",
      }}
    >
      {owner ? (
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: owner === "me" ? "#f5a524" : "#7da4f7",
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 999,
            marginBottom: 4,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>
            {owner === "me" ? "You" : partnerName ?? "Partner"}
          </Text>
        </View>
      ) : null}
      <Text style={{ fontWeight: "600", marginBottom: 4 }}>{event.title}</Text>
      <Text style={{ color: "#555" }}>{formatRange(start, end)}</Text>
    </View>
  )
}

export default function HomeTab() {
  const router = useRouter()
  const { user } = useFirebase()
  const { events } = useCalendar()
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null)
  const [connectedWith, setConnectedWith] = useState<string | null>(null)
  const [loadingPartner, setLoadingPartner] = useState(true)

  useEffect(() => {
    const loadPartner = async () => {
      if (!user) {
        setPartnerProfile(null)
        setConnectedWith(null)
        setLoadingPartner(false)
        return
      }
      setLoadingPartner(true)

      const userDoc = await getDoc(doc(db, "users", user.uid))
      const connectedId = userDoc.exists() ? (userDoc.data().connectedWith as string | undefined) : undefined
      setConnectedWith(connectedId ?? null)

      if (connectedId) {
        const partnerSnap = await getDoc(doc(db, "users", connectedId))
        if (partnerSnap.exists()) {
          const data = partnerSnap.data()
          setPartnerProfile({
            id: connectedId,
            displayName: (data.displayName as string | undefined) ?? data.email,
            calendarEvents: (data.calendarEvents as CalendarEvent[]) ?? [],
          })
        } else {
          setPartnerProfile(null)
        }
      } else {
        setPartnerProfile(null)
      }
      setLoadingPartner(false)
    }

    loadPartner()
  }, [events, user])

  const partnerEvents = partnerProfile?.calendarEvents ?? []

  const combinedEvents = useMemo(() => {
    const seen = new Set<string>()
    const tagged: CombinedEvent[] = []
    events.forEach((event) => {
      const key = `${event.id}-${event.start}-${event.end}`
      if (seen.has(key)) return
      seen.add(key)
      tagged.push({ ...event, owner: "me" })
    })
    partnerEvents.forEach((event) => {
      const key = `${event.id}-${event.start}-${event.end}`
      if (seen.has(key)) return
      seen.add(key)
      tagged.push({ ...event, owner: "partner" })
    })
    return tagged.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }, [events, partnerEvents])

  const partnerStatus = useMemo(() => {
    if (!partnerEvents.length) return null
    const now = Date.now()
    const active = partnerEvents.find((event) => {
      const start = toDate(event.start).getTime()
      const end = toDate(event.end).getTime()
      return now >= start && now <= end
    })
    if (active) {
      return {
        label: `${partnerProfile?.displayName ?? "Your partner"} is currently in: `,
        value: active.title,
        freeAt: "free at " + toDate(active.end).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      }
    }
    const upcoming = partnerEvents
      .map((event) => ({ ...event, startDate: toDate(event.start) }))
      .filter((item) => item.startDate.getTime() > now)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0]

    if (upcoming) {
      return {
        label: `${partnerProfile?.displayName ?? "Your partner"} is currently free!`,
        value: `Next: ${upcoming.title}`,
        freeAt: `busy at ${upcoming.startDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
      }
    }
    return {
      label: `${partnerProfile?.displayName ?? "Your partner"} is free`,
      value: "No more events today",
      freeAt: "Enjoy the downtime!",
    }
  }, [partnerEvents, partnerProfile])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fdf6e6" }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 72 }} contentInsetAdjustmentBehavior="automatic">
      <View
        style={{
          backgroundColor: "#fff",
          padding: 20,
          borderRadius: 18,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 1,
        }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: "#3e2e16" }}>
          Welcome back{user?.displayName ? `, ${user.displayName}` : ""}!
        </Text>
        <Text style={{ marginTop: 4, color: "#666" }}>
          Keep your hive synced and see what's coming up for you and your busy bee.
        </Text>
      </View>

      {connectedWith ? (
        <View
          style={{
            marginTop: 24,
            padding: 20,
            borderRadius: 20,
            backgroundColor: "#FFF8EF",
            borderWidth: 1,
            borderColor: "#F2D3A0",

            // Shadow (iOS)
            shadowColor: "#000",
            shadowOpacity: 0.07,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },

            // Elevation (Android)
            elevation: 3,
          }}
        >
          {partnerStatus ? (
            <>
              {/* Status pill */}
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "#FFE5BA",
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                  marginBottom: 8,
                }}>
                <Text style={{ fontWeight: "600", color: "#9A6A25" }}>
                  {partnerStatus.label}
                </Text>
              </View>

              {/* Main value */}
              <Text style={{fontWeight: "800",fontSize: 22,color: "#3A2E1F",}}>
                {partnerStatus.value}
              </Text>

              {/* Subtext */}
              <Text style={{ marginTop: 6,  fontSize: 15, color: "#6A5E50",}}>
                They'll be <Text style={{ fontWeight: "600" }}>{partnerStatus.freeAt}</Text>.
              </Text>
            </>
          ) : (
            <Text style={{ fontSize: 16, color: "#444" }}>
              We're fetching your partner's calendar...
            </Text>
          )}
        </View>

      ) : (
        <View
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#f5d8a2",
            backgroundColor: "#fffaf0",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#3e2e16" }}>Nobody connected yet.</Text>
          <Text style={{ marginTop: 4, color: "#6f6146" }}>Let's find another bee!</Text>
          <BusyBeeButton title="Link Calendars" onPress={() => router.push("/link")} />
        </View>
      )}

      {connectedWith ? (
        <Section title="Combined Calendar">
          {combinedEvents.length ? (
            combinedEvents.slice(0, 6).map((event) => (
              <EventCard
                key={`${event.owner}-${event.id}-${event.start}`}
                event={event}
                owner={event.owner}
                partnerName={partnerProfile?.displayName ?? partnerProfile?.id}
              />
            ))
          ) : (
            <Text style={{ color: "#777" }}>No upcoming events yet.</Text>
          )}
        </Section>
      ) : null}

      {connectedWith ? (
        <Section title={`${partnerProfile?.displayName ?? "Your partner"}'s Calendar`}>
          {partnerEvents.length ? (
            partnerEvents.slice(0, 4).map((event) => <EventCard key={event.id} event={event} />)
          ) : loadingPartner ? (
            <Text>Loading partner events...</Text>
          ) : (
            <Text style={{ color: "#777" }}>No events found.</Text>
          )}
        </Section>
      ) : null}

      {/* <Section title="What do you need?">
        <BusyBeeButton title="Add Event" onPress={() => router.push("/addEvent")} />
        <BusyBeeButton title="View My Calendar" onPress={() => router.push("/(tabs)/calendar")} />
        <BusyBeeButton
          title={connectedWith ? "Manage Linked Calendar" : "Link Calendars"}
          onPress={() => router.push("/link")}
        />
      </Section> */}
      </ScrollView>
    </SafeAreaView>
  )
}
