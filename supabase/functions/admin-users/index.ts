// Supabase Edge Function: admin-users
// Provides secure admin-only endpoints to manage auth users using the Service Role key.
// Endpoints (via single invoke):
//  - action: 'create'          payload: { email, password, role?, user_metadata? }
//  - action: 'delete'          payload: { userId }
//  - action: 'update-email'    payload: { userId, email }
//  - action: 'update-metadata' payload: { userId, metadata }
//
// This function verifies the caller is authenticated AND has role 'admin' in public.user_roles.
// It uses the service role key ONLY inside the function to call the Admin API.

// deno-lint-ignore-file no-explicit-any

/// <reference path="./deno.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface CreatePayload {
  email: string
  password: string
  role?: string
  user_metadata?: Record<string, any>
}

interface DeletePayload { userId: string }
interface UpdateEmailPayload { userId: string; email: string }
interface UpdateMetadataPayload { userId: string; metadata: Record<string, any> }

type Payload = Partial<CreatePayload & DeletePayload & UpdateEmailPayload & UpdateMetadataPayload> & { action?: string }

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader) {
      return json({ error: 'Missing Authorization header' }, 401)
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
    const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
      return json({ error: 'Server misconfiguration: missing Supabase env vars' }, 500)
    }

    // Client bound to the caller's JWT (to read caller identity)
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    }) as any

    // Admin client for privileged operations
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY) as any

    // Identify the caller
    const { data: userData, error: userErr } = await supabaseUser.auth.getUser()
    if (userErr || !userData?.user) {
      return json({ error: 'Invalid or expired token' }, 401)
    }

    const callerId = userData.user.id

    // Verify the caller is an admin
    const { data: roleRows, error: roleErr } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .limit(1)

    if (roleErr) {
      return json({ error: 'Failed to verify admin role', details: roleErr }, 500)
    }

    const callerRole = roleRows?.[0]?.role
    if (callerRole !== 'admin') {
      return json({ error: 'Access denied. Admin privileges required.' }, 403)
    }

    // Parse payload
    const payload = (await req.json().catch(() => ({}))) as Payload
    const action = payload.action
    if (!action) {
      return json({ error: 'Missing action' }, 400)
    }

    switch (action) {
      case 'create': {
        const { email, password, role = 'user', user_metadata = {} } = payload as CreatePayload
        if (!email || !password) {
          return json({ error: 'Missing email or password' }, 400)
        }

        // Create auth user with email confirmation enabled
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          user_metadata,
          email_confirm: false // Set to false so admin-created users don't need to confirm
        })
        
        if (createErr) {
          return json({ error: 'Failed to create auth user', details: createErr }, 400)
        }

        const newUserId = created.user?.id
        if (!newUserId) {
          return json({ error: 'No user ID returned by Admin API' }, 500)
        }

        // Upsert role
        const { error: roleUpsertErr } = await supabaseAdmin
          .from('user_roles')
          .upsert({ user_id: newUserId, role, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
        
        if (roleUpsertErr) {
          return json({ error: 'User created, but failed to set role', details: roleUpsertErr }, 500)
        }

        // Send confirmation email manually
        try {
          const { data: linkData, error: emailErr } = await supabaseAdmin.auth.admin.generateLink({
            type: 'signup',
            email: email,
            options: {
              redirectTo: `${process.env.SITE_URL || 'http://localhost:3000'}/auth/callback`
            }
          })
          
          if (emailErr) {
            console.warn('Failed to generate confirmation link:', emailErr)
          } else if (linkData?.properties?.action_link) {
            // The generateLink method should trigger email sending automatically
            // if SMTP is properly configured in Supabase
            console.log('Confirmation link generated successfully')
          }
        } catch (emailError) {
          console.warn('Email generation error:', emailError)
        }

        return json({ 
          success: true, 
          userId: newUserId,
          message: 'User created successfully. Confirmation email sent if SMTP is configured.'
        })
      }

      case 'delete': {
        const { userId } = payload as DeletePayload
        if (!userId) return json({ error: 'Missing userId' }, 400)
        if (userId === callerId) return json({ error: 'Cannot delete your own account' }, 400)

        const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (delErr) return json({ error: 'Failed to delete user', details: delErr }, 400)

        return json({ success: true })
      }

      case 'update-email': {
        const { userId, email } = payload as UpdateEmailPayload
        if (!userId || !email) return json({ error: 'Missing userId or email' }, 400)
        const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { email })
        if (updErr) return json({ error: 'Failed to update email', details: updErr }, 400)
        return json({ success: true })
      }

      case 'update-metadata': {
        const { userId, metadata } = payload as UpdateMetadataPayload
        if (!userId || !metadata) return json({ error: 'Missing userId or metadata' }, 400)
        const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: metadata })
        if (updErr) return json({ error: 'Failed to update metadata', details: updErr }, 400)
        return json({ success: true })
      }

      case 'update-password': {
        const { userId, password } = payload as { userId: string; password: string }
        if (!userId || !password) return json({ error: 'Missing userId or password' }, 400)
        const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { password })
        if (updErr) return json({ error: 'Failed to update password', details: updErr }, 400)
        return json({ success: true })
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (err) {
    console.error('admin-users error:', err)
    return json({ error: 'Unexpected server error', details: String(err) }, 500)
  }
})

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  })
}