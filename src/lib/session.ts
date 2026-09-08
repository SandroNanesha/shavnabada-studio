import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export interface StudioSession {
  id: string
  email: string
  role: string
  studioId: string
}

export async function requireStudioSession(): Promise<StudioSession> {
  const session = await auth()
  if (!session?.user?.studioId) redirect('/login')
  return {
    id: session.user.id!,
    email: session.user.email!,
    role: (session.user as { role: string }).role,
    studioId: (session.user as { studioId: string }).studioId,
  }
}

export async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user || (session.user as { role: string }).role !== 'super_admin') {
    redirect('/superadmin/login')
  }
  return session.user
}
