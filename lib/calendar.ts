export type GoogleCalendar = {
  id: string
  summary: string
  primary?: boolean
}

export async function loadGoogleCalendars(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const json = await res.json()
  if (json.error) {
    console.warn("Google Calendar List Error:", json.error)
    return []
  }
  return (json.items as GoogleCalendar[]) ?? []
}

export async function loadGoogleCalendarEvents(accessToken: string, calendarId: string) {
  const timeMin = new Date().toISOString()
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?maxResults=15&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(
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

export async function deleteGoogleCalendarEvent(accessToken: string, calendarId: string, eventId: string) {
  if (!eventId || !calendarId) return
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(
      eventId
    )}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!res.ok && res.status !== 204) {
    const message = await res.text()
    throw new Error(`Google Calendar deletion failed: ${message}`)
  }
}
