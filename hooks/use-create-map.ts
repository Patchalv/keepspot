import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface CreateMapInput {
  name: string;
}

interface CreateMapResult {
  mapId: string;
  mapName: string;
}

export function useCreateMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMapInput): Promise<CreateMapResult> => {
      const { data, error } = await supabase.functions.invoke('create-map', {
        body: input,
      });

      if (error) {
        const context = error.context as Record<string, unknown> | undefined;
        const message =
          typeof context?.error === 'string'
            ? context.error
            : 'Failed to create map';
        throw new Error(message);
      }

      return data as CreateMapResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maps'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
