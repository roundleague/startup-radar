import type { Contact } from './generator.js'

const APOLLO_API_KEY = process.env.APOLLO_API_KEY

interface ApolloPersonResult {
  name: string
  title: string | null
  email: string | null
  sanitized_phone: string | null
  linkedin_url: string | null
}

export async function lookupContact(domain: string): Promise<Contact | null> {
  if (!APOLLO_API_KEY || domain.startsWith('http')) return null

  try {
    const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': APOLLO_API_KEY },
      body: JSON.stringify({
        q_organization_domains: [domain],
        person_titles: ['CEO', 'Founder', 'Co-Founder', 'Chief Executive Officer', 'Co-CEO'],
        page: 1,
        per_page: 1,
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) return null

    const json = await res.json() as { people?: ApolloPersonResult[] }
    const person = json.people?.[0]
    if (!person) return null

    return {
      name: person.name,
      title: person.title ?? null,
      email: person.email ?? null,
      phone: person.sanitized_phone ?? null,
      linkedin_url: person.linkedin_url ?? null,
    }
  } catch {
    return null
  }
}
