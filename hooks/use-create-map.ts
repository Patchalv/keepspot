import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { EdgeFunctionError } from '@/lib/edge-function-error';

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
        let message = 'Failed to create map';
        let code: string | null = null;
        if (error.context instanceof Response) {
          try {
            const body = await error.context.json();
            if (typeof body.error === 'string') {
              message = body.error;
            } else if (typeof body.message === 'string') {
              message = body.message;
            }
            if (typeof body.code === 'string') {
              code = body.code;
            }
          } catch {
            // Response body wasn't valid JSON
          }
        }
        throw new EdgeFunctionError(message, code);
      }

      return data as CreateMapResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maps'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
