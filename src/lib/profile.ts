import { createClient } from "./supabase/client";

export interface UserProfile {
  user_id: string;
  full_name: string;
  avatar_url: string;
  payment_link: string;
  cash_rain_emoji: string;
  theme: "dark" | "light" | "colorblind" | "neon";
  language: "en" | "fr" | "es" | "ar" | "it" | "de";
}

const defaults: Omit<UserProfile, "user_id"> = {
  full_name: "",
  avatar_url: "",
  payment_link: "",
  cash_rain_emoji: "💵",
  theme: "dark",
  language: "en",
};

async function getUserId(): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export async function getProfile(): Promise<UserProfile> {
  const supabase = createClient();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    // Profile doesn't exist yet — create one
    const newProfile: UserProfile = { user_id: userId, ...defaults };
    await supabase.from("user_profiles").upsert(newProfile);
    return newProfile;
  }

  return {
    user_id: data.user_id,
    full_name: data.full_name ?? "",
    avatar_url: data.avatar_url ?? "",
    payment_link: data.payment_link ?? "",
    cash_rain_emoji: data.cash_rain_emoji ?? "💵",
    theme: data.theme ?? "dark",
    language: data.language ?? "en",
  };
}

export async function saveProfile(updates: Partial<Omit<UserProfile, "user_id">>): Promise<void> {
  const supabase = createClient();
  const userId = await getUserId();

  const { error } = await supabase
    .from("user_profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to save profile:", error);
    throw new Error(error.message);
  }
}

export async function uploadAvatar(file: File): Promise<string> {
  const supabase = createClient();
  const userId = await getUserId();
  const ext = file.name.split(".").pop();
  const path = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });

  if (error) {
    console.error("Failed to upload avatar:", error);
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}
