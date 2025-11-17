import { createContext, type ReactNode, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "../lib/firebase"

type FirebaseContextValue = {
  user: User | null
  loading: boolean
}

export const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined)

type FirebaseProviderProps = {
  children: ReactNode
}

export const FirebaseProvider = ({ children }: FirebaseProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  return <FirebaseContext.Provider value={{ user, loading }}>{children}</FirebaseContext.Provider>
}

export const useFirebase = () => {
  const ctx = useContext(FirebaseContext)
  if (!ctx) {
    throw new Error("useFirebase must be used inside FirebaseProvider")
  }
  return ctx
}
