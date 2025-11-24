import { useEffect, useMemo, useState } from "react"
import { ScrollView, View, Text, TouchableOpacity } from "react-native"
import tw from "twrnc"
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

const ensureArray = <T,>(value: T | T[] | null | undefined): T[] => {
  if (!value) return []
  return Array.isArray(value) ? value.filter(Boolean) : [value]
}

const toDate = (value: Date | string) => (value instanceof Date ? value : new Date(value))

const isUpcoming = (event: CalendarEvent) => toDate(event.end).getTime() >= Date.now()

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
  <View style={tw`mt-6`}>
    <Text style={tw`text-xl font-bold mb-2`}>{title}</Text>
    {children}
  </View>
)

type CombinedEvent = CalendarEvent & { owner: "me" | "partner"; partnerId?: string }

type DropdownOption = { label: string; value: string }

type DropdownProps = {
  label?: string
  value: string
  options: DropdownOption[]
  placeholder?: string
  onSelect: (value: string) => void
  containerStyle?: object
}

const Dropdown = ({ label, value, options, placeholder = "Select", onSelect, containerStyle }: DropdownProps) => {
  const [open, setOpen] = useState(false)
  const selectedLabel = options.find((option) => option.value === value)?.label ?? placeholder

  return (
    <View style={[tw`w-full mt-3`, containerStyle]}>
      {label ? <Text style={tw`mb-1 text-[#6A5E50] font-semibold`}>{label}</Text> : null}
      <TouchableOpacity
        onPress={() => setOpen((prev) => !prev)}
        style={tw`border border-[#E0C9A6] rounded-xl py-[10px] px-3 bg-white`}
      >
        <Text style={tw`text-[#3A2E1F] font-semibold`}>{selectedLabel}</Text>
      </TouchableOpacity>
      {open ? (
        <View
          style={tw`mt-[6px] border border-[#E0C9A6] rounded-xl bg-[#fffdf6]`}
        >
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                onSelect(option.value)
                setOpen(false)
              }}
              style={tw`py-[10px] px-3`}
            >
              <Text
                style={[
                  tw`font-semibold`,
                  { color: option.value === value ? "#C07B00" : "#3A2E1F" },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  )
}

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
      style={tw`p-3 rounded-xl border border-[#eee] mb-3 bg-white`}
    >
      {owner ? (
        <View
          style={[
            tw`self-start px-2 py-[2px] rounded-full mb-1`,
            owner === "me" ? tw`bg-[#f5a524]` : tw`bg-[#7da4f7]`,
          ]}
        >
          <Text style={tw`text-white font-bold text-xs`}>
            {owner === "me" ? "You" : partnerName ?? "Linked calendar"}
          </Text>
        </View>
      ) : null}
      <Text style={tw`font-semibold mb-1`}>{event.title}</Text>
      <Text style={tw`text-[#555]`}>{formatRange(start, end)}</Text>
    </View>
  )
}

export default function HomeTab() {
  const router = useRouter()
  const { user } = useFirebase()
  const { events } = useCalendar()
  const [connections, setConnections] = useState<PartnerProfile[]>([])
  const [connectedWith, setConnectedWith] = useState<string[]>([])
  const [loadingPartner, setLoadingPartner] = useState(true)
  const [selectedStatusPartnerId, setSelectedStatusPartnerId] = useState<string | null>(null)
  const [selectedCalendarFilter, setSelectedCalendarFilter] = useState<"all" | string>("all")

  useEffect(() => {
    const loadPartner = async () => {
      setLoadingPartner(true)
      try {
        if (!user) {
          setConnections([])
          setConnectedWith([])
          setSelectedStatusPartnerId(null)
          setSelectedCalendarFilter("all")
          return
        }

        const userDoc = await getDoc(doc(db, "users", user.uid))
        const connectedIds = userDoc.exists()
          ? ensureArray<string>(userDoc.data().connectedWith as string[] | string | null | undefined)
          : []
        setConnectedWith(connectedIds)

        if (!connectedIds.length) {
          setConnections([])
          setSelectedStatusPartnerId(null)
          setSelectedCalendarFilter("all")
          return
        }

        const partnerProfiles = await Promise.all(
          connectedIds.map(async (partnerId) => {
            const partnerSnap = await getDoc(doc(db, "users", partnerId))
            if (!partnerSnap.exists()) return null
            const data = partnerSnap.data()
            return {
              id: partnerId,
              displayName: (data.displayName as string | undefined) ?? (data.email as string | undefined) ?? partnerId,
              calendarEvents: (data.calendarEvents as CalendarEvent[]) ?? [],
            }
          })
        )

        const filteredProfiles = partnerProfiles.filter(Boolean) as PartnerProfile[]
        setConnections(filteredProfiles)

        setSelectedStatusPartnerId((current) => {
          if (current && filteredProfiles.some((partner) => partner.id === current)) return current
          return filteredProfiles[0]?.id ?? null
        })

        setSelectedCalendarFilter((current) => {
          if (current === "all") return filteredProfiles.length ? current : "all"
          if (filteredProfiles.some((partner) => partner.id === current)) return current
          return filteredProfiles[0]?.id ?? "all"
        })
      } finally {
        setLoadingPartner(false)
      }
    }

    loadPartner()
  }, [events, user])

  const statusPartner = useMemo(
    () => connections.find((partner) => partner.id === selectedStatusPartnerId) ?? connections[0] ?? null,
    [connections, selectedStatusPartnerId]
  )
  const partnerEvents = (statusPartner?.calendarEvents ?? []).filter(isUpcoming)
  const hasConnections = connectedWith.length > 0

  const combinedEvents = useMemo(() => {
    const now = Date.now()
    const seen = new Set<string>()
    const tagged: CombinedEvent[] = []
    events.forEach((event) => {
      if (!isUpcoming(event)) return
      const key = `${event.id}-${event.start}-${event.end}`
      if (seen.has(key)) return
      seen.add(key)
      tagged.push({ ...event, owner: "me" })
    })

    const partnersForCombined =
      selectedCalendarFilter === "all"
        ? connections
        : connections.filter((partner) => partner.id === selectedCalendarFilter)

    partnersForCombined.forEach((partner) => {
      partner.calendarEvents.forEach((event) => {
        if (!isUpcoming(event)) return
        const key = `${event.id}-${event.start}-${event.end}`
        if (seen.has(key)) return
        seen.add(key)
        tagged.push({ ...event, owner: "partner", partnerId: partner.id })
      })
    })

    return tagged
      .filter((event) => toDate(event.end).getTime() >= now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }, [connections, events, selectedCalendarFilter])

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
        label: `${statusPartner?.displayName ?? statusPartner?.id ?? "Linked person"} is currently in: `,
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
        label: `${statusPartner?.displayName ?? statusPartner?.id ?? "Linked person"} is currently free!`,
        value: `Next: ${upcoming.title}`,
        freeAt: `busy at ${upcoming.startDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
      }
    }
    return {
      label: `${statusPartner?.displayName ?? statusPartner?.id ?? "Linked person"} is free`,
      value: "No more events today",
      freeAt: "Enjoy the downtime!",
    }
  }, [partnerEvents, statusPartner])

  return (
    <SafeAreaView style={tw`flex-1 bg-[#fdf6e6]`}>
      <ScrollView contentContainerStyle={tw`px-6 pb-18`} contentInsetAdjustmentBehavior="automatic">
        <View style={tw`bg-white p-5 rounded-2xl shadow-sm elevation-1`}>
          <Text style={tw`text-2xl font-bold text-[#3e2e16]`}>
            Welcome Back{user?.displayName ? `, ${user.displayName}` : ""}!
          </Text>
          <Text style={tw`mt-1 text-[#666]`}>
            Keep your hive synced and see what's coming up for you and your busy bee.
          </Text>
        </View>

        {connections.length > 1 ? (
          <Dropdown
          label="Show status for"
          value={selectedStatusPartnerId ?? connections[0]?.id ?? ""}
          options={connections.map((partner) => ({
            value: partner.id,
            label: partner.displayName ?? partner.id,
          }))}
          placeholder="Choose connection"
            onSelect={(value) => setSelectedStatusPartnerId(value)}
          />
        ) : null}

        {hasConnections ? (
          <View
            style={[
              tw`mt-6 p-5 rounded-2xl bg-[#FFF8EF] border border-[#F2D3A0]`,
              tw`shadow-md elevation-3`,
            ]}
          >
            {partnerStatus ? (
              <>
                <View style={tw`self-start bg-[#FFE5BA] px-3 py-1 rounded-xl mb-2`}>
                  <Text style={tw`font-semibold text-[#9A6A25]`}>{partnerStatus.label}</Text>
                </View>

                <Text style={tw`font-extrabold text-[22px] text-[#3A2E1F]`}>
                  {partnerStatus.value}
                </Text>

                <Text style={tw`mt-[6px] text-[15px] text-[#6A5E50]`}>
                  They'll be <Text style={tw`font-semibold`}>{partnerStatus.freeAt}</Text>.
                </Text>
              </>
            ) : (
              <Text style={tw`text-base text-[#444]`}>
                We're fetching this connection's calendar...
              </Text>
            )}
          </View>
        ) : (
          <View style={tw`mt-5 p-4 rounded-xl border border-[#f5d8a2] bg-[#fffaf0]`}>
            <Text style={tw`text-lg font-semibold text-[#3e2e16]`}>Nobody connected yet.</Text>
            <Text style={tw`mt-1 text-[#6f6146]`}>Let's find another bee!</Text>
            <BusyBeeButton title="Link Calendars" onPress={() => router.push("/link")} />
          </View>
        )}

        {hasConnections ? (
          <View style={tw`mt-6`}>
            <View style={tw`flex-row justify-between items-center`}>
              <Text style={tw`text-xl font-bold`}>Combined Calendar</Text>
              {connections.length > 1 ? (
                <Dropdown
                  value={selectedCalendarFilter}
                  options={[
                    { label: "All Connections", value: "all" },
                    ...connections.map((partner) => ({
                      label: partner.displayName ?? partner.id,
                      value: partner.id,
                    })),
                  ]}
                  onSelect={(value) => setSelectedCalendarFilter(value === "all" ? "all" : value)}
                  containerStyle={tw`w-[180px] mt-0`}
                />
              ) : null}
            </View>
            {combinedEvents.length ? (
              combinedEvents.slice(0, 6).map((event) => (
                <EventCard
                  key={`${event.owner}-${event.id}-${event.start}`}
                  event={event}
                  owner={event.owner}
                  partnerName={
                    event.owner === "partner"
                      ? connections.find((partner) => partner.id === event.partnerId)?.displayName ?? event.partnerId
                      : undefined
                  }
                />
              ))
            ) : (
              <Text style={tw`text-[#777]`}>No upcoming events yet.</Text>
            )}
          </View>
        ) : null}

        {hasConnections ? (
        <Section title={`${statusPartner?.displayName ?? "Linked person"}'s Calendar`}>
            {partnerEvents.length ? (
              partnerEvents.slice(0, 4).map((event) => <EventCard key={event.id} event={event} />)
            ) : loadingPartner ? (
              <Text>Loading connection events...</Text>
            ) : (
              <Text style={tw`text-[#777]`}>No events found.</Text>
            )}
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}
