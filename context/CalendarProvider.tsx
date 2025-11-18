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
import {
  deleteGoogleCalendarEvent,
  loadGoogleCalendarEvents,
  loadGoogleCalendars,
  type GoogleCalendar,
} from "../lib/calendar"
import { getValidAccessToken } from "../lib/googleTokens"

export type CalendarEvent = {
  id: string
  title: string
  description?: string
  start: Date | string
  end: Date | string
  source?: "google" | "manual"
  calendarId?: string
}

export type CalendarEventInput = Omit<CalendarEvent, "id">

export type UserCalendarSource = {
  id: string
  name: string
  selected: boolean
  primary?: boolean
}

type CalendarContextValue = {
  events: CalendarEvent[]
  loading: boolean
  addEvent: (event: CalendarEventInput) => Promise<void>
  removeEvent: (event: CalendarEvent) => Promise<void>
  calendars: UserCalendarSource[]
  toggleCalendar: (calendarId: string) => Promise<void>
}

export const CalendarContext = createContext<CalendarContextValue | undefined>(undefined)

type CalendarProviderProps = {
  children: ReactNode
}

const toKeyPart = (value: Date | string | undefined) => {
  if (!value) return "unknown"
  if (typeof value === "string") return value
  return value.toISOString()
}

const createEventKey = (event: CalendarEvent) =>
  `${event.id ?? "event"}-${toKeyPart(event.start)}-${toKeyPart(event.end)}-${event.title ?? "untitled"}-${
    event.calendarId ?? "manual"
  }`

const dedupeEvents = (items: CalendarEvent[]) => {
  const seen = new Set<string>()
  const cleaned: CalendarEvent[] = []
  items.forEach((event) => {
    const key = createEventKey(event)
    if (seen.has(key)) return
    seen.add(key)
    cleaned.push({
      ...event,
      source: event.source ?? "manual",
      calendarId: event.calendarId ?? (event.source === "manual" ? "manual" : undefined),
    })
  })
  return cleaned
}

const mapGoogleEvents = (items: any[] = [], calendarId: string): CalendarEvent[] =>
  items.map((event) => ({
    id: event.id ?? Math.random().toString(36).slice(2),
    title: event.summary ?? "BusyBee Event",
    description: event.description ?? "",
    start: event.start?.dateTime ?? event.start?.date ?? "",
    end: event.end?.dateTime ?? event.end?.date ?? "",
    source: "google",
    calendarId,
  }))

const mergeCalendars = (
  existing: UserCalendarSource[],
  googleCalendars: GoogleCalendar[]
): UserCalendarSource[] => {
  const map = new Map(existing.map((cal) => [cal.id, cal]))
  return googleCalendars.map((calendar) => {
    const prev = map.get(calendar.id)
    return {
      id: calendar.id,
      name: calendar.summary ?? calendar.id,
      primary: calendar.primary ?? false,
      selected: prev ? prev.selected : !!calendar.primary,
    }
  })
}

export const CalendarProvider = ({ children }: CalendarProviderProps) => {
  const { user } = useFirebase()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const syncingRef = useRef(false)
  const [calendars, setCalendars] = useState<UserCalendarSource[]>([])

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
      const storedCalendars = (data?.calendars as UserCalendarSource[]) ?? []
      setCalendars(storedCalendars)
      setEvents(deduped)
    } else {
      setEvents([])
      setCalendars([])
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
        calendarId: event.calendarId ?? "manual",
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
      if (accessToken && event.id && event.source === "google" && event.calendarId) {
        try {
          await deleteGoogleCalendarEvent(accessToken, event.calendarId, event.id)
        } catch (err) {
          console.warn("Failed to delete Google event", err)
        }
      }

      await load()
    },
    [events, load, user]
  )

  const syncGoogleEvents = useCallback(
    async (overrideCalendars?: UserCalendarSource[]) => {
    if (!user || syncingRef.current) return
    const accessToken = await getValidAccessToken()
    if (!accessToken) return
    syncingRef.current = true
    try {
      const docRef = doc(db, "users", user.uid)
      const [calendarList, snapshot] = await Promise.all([loadGoogleCalendars(accessToken), getDoc(docRef)])
      const existingCalendars = overrideCalendars ?? ((snapshot.data()?.calendars as UserCalendarSource[]) ?? [])
      const mergedCalendars = mergeCalendars(existingCalendars, calendarList)
      const existing = snapshot.exists() ? ((snapshot.data()?.calendarEvents as CalendarEvent[]) ?? []) : []
      const manualEvents = existing
        .filter((event) => event.source !== "google")
        .map((event) =>
          event.source ? { ...event, calendarId: event.calendarId ?? "manual" } : { ...event, source: "manual", calendarId: "manual" }
        )

      const googleEvents: CalendarEvent[] = []
      const selectedCalendars = mergedCalendars.filter((calendar) => calendar.selected)
      for (const calendar of selectedCalendars) {
        const items = await loadGoogleCalendarEvents(accessToken, calendar.id)
        googleEvents.push(...mapGoogleEvents(items, calendar.id))
      }

      const merged = dedupeEvents([...manualEvents, ...googleEvents])
      await setDoc(
        docRef,
        {
          calendarEvents: merged,
          calendars: mergedCalendars,
          lastSyncedAt: new Date().toISOString(),
        },
        { merge: true }
      )
      setCalendars(mergedCalendars)
      setEvents(merged)
    } catch (err) {
      console.warn("Google calendar sync failed", err)
    } finally {
      syncingRef.current = false
    }
  },
    [user]
  )

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

  const toggleCalendar = useCallback(
    async (calendarId: string) => {
      if (!user) return
      const updated = calendars.map((calendar) =>
        calendar.id === calendarId ? { ...calendar, selected: !calendar.selected } : calendar
      )
      setCalendars(updated)
      const docRef = doc(db, "users", user.uid)
      await setDoc(
        docRef,
        {
          calendars: updated,
        },
        { merge: true }
      )
      await syncGoogleEvents(updated)
    },
    [calendars, syncGoogleEvents, user]
  )

  return (
    <CalendarContext.Provider value={{ events, loading, addEvent, removeEvent, calendars, toggleCalendar }}>
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
