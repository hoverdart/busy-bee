import { createContext, type ReactNode, useCallback, useEffect, useState, useContext } from "react"
import { arrayUnion, doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useFirebase } from "./FirebaseProvider"

export type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
}

export type CalendarEventInput = Omit<CalendarEvent, "id">

type CalendarContextValue = {
  events: CalendarEvent[]
  loading: boolean
  addEvent: (event: CalendarEventInput) => Promise<void>
}

export const CalendarContext = createContext<CalendarContextValue | undefined>(undefined)

type CalendarProviderProps = {
  children: ReactNode
}

export const CalendarProvider = ({ children }: CalendarProviderProps) => {
  const { user } = useFirebase()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

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
      setEvents((data?.calendarEvents as CalendarEvent[]) ?? [])
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

  useEffect(() => {
    load()
  }, [load])

  return (
    <CalendarContext.Provider value={{ events, loading, addEvent }}>
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
