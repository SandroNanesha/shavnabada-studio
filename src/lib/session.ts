import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export interface StudioSession {
  id: string
  email: string
  role: string
  studioId: string
}

export async function requireStudioSession(): Promise<StudioSession> {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role

  if (role === 'super_admin') {
    const cookieStore = await cookies()
    const studioId = cookieStore.get('sa_studio_id')?.value
    if (!studioId) redirect('/superadmin')
    return {
      id: session!.user!.id!,
      email: session!.user!.email!,
      role: 'super_admin',
      studioId,
    }
  }

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
