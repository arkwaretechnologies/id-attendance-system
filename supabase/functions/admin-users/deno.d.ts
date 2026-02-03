// Minimal types for Deno Edge Function (IDE/TypeScript when Deno types URL is not loaded)
declare namespace Deno {
  function serve(handler: (req: Request) => Promise<Response> | Response): void;
  namespace env {
    function get(key: string): string | undefined;
  }
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: { global?: { headers?: Record<string, string> } }
  ): any;
}
