export async function loadGoogleCalendarEvents(accessToken: string) {
  const timeMin = new Date().toISOString()
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=15&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(
      timeMin
    )}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  const json = await res.json()

  if (json.error) {
    console.warn("Google Calendar Error:", json.error)
    return []
  }

  return json.items || []
}
