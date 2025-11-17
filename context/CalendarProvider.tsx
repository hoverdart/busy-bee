import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
  useContext,
  useRef,
} from "react"
import { arrayUnion, doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useFirebase } from "./FirebaseProvider"
import { deleteGoogleCalendarEvent, loadGoogleCalendarEvents } from "../lib/calendar"
import { getValidAccessToken } from "../lib/googleTokens"

export type CalendarEvent = {
  id: string
  title: string
  start: Date | string
  end: Date | string
  source?: "google" | "manual"
}

export type CalendarEventInput = Omit<CalendarEvent, "id">

type CalendarContextValue = {
  events: CalendarEvent[]
  loading: boolean
  addEvent: (event: CalendarEventInput) => Promise<void>
  removeEvent: (event: CalendarEvent) => Promise<void>
}

export const CalendarContext = createContext<CalendarContextValue | undefined>(undefined)

type CalendarProviderProps = {
  children: ReactNode
}

const createEventKey = (event: CalendarEvent) =>
  `${event.id}-${typeof event.start === "string" ? event.start : event.start.toISOString()}-${
    typeof event.end === "string" ? event.end : event.end.toISOString()
  }-${event.title}`

const dedupeEvents = (items: CalendarEvent[]) => {
  const seen = new Set<string>()
  const cleaned: CalendarEvent[] = []
  items.forEach((event) => {
    const key = createEventKey(event)
    if (seen.has(key)) return
    seen.add(key)
    cleaned.push(event.source ? event : { ...event, source: "manual" })
  })
  return cleaned
}

const mapGoogleEvents = (items: any[] = []): CalendarEvent[] =>
  items.map((event) => ({
    id: event.id ?? Math.random().toString(36).slice(2),
    title: event.summary ?? "BusyBee Event",
    start: event.start?.dateTime ?? event.start?.date ?? "",
    end: event.end?.dateTime ?? event.end?.date ?? "",
    source: "google",
  }))

export const CalendarProvider = ({ children }: CalendarProviderProps) => {
  const { user } = useFirebase()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const syncingRef = useRef(false)

  const load = useCallback(async () => {
    if (!user) {
      setEvents([])
      setLoading(false)
      return
    }

    setLoading(true)
    const docRef = doc(db, "users", user.uid)
    const snapshot = await getDoc(docRef)
    if (snapshot.exists()) {
      const data = snapshot.data()
      const storedEvents = (data?.calendarEvents as CalendarEvent[]) ?? []
      const deduped = dedupeEvents(storedEvents)
      if (deduped.length !== storedEvents.length) {
        await setDoc(
          docRef,
          {
            calendarEvents: deduped,
          },
          { merge: true }
        )
      }
      setEvents(deduped)
    } else {
      setEvents([])
    }
    setLoading(false)
  }, [user])

  const addEvent = useCallback(
    async (event: CalendarEventInput) => {
      if (!user) return
      const docRef = doc(db, "users", user.uid)
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        source: event.source ?? "manual",
        ...event,
      }
      await setDoc(
        docRef,
        {
          calendarEvents: arrayUnion(newEvent),
        },
        { merge: true }
      )
      await load()
    },
    [load, user]
  )

  const removeEvent = useCallback(
    async (event: CalendarEvent) => {
      if (!user) return
      const docRef = doc(db, "users", user.uid)
      const updatedEvents = events.filter((existing) => existing.id !== event.id)

      await setDoc(
        docRef,
        {
          calendarEvents: updatedEvents,
        },
        { merge: true }
      )

      const accessToken = await getValidAccessToken()
      if (accessToken && event.id && event.source === "google") {
        try {
          await deleteGoogleCalendarEvent(accessToken, event.id)
        } catch (err) {
          console.warn("Failed to delete Google event", err)
        }
      }

      await load()
    },
    [events, load, user]
  )

  const syncGoogleEvents = useCallback(async () => {
    if (!user || syncingRef.current) return
    const accessToken = await getValidAccessToken()
    if (!accessToken) return
    syncingRef.current = true
    try {
      const googleItems = await loadGoogleCalendarEvents(accessToken)
      const googleEvents = mapGoogleEvents(googleItems)
      const docRef = doc(db, "users", user.uid)
      const snapshot = await getDoc(docRef)
      const existing = snapshot.exists() ? ((snapshot.data()?.calendarEvents as CalendarEvent[]) ?? []) : []
      const manualEvents = existing
        .filter((event) => event.source !== "google")
        .map((event) => (event.source ? event : { ...event, source: "manual" as const }))
      const merged = dedupeEvents([...manualEvents, ...googleEvents])
      await setDoc(
        docRef,
        {
          calendarEvents: merged,
          lastSyncedAt: new Date().toISOString(),
        },
        { merge: true }
      )
      setEvents(merged)
    } catch (err) {
      console.warn("Google calendar sync failed", err)
    } finally {
      syncingRef.current = false
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!user) return
    syncGoogleEvents()
    const interval = setInterval(() => {
      syncGoogleEvents()
    }, 60 * 1000)
    return () => clearInterval(interval)
  }, [syncGoogleEvents, user])

  return (
    <CalendarContext.Provider value={{ events, loading, addEvent, removeEvent }}>
      {children}
    </CalendarContext.Provider>
  )
}

export const useCalendar = () => {
  const context = useContext(CalendarContext)
  if (!context) {
    throw new Error("useCalendar must be used within a CalendarProvider")
  }
  return context
}
