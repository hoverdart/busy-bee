import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "./firebase"

const JOIN_CODE_LENGTH = 5
const JOIN_CODE_ATTEMPTS = 10
const JOIN_CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

const createCandidate = () => {
  let code = ""
  for (let i = 0; i < JOIN_CODE_LENGTH; i += 1) {
    const index = Math.floor(Math.random() * JOIN_CODE_CHARSET.length)
    code += JOIN_CODE_CHARSET[index]
  }
  return code
}

export const generateUniqueJoinCode = async () => {
  for (let attempt = 0; attempt < JOIN_CODE_ATTEMPTS; attempt += 1) {
    const candidate = createCandidate()
    const snapshot = await getDocs(query(collection(db, "users"), where("joinCode", "==", candidate)))
    if (snapshot.empty) {
      return candidate
    }
  }
  throw new Error("Could not generate a unique join code. Please try again.")
}
