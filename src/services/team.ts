import { supabase } from '../lib/supabase';
import type { TeamMember, TeamMemberInsert, TeamMemberUpdate, TeamRole, Json } from '../types/database';

const sanitizeSearchQuery = (query: string): string => {
  return query.trim().slice(0, 100).replace(/[%_\\]/g, '\\$&');
};

export interface TeamFilters {
  studioId?: string;
  role?: TeamRole;
  isActive?: boolean;
  search?: string;
}

export const teamService = {
  async getAll(filters?: TeamFilters): Promise<TeamMember[]> {
    let query = supabase.from('team_members').select('*');

    if (filters?.studioId) {
      query = query.eq('studio_id', filters.studioId);
    }
    if (filters?.role) {
      query = query.eq('role', filters.role);
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters?.search) {
      const s = sanitizeSearchQuery(filters.search);
      query = query.or(`name.ilike.%${s}%,email.ilike.%${s}%,job_title.ilike.%${s}%`);
    }

    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<TeamMember | null> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as TeamMember;
  },

  async create(teamMember: TeamMemberInsert): Promise<TeamMember> {
    const { data, error } = await supabase
      .from('team_members')
      .insert(teamMember)
      .select()
      .single();
    if (error) throw error;
    return data as TeamMember;
  },

  async update(id: string, teamMember: TeamMemberUpdate): Promise<TeamMember> {
    const { data, error } = await supabase
      .from('team_members')
      .update(teamMember)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as TeamMember;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('team_members').delete().eq('id', id);
    if (error) throw error;
  },

  async getByStudioId(studioId: string): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('studio_id', studioId)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data as TeamMember[]) || [];
  },

  async getActiveByStudioId(studioId: string): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('studio_id', studioId)
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data as TeamMember[]) || [];
  },

  async getByUserId(userId: string): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return (data as TeamMember[]) || [];
  },

  async getByStudioAndUser(studioId: string, userId: string): Promise<TeamMember | null> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('studio_id', studioId)
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as TeamMember | null;
  },

  async getByRole(studioId: string, role: TeamRole): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('studio_id', studioId)
      .eq('role', role)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data as TeamMember[]) || [];
  },

  async getByEmail(studioId: string, email: string): Promise<TeamMember | null> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('studio_id', studioId)
      .eq('email', email)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as TeamMember | null;
  },

  async search(studioId: string, query: string): Promise<TeamMember[]> {
    const s = sanitizeSearchQuery(query);
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('studio_id', studioId)
      .or(`name.ilike.%${s}%,email.ilike.%${s}%,job_title.ilike.%${s}%`)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data as TeamMember[]) || [];
  },

  async updateRole(id: string, role: TeamRole): Promise<TeamMember> {
    const { data, error } = await supabase
      .from('team_members')
      .update({ role })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as TeamMember;
  },

  async updatePermissions(id: string, permissions: Json): Promise<TeamMember> {
    const { data, error } = await supabase
      .from('team_members')
      .update({ permissions })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as TeamMember;
  },

  async deactivate(id: string): Promise<TeamMember> {
    const { data, error } = await supabase
      .from('team_members')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as TeamMember;
  },

  async activate(id: string): Promise<TeamMember> {
    const { data, error } = await supabase
      .from('team_members')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as TeamMember;
  },

  async getOwner(studioId: string): Promise<TeamMember | null> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('studio_id', studioId)
      .eq('role', 'owner')
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as TeamMember | null;
  },

  async getAdmins(studioId: string): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('studio_id', studioId)
      .in('role', ['owner', 'admin'])
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data as TeamMember[]) || [];
  },

  async hasPermission(memberId: string, permission: string): Promise<boolean> {
    const member = await this.getById(memberId);
    if (!member) return false;

    // Owners and admins have all permissions
    if (member.role === 'owner' || member.role === 'admin') {
      return true;
    }

    const permissions = member.permissions as Record<string, boolean> | null;
    if (!permissions) return false;

    return permissions[permission] === true;
  },
};
