import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { EdgeFunctionError } from '@/lib/edge-function-error';

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const { error } = await supabase.functions.invoke('delete-account');

      if (error) {
        let message = 'Failed to delete account';
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
    },
  });
}
