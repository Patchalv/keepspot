import { forwardRef, useCallback, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';

interface InviteCreatorProps {
  mapId: string;
  onCreateInvite: (input: {
    mapId: string;
    role: 'editor';
    expiresInDays: number | null;
    maxUses: number | null;
  }) => void;
  isPending: boolean;
}

const EXPIRY_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: 'No expiry', value: null },
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
];

const MAX_USES_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: 'Unlimited', value: null },
  { label: '1 use', value: 1 },
  { label: '5 uses', value: 5 },
  { label: '10 uses', value: 10 },
];

export const InviteCreator = forwardRef<BottomSheetModal, InviteCreatorProps>(
  function InviteCreator({ mapId, onCreateInvite, isPending }, ref) {
    const [expiresInDays, setExpiresInDays] = useState<number | null>(null);
    const [maxUses, setMaxUses] = useState<number | null>(null);

    const handleCreate = useCallback(() => {
      onCreateInvite({
        mapId,
        role: 'editor',
        expiresInDays,
        maxUses,
      });
    }, [mapId, expiresInDays, maxUses, onCreateInvite]);

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['50%']}
        backgroundStyle={{ backgroundColor: '#FFFFFF', borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40 }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ padding: 20, paddingTop: 4 }}
        >
          {/* Header */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#111827',
              marginBottom: 20,
            }}
          >
            Create Invite
          </Text>

          {/* Expiry */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#6B7280',
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Expires
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 20,
            }}
          >
            {EXPIRY_OPTIONS.map((option) => {
              const isSelected = expiresInDays === option.value;
              return (
                <Pressable
                  key={option.label}
                  onPress={() => setExpiresInDays(option.value)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: isSelected ? '#3B82F6' : '#F3F4F6',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: isSelected ? '#FFFFFF' : '#374151',
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Max Uses */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#6B7280',
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Max Uses
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 24,
            }}
          >
            {MAX_USES_OPTIONS.map((option) => {
              const isSelected = maxUses === option.value;
              return (
                <Pressable
                  key={option.label}
                  onPress={() => setMaxUses(option.value)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: isSelected ? '#3B82F6' : '#F3F4F6',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: isSelected ? '#FFFFFF' : '#374151',
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Create Button */}
          <Pressable
            onPress={handleCreate}
            disabled={isPending}
            style={{
              backgroundColor: '#3B82F6',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text
              style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}
            >
              {isPending ? 'Creating...' : 'Create & Share'}
            </Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);
