import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createServerSupabase } from '@/lib/supabase-server';
import { PAGE_KEYS } from '@/types/database';

const COOKIE_NAME = 'auth_session';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing AUTH_SECRET or JWT_SECRET');
  return new TextEncoder().encode(secret);
}

async function getSession(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { user_id?: number; role?: string };
  } catch {
    return null;
  }
}

/** GET: list all roles with their page_keys (admin only). */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user_id || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createServerSupabase();
    const { data: roles, error: rolesError } = await supabase
      .from('role')
      .select('role_id, name, description, created_at, updated_at')
      .order('name');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }

    const { data: rolePages, error: pagesError } = await supabase
      .from('role_page')
      .select('role_id, page_key');

    if (pagesError) {
      console.error('Error fetching role_page:', pagesError);
      return NextResponse.json({ error: 'Failed to fetch role pages' }, { status: 500 });
    }

    const pagesByRole = (rolePages ?? []).reduce(
      (acc: Record<number, string[]>, row: { role_id: number; page_key: string }) => {
        if (!acc[row.role_id]) acc[row.role_id] = [];
        acc[row.role_id].push(row.page_key);
        return acc;
      },
      {}
    );

    const result = (roles ?? []).map((r: { role_id: number; name: string; description: string | null; created_at?: string; updated_at?: string }) => ({
      role_id: r.role_id,
      name: r.name,
      description: r.description,
      page_keys: pagesByRole[r.role_id] ?? [],
      created_at: r.created_at ?? null,
      updated_at: r.updated_at ?? null,
    }));

    return NextResponse.json({ roles: result });
  } catch (err) {
    console.error('Roles GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST: create role with name, description, page_keys (admin only). */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user_id || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string | null;
      page_keys?: string[];
    };

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'Role name is required.' }, { status: 400 });
    }

    const validKeys = new Set(PAGE_KEYS);
    const page_keys = Array.isArray(body.page_keys)
      ? body.page_keys.filter((k) => validKeys.has(k as (typeof PAGE_KEYS)[number]))
      : [];

    const supabase = createServerSupabase();

    const { data: role, error: insertError } = await supabase
      .from('role')
      .insert({ name, description: body.description ?? null } as never)
      .select('role_id, name, description, created_at')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'A role with this name already exists.' }, { status: 409 });
      }
      console.error('Create role error:', insertError);
      return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
    }

    const roleId = (role as { role_id: number }).role_id;
    if (page_keys.length > 0) {
      const { error: pagesError } = await supabase.from('role_page').insert(
        page_keys.map((page_key) => ({ role_id: roleId, page_key })) as never
      );
      if (pagesError) {
        console.error('Insert role_page error:', pagesError);
      }
    }

    return NextResponse.json({
      role: {
        role_id: roleId,
        name: (role as { name: string }).name,
        description: (role as { description: string | null }).description,
        page_keys,
        created_at: (role as { created_at?: string }).created_at ?? null,
      },
    });
  } catch (err) {
    console.error('Roles POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
