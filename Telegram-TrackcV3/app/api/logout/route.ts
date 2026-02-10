import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('session_id')?.value

    if (sessionId) {
      const supabase = await createClient()
      
      // Supprimer la session de la base de données
      await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)
    }

    const res = NextResponse.json({ success: true })

    // Supprimer le cookie de session
    res.cookies.set('session_id', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    })

    return res
  } catch (err) {
    console.error('LOGOUT ERROR:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
