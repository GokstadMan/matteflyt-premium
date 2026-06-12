import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  parts: unknown[];
};

export const loadChatMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StoredMessage[]> => {
    const { data, error } = await context.supabase
      .from("chat_messages")
      .select("id, role, parts, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id,
      role: row.role as "user" | "assistant",
      parts: (Array.isArray(row.parts) ? row.parts : []) as unknown[],
    }));
  });

export const clearChatMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
