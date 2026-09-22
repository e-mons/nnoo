import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useBusiness } from '../../../contexts/BusinessContext';
import { supabase } from '../../../lib/supabase';
import { BUSINESS_ROLES, ROLE_LABELS, BusinessRole } from '@nnoo/validation';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Badge } from '../../../components/Badge';

export default function TeamScreen() {
  const router = useRouter();
  const { activeBusiness } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'admins' | 'staff' | 'pending'>('all');

  // Edit Member Modal State
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [editRole, setEditRole] = useState<BusinessRole>('read_only');
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active');
  const [savingMember, setSavingMember] = useState(false);

  const loadData = useCallback(async () => {
    if (!activeBusiness) return;

    try {
      setLoading(true);
      const [membersResponse, invitesResponse] = await Promise.all([
        supabase
          .from('team_members_view')
          .select('*')
          .eq('business_id', activeBusiness.id)
          .order('joined_at', { ascending: true }),
        supabase
          .from('business_invitations')
          .select('*')
          .eq('business_id', activeBusiness.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
      ]);

      if (membersResponse.error) throw membersResponse.error;
      if (invitesResponse.error) throw invitesResponse.error;

      setTeamMembers(membersResponse.data || []);
      setInvitations(invitesResponse.data || []);
    } catch (err: any) {
      console.error('Error loading team data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeBusiness]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;
    setSavingMember(true);
    try {
      const { error } = await supabase.rpc('update_business_membership', {
        p_membership_id: selectedMember.membership_id,
        p_role: editRole,
        p_status: editStatus,
      });

      if (error) throw error;

      setSelectedMember(null);
      Alert.alert('Success', 'Team member permissions updated successfully!');
      loadData();
    } catch (err: any) {
      console.error('Error updating member:', err);
      Alert.alert('Update Failed', err.message || 'Could not update team member.');
    } finally {
      setSavingMember(false);
    }
  };

  const handleRevokeInvite = async (invitationId: string) => {
    Alert.alert('Revoke Invitation', 'Are you sure you want to revoke this pending invitation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.rpc('revoke_business_invitation', {
              p_invitation_id: invitationId,
            });
            if (error) throw error;
            Alert.alert('Revoked', 'The invitation has been cancelled.');
            loadData();
          } catch (err: any) {
            console.error('Error revoking invite:', err);
            Alert.alert('Error', err.message || 'Could not revoke invitation.');
          }
        },
      },
    ]);
  };

  const handleShareInvite = async (invite: any) => {
    try {
      await Share.share({
        message: `You have been invited to join ${activeBusiness?.name} as ${ROLE_LABELS[invite.role as keyof typeof ROLE_LABELS] || invite.role} on NNOO. Check your email or download the app to accept.`,
        title: `Team Invitation: ${activeBusiness?.name}`,
      });
    } catch (err) {
      console.error('Error sharing invite:', err);
    }
  };

  const openEditModal = (member: any) => {
    setSelectedMember(member);
    setEditRole(member.role as BusinessRole);
    setEditStatus(member.membership_status as 'active' | 'suspended');
  };

  if (!activeBusiness) return null;

  const filteredMembers = teamMembers.filter((m) => {
    const name = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase();
    const email = (m.email || '').toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch = name.includes(q) || email.includes(q);

    if (filter === 'admins') {
      return matchesSearch && ['owner', 'business_admin', 'manager'].includes(m.role);
    }
    if (filter === 'staff') {
      return matchesSearch && !['owner', 'business_admin', 'manager'].includes(m.role);
    }
    if (filter === 'pending') {
      return false; // Pending invites handled separately
    }
    return matchesSearch;
  });

  const filteredInvitations = invitations.filter((inv) => {
    const email = (inv.email || '').toLowerCase();
    const q = search.toLowerCase();
    return email.includes(q);
  });

  const showMembers = filter !== 'pending';
  const showInvites = filter === 'all' || filter === 'pending';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Team & Roles</Text>
          <Text style={styles.subtext}>Manage members and access permissions</Text>
        </View>
      </View>

      {/* Search & Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search member by name or email..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {[
            { key: 'all', label: `All (${teamMembers.length})` },
            { key: 'admins', label: 'Admins & Mgrs' },
            { key: 'staff', label: 'Staff' },
            { key: 'pending', label: `Pending (${invitations.length})` },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key as any)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === f.key && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#B8F25C" />
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#B8F25C"
            />
          }
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {/* Active Members Section */}
              {showMembers && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Team Members ({filteredMembers.length})
                  </Text>

                  {filteredMembers.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Feather name="users" size={32} color="rgba(255,255,255,0.2)" />
                      <Text style={styles.emptyText}>No matching members found.</Text>
                    </View>
                  ) : (
                    filteredMembers.map((member) => {
                      const isOwner = member.role === 'owner';
                      const isSuspended = member.membership_status === 'suspended';
                      const fullName =
                        `${member.first_name || ''} ${member.last_name || ''}`.trim() ||
                        'Team Member';

                      return (
                        <TouchableOpacity
                          key={member.membership_id}
                          style={styles.card}
                          onPress={() => !isOwner && openEditModal(member)}
                          activeOpacity={isOwner ? 1 : 0.75}
                        >
                          <View style={styles.cardHeader}>
                            <View style={styles.memberAvatar}>
                              <Text style={styles.memberInitials}>
                                {(member.first_name?.[0] || member.email?.[0] || 'U').toUpperCase()}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <View style={styles.nameRow}>
                                <Text style={styles.memberName}>{fullName}</Text>
                                <Badge
                                  label={isSuspended ? 'Suspended' : 'Active'}
                                  variant={isSuspended ? 'error' : 'success'}
                                />
                              </View>
                              <Text style={styles.memberEmail}>{member.email}</Text>
                            </View>
                          </View>

                          <View style={styles.cardFooter}>
                            <View style={styles.roleBadge}>
                              <Feather name="shield" size={13} color="#B8F25C" />
                              <Text style={styles.roleBadgeText}>
                                {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS] || member.role}
                              </Text>
                            </View>

                            {!isOwner && (
                              <View style={styles.editPrompt}>
                                <Text style={styles.editPromptText}>Manage</Text>
                                <Feather name="chevron-right" size={14} color="#B8F25C" />
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}

              {/* Pending Invitations Section */}
              {showInvites && filteredInvitations.length > 0 && (
                <View style={[styles.section, { marginTop: 24 }]}>
                  <Text style={styles.sectionTitle}>
                    Pending Invitations ({filteredInvitations.length})
                  </Text>

                  {filteredInvitations.map((invite) => (
                    <View key={invite.id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View style={[styles.memberAvatar, { backgroundColor: 'rgba(255, 152, 0, 0.15)' }]}>
                          <Feather name="mail" size={18} color="#FF9800" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.memberName}>{invite.email}</Text>
                          <Text style={styles.memberRoleLabel}>
                            Invited as: {ROLE_LABELS[invite.role as keyof typeof ROLE_LABELS] || invite.role}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.inviteActionsRow}>
                        <TouchableOpacity
                          style={styles.shareInviteBtn}
                          onPress={() => handleShareInvite(invite)}
                          activeOpacity={0.8}
                        >
                          <Feather name="share-2" size={14} color="#B8F25C" />
                          <Text style={styles.shareInviteBtnText}>Share Invite</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.revokeButton}
                          onPress={() => handleRevokeInvite(invite.id)}
                          activeOpacity={0.8}
                        >
                          <Feather name="trash-2" size={14} color="#FF4D4D" />
                          <Text style={styles.revokeButtonText}>Revoke</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          }
        />
      )}

      {/* Floating Action Button (+ Invite) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/team/invite' as any)}
        activeOpacity={0.8}
      >
        <Feather name="user-plus" size={26} color="#0A1C16" />
      </TouchableOpacity>

      {/* Manage Member Modal */}
      <Modal visible={!!selectedMember} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Team Member</Text>
              <TouchableOpacity onPress={() => setSelectedMember(null)}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            {selectedMember && (
              <>
                <Text style={styles.modalMemberName}>
                  {selectedMember.first_name} {selectedMember.last_name}
                </Text>
                <Text style={styles.modalMemberEmail}>{selectedMember.email}</Text>

                <Text style={styles.inputLabel}>Access Role</Text>
                <View style={styles.rolesGrid}>
                  {BUSINESS_ROLES.filter((r) => r !== 'owner').map((role) => {
                    const isSelected = editRole === role;
                    return (
                      <TouchableOpacity
                        key={role}
                        style={[styles.roleOption, isSelected && styles.roleOptionActive]}
                        onPress={() => setEditRole(role)}
                      >
                        <Text
                          style={[
                            styles.roleOptionText,
                            isSelected && styles.roleOptionTextActive,
                          ]}
                        >
                          {ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.inputLabel}>Account Status</Text>
                <View style={styles.statusToggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      editStatus === 'active' && styles.statusToggleBtnActive,
                    ]}
                    onPress={() => setEditStatus('active')}
                  >
                    <Text
                      style={[
                        styles.statusToggleText,
                        editStatus === 'active' && styles.statusToggleTextActive,
                      ]}
                    >
                      Active
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      editStatus === 'suspended' && styles.statusToggleBtnSuspended,
                    ]}
                    onPress={() => setEditStatus('suspended')}
                  >
                    <Text
                      style={[
                        styles.statusToggleText,
                        editStatus === 'suspended' && styles.statusToggleTextSuspended,
                      ]}
                    >
                      Suspended
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.saveMemberBtn, savingMember && styles.submitButtonDisabled]}
                  onPress={handleUpdateMember}
                  disabled={savingMember}
                >
                  {savingMember ? (
                    <ActivityIndicator color="#0A1C16" />
                  ) : (
                    <Text style={styles.saveMemberBtnText}>Save Permissions</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06130E' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: { marginRight: 14, padding: 6 },
  title: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtext: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  searchSection: { paddingHorizontal: 20, marginTop: 8, marginBottom: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 10,
  },
  searchInput: { flex: 1, color: '#FFF', fontSize: 14 },

  filterRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  filterChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: { backgroundColor: '#B8F25C', borderColor: '#B8F25C' },
  filterChipText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' },
  filterChipTextActive: { color: '#0A1C16' },

  listContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: 12 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitials: { color: '#B8F25C', fontSize: 17, fontWeight: '900' },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memberName: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  memberEmail: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  memberRoleLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(184, 242, 92, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  roleBadgeText: { color: '#B8F25C', fontSize: 12, fontWeight: '800' },
  editPrompt: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editPromptText: { color: '#B8F25C', fontSize: 13, fontWeight: '700' },

  inviteActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  shareInviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(184, 242, 92, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  shareInviteBtnText: { color: '#B8F25C', fontSize: 13, fontWeight: '800' },
  revokeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  revokeButtonText: { color: '#FF4D4D', fontSize: 13, fontWeight: '800' },

  emptyCard: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
  },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },

  fab: {
    position: 'absolute',
    bottom: 96,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#B8F25C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#0A1C16',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  modalMemberName: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 2 },
  modalMemberEmail: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 18 },

  inputLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '700', marginBottom: 10 },
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  roleOption: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  roleOptionActive: { backgroundColor: '#B8F25C', borderColor: '#B8F25C' },
  roleOptionText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  roleOptionTextActive: { color: '#0A1C16' },

  statusToggleRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statusToggleBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusToggleBtnActive: { backgroundColor: 'rgba(184, 242, 92, 0.15)', borderColor: '#B8F25C' },
  statusToggleBtnSuspended: { backgroundColor: 'rgba(255, 77, 77, 0.15)', borderColor: '#FF4D4D' },
  statusToggleText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  statusToggleTextActive: { color: '#B8F25C' },
  statusToggleTextSuspended: { color: '#FF4D4D' },

  saveMemberBtn: {
    backgroundColor: '#B8F25C',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveMemberBtnText: { color: '#0A1C16', fontWeight: '900', fontSize: 15 },
  submitButtonDisabled: { opacity: 0.5 },
});
