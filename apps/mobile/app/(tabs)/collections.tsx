import { useMemo, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Plus,
  Folder,
  Globe,
  Lock,
  Trash2,
  X,
  Flame,
  Lightbulb,
  Star,
  Target,
  Brain,
  TrendingUp,
  Palette,
  Check,
} from 'lucide-react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/theme/colors';
import { useCollectionsStore } from '@/store/collections';
import { useFavoritesStore } from '@/store/favorites';
import { usePromptsStore } from '@/store/prompts';
import type { Collection } from '@repo/shared/types';

const ICON_OPTIONS = [
  { name: 'folder', Icon: Folder },
  { name: 'flame', Icon: Flame },
  { name: 'lightbulb', Icon: Lightbulb },
  { name: 'star', Icon: Star },
  { name: 'target', Icon: Target },
  { name: 'brain', Icon: Brain },
  { name: 'trending', Icon: TrendingUp },
  { name: 'palette', Icon: Palette },
] as const;

const ICON_MAP = Object.fromEntries(ICON_OPTIONS.map(({ name, Icon }) => [name, Icon]));

function getCollectionIcon(iconName: string) {
  return ICON_MAP[iconName] ?? Folder;
}

/**
 * Collections screen — shows user's saved prompt collections.
 */
export default function CollectionsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const { collections, createCollection, deleteCollection } = useCollectionsStore();
  const { likedIds } = useFavoritesStore();
  const { prompts } = usePromptsStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionIcon, setNewCollectionIcon] = useState('folder');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newCollectionName.trim()) return;
    setCreating(true);
    try {
      await createCollection({
        name: newCollectionName.trim(),
        icon: newCollectionIcon,
        ownerId: 'anonymous',
        description: '',
        color: '#FF7A2E',
        promptIds: [],
        isPublic: false,
      });
      setNewCollectionName('');
      setNewCollectionIcon('folder');
      setShowCreateModal(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to create collection');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (col: Collection) => {
    Alert.alert(
      'Delete Collection',
      `Are you sure you want to delete "${col.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCollection(col.id),
        },
      ]
    );
  };

  const renderCollection = ({ item, index }: { item: Collection; index: number }) => {
    const previewPrompts = item.promptIds
      .slice(0, 3)
      .map((id) => prompts.find((p) => p.id === id))
      .filter(Boolean);

    const CollectionIcon = getCollectionIcon(item.icon);

    return (
      <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.85}
        >
          {/* Preview images */}
          <View style={styles.previewRow}>
            {previewPrompts.map((p, i) => (
              <View
                key={i}
                style={[
                  styles.previewThumb,
                  {
                    backgroundColor: colors.muted,
                    marginLeft: i > 0 ? -8 : 0,
                    zIndex: 3 - i,
                  },
                ]}
              >
                <CollectionIcon size={14} color={colors.mutedForeground} />
              </View>
            ))}
            {previewPrompts.length === 0 && (
              <View style={[styles.previewThumb, { backgroundColor: colors.muted }]}>
                <Folder size={20} color={colors.mutedForeground} />
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              {item.isPublic ? (
                <Globe size={12} color="#34C759" />
              ) : (
                <Lock size={12} color={colors.mutedForeground} />
              )}
            </View>
            <Text style={[styles.count, { color: colors.mutedForeground }]}>
              {item.promptCount} prompt{item.promptCount !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Delete */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Collections</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {collections.length} collection{collections.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={18} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      <FlashList
        data={collections}
        renderItem={renderCollection}
        keyExtractor={(item) => item.id}

        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.empty}
          >
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Folder size={32} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No collections yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Create collections to organize your favorite prompts
            </Text>
          </Animated.View>
        }
      />

      {/* Create Collection Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                New Collection
              </Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>
                Icon
              </Text>
              <View style={styles.iconRow}>
                {ICON_OPTIONS.map(({ name, Icon }) => (
                  <TouchableOpacity
                    key={name}
                    style={[
                      styles.iconOption,
                      { backgroundColor: colors.muted },
                      newCollectionIcon === name && {
                        backgroundColor: colors.primary + '20',
                        borderWidth: 2,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setNewCollectionIcon(name)}
                  >
                    <Icon
                      size={20}
                      color={newCollectionIcon === name ? colors.primary : colors.mutedForeground}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>
                Name
              </Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, backgroundColor: colors.muted, borderColor: colors.border }]}
                value={newCollectionName}
                onChangeText={setNewCollectionName}
                placeholder="e.g., Marketing Prompts"
                placeholderTextColor={colors.mutedForeground}
                maxLength={30}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              onPress={handleCreate}
              disabled={!newCollectionName.trim() || creating}
            >
              <Text style={styles.modalBtnText}>
                {creating ? 'Creating...' : 'Create Collection'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  previewRow: {
    flexDirection: 'row',
    marginRight: 12,
  },
  previewThumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '600', flex: 1 },
  count: { fontSize: 12, marginTop: 2 },
  deleteBtn: { padding: 8 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', maxWidth: 240, lineHeight: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalBody: { marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  iconRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  modalBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
