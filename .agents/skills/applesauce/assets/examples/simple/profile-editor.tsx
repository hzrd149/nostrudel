/**
 * Edit and update your Nostr profile with a live preview of changes
 * @tags nip-05, nip-24, profile, forms, actions
 * @related simple/event-deletion
 */
import { ProxySigner } from "applesauce-accounts";
import { ActionRunner } from "applesauce-actions";
import { UpdateProfile } from "applesauce-actions/actions";
import { castUser, User } from "applesauce-common/casts";
import { defined, EventStore } from "applesauce-core";
import { ProfileContent } from "applesauce-core/helpers/profile";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import type { ISigner } from "applesauce-signers";
import { useEffect, useMemo, useState } from "react";
import { BehaviorSubject, map } from "rxjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useWatch } from "react-hook-form";
import { z } from "zod";
import LoginView from "../../components/login-view";

// Setup application state
const signer$ = new BehaviorSubject<ISigner | null>(null);
const pubkey$ = new BehaviorSubject<string | null>(null);
const user$ = pubkey$.pipe(map((p) => (p ? castUser(p, eventStore) : undefined)));

// Setup event store and relay pool
const eventStore = new EventStore();
const pool = new RelayPool();
const actions = new ActionRunner(eventStore, new ProxySigner(signer$.pipe(defined())), async (event, relays) => {
  if (relays && relays.length > 0) {
    await pool.publish(relays, event);
  } else {
    // Fallback to default relays if none provided
    await pool.publish(["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"], event);
  }
});

// Create unified event loader for the store
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
  extraRelays: ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"],
});

// Zod schema for profile content
const birthdaySchema = z
  .object({
    year: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
    month: z.number().int().min(1).max(12).optional(),
    day: z.number().int().min(1).max(31).optional(),
  })
  .optional();

const profileSchema = z.object({
  name: z.string().optional(),
  display_name: z.string().optional(),
  about: z.string().optional(),
  picture: z
    .string()
    .refine((val) => !val || z.string().url().safeParse(val).success, { message: "Must be a valid URL" })
    .optional(),
  banner: z
    .string()
    .refine((val) => !val || z.string().url().safeParse(val).success, { message: "Must be a valid URL" })
    .optional(),
  website: z
    .string()
    .refine((val) => !val || z.string().url().safeParse(val).success, { message: "Must be a valid URL" })
    .optional(),
  lud16: z
    .string()
    .refine((val) => !val || z.string().email().safeParse(val).success, { message: "Must be a valid email address" })
    .optional(),
  lud06: z
    .string()
    .refine((val) => !val || z.string().email().safeParse(val).success, { message: "Must be a valid email address" })
    .optional(),
  nip05: z.string().optional(),
  bot: z.boolean().optional(),
  birthday: birthdaySchema,
  languages: z.array(z.string()).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

function ProfileEditor({ user }: { user: User }) {
  const profile = use$(() => user.profile$, [user.pubkey]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Convert profile to form data, handling undefined values
  const defaultValues = useMemo<ProfileFormData>(() => {
    if (!profile) {
      return {
        name: "",
        display_name: "",
        about: "",
        picture: "",
        banner: "",
        website: "",
        lud16: "",
        lud06: "",
        nip05: "",
        bot: false,
        birthday: undefined,
        languages: [],
      };
    }

    return {
      name: profile.metadata.name || "",
      display_name: profile.metadata.display_name || profile.metadata.displayName || "",
      about: profile.metadata.about || "",
      picture: profile.metadata.picture || profile.metadata.image || "",
      banner: profile.metadata.banner || "",
      website: profile.metadata.website || "",
      lud16: profile.metadata.lud16 || "",
      lud06: profile.metadata.lud06 || "",
      nip05: profile.metadata.nip05 || "",
      bot: profile.metadata.bot || false,
      birthday: profile.metadata.birthday,
      languages: profile.metadata.languages || [],
    };
  }, [profile]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues,
    mode: "onChange",
  });

  // Watch form values for live preview
  const watchedValues = useWatch({ control });

  // Reset form when profile loads
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Convert form data to ProfileContent, removing empty strings
      const profileUpdate: Partial<ProfileContent> = {};

      if (data.name) profileUpdate.name = data.name;
      if (data.display_name) profileUpdate.display_name = data.display_name;
      if (data.about) profileUpdate.about = data.about;
      if (data.picture) profileUpdate.picture = data.picture;
      if (data.banner) profileUpdate.banner = data.banner;
      if (data.website) profileUpdate.website = data.website;
      if (data.lud16) profileUpdate.lud16 = data.lud16;
      if (data.lud06) profileUpdate.lud06 = data.lud06;
      if (data.nip05) profileUpdate.nip05 = data.nip05;
      if (data.bot !== undefined) profileUpdate.bot = data.bot;
      if (data.birthday) profileUpdate.birthday = data.birthday;
      if (data.languages && data.languages.length > 0) profileUpdate.languages = data.languages;

      await actions.run(UpdateProfile, profileUpdate);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Get current values for preview
  const currentBanner = watchedValues.banner || profile?.metadata.banner || "";
  const currentPicture = watchedValues.picture || profile?.metadata.picture || profile?.metadata.image || "";
  const currentDisplayName =
    watchedValues.display_name || profile?.metadata.display_name || profile?.metadata.displayName || "";
  const currentName = watchedValues.name || profile?.metadata.name || "";
  const currentWebsite = watchedValues.website || profile?.metadata.website || "";
  const currentNip05 = watchedValues.nip05 || profile?.metadata.nip05 || "";
  const currentLud16 = watchedValues.lud16 || profile?.metadata.lud16 || "";
  const currentLud06 = watchedValues.lud06 || profile?.metadata.lud06 || "";

  return (
    <div className="container mx-auto my-8 px-4 max-w-4xl">
      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-4">
          <span>Profile updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Profile Preview Layout */}
        <div className="bg-base-100 rounded-lg overflow-hidden">
          {/* Banner */}
          <div className="relative h-48 bg-base-200">
            {currentBanner ? (
              <img src={currentBanner} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-base-300" />
            )}
            <div className="absolute bottom-0 left-6 transform translate-y-1/2">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-full bg-base-100 p-1">
                {currentPicture ? (
                  <img src={currentPicture} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-base-300 flex items-center justify-center text-4xl">
                    {currentDisplayName?.[0]?.toUpperCase() || currentName?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
            </div>
            {/* Banner URL input */}
            <div className="absolute top-2 right-2">
              <Controller
                name="banner"
                control={control}
                render={({ field }) => (
                  <input
                    type="url"
                    {...field}
                    placeholder="Banner URL"
                    className={`input input-bordered bg-base-100/90 backdrop-blur-sm w-48 ${
                      errors.banner ? "input-error" : ""
                    }`}
                  />
                )}
              />
            </div>
          </div>

          {/* Profile Header */}
          <div className="pt-20 px-6 pb-4">
            {/* Avatar URL input */}
            <div className="mb-4">
              <label className="text-base-content/60 mb-1 block">Avatar URL</label>
              <Controller
                name="picture"
                control={control}
                render={({ field }) => (
                  <input
                    type="url"
                    {...field}
                    placeholder="https://example.com/avatar.jpg"
                    className={`input input-ghost w-full ${errors.picture ? "input-error" : ""}`}
                  />
                )}
              />
              {errors.picture && <span className="text-error">{errors.picture.message}</span>}
            </div>

            {/* Display Name and Name as Title */}
            <div className="mb-4">
              <Controller
                name="display_name"
                control={control}
                render={({ field }) => (
                  <input
                    type="text"
                    {...field}
                    placeholder="Display Name"
                    className={`text-3xl font-bold bg-transparent border-none p-0 w-full focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 -ml-2 ${
                      errors.display_name ? "text-error" : ""
                    }`}
                  />
                )}
              />
              {errors.display_name && <span className="text-error">{errors.display_name.message}</span>}
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <input
                    type="text"
                    {...field}
                    placeholder="Name"
                    className={`text-xl text-base-content/70 bg-transparent border-none p-0 w-full focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 -ml-2 mt-1 ${
                      errors.name ? "text-error" : ""
                    }`}
                  />
                )}
              />
              {errors.name && <span className="text-error">{errors.name.message}</span>}
            </div>

            {/* About */}
            <div className="mb-4">
              <Controller
                name="about"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    placeholder="Tell us about yourself"
                    className={`textarea textarea-ghost w-full min-h-24 p-0 focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 -ml-2 resize-none ${
                      errors.about ? "textarea-error" : ""
                    }`}
                  />
                )}
              />
              {errors.about && <span className="text-error">{errors.about.message}</span>}
            </div>

            {/* Contact Details */}
            <div className="space-y-2 mb-4">
              {currentWebsite && (
                <div>
                  <a href={currentWebsite} target="_blank" rel="noopener noreferrer" className="link link-primary">
                    {currentWebsite}
                  </a>
                </div>
              )}
              {currentNip05 && <div className="text-base-content/70">{currentNip05}</div>}
              {currentLud16 && <div className="text-base-content/70">⚡ {currentLud16}</div>}
              {currentLud06 && <div className="text-base-content/70">⚡ {currentLud06}</div>}
            </div>

            {/* Additional Fields */}
            <div className="space-y-3 border-t border-base-300 pt-4">
              <div>
                <label className="text-base-content/60 mb-1 block">Website</label>
                <Controller
                  name="website"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="url"
                      {...field}
                      placeholder="https://example.com"
                      className={`input input-ghost w-full ${errors.website ? "input-error" : ""}`}
                    />
                  )}
                />
                {errors.website && <span className="text-error">{errors.website.message}</span>}
              </div>

              <div>
                <label className="text-base-content/60 mb-1 block">NIP-05</label>
                <Controller
                  name="nip05"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      {...field}
                      placeholder="_@domain.com or user@domain.com"
                      className={`input input-ghost w-full ${errors.nip05 ? "input-error" : ""}`}
                    />
                  )}
                />
                {errors.nip05 && <span className="text-error">{errors.nip05.message}</span>}
              </div>

              <div>
                <label className="text-base-content/60 mb-1 block">Lightning Address (LUD-16)</label>
                <Controller
                  name="lud16"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="email"
                      {...field}
                      placeholder="user@domain.com"
                      className={`input input-ghost w-full ${errors.lud16 ? "input-error" : ""}`}
                    />
                  )}
                />
                {errors.lud16 && <span className="text-error">{errors.lud16.message}</span>}
              </div>

              <div>
                <label className="text-base-content/60 mb-1 block">Lightning Address (LUD-06)</label>
                <Controller
                  name="lud06"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="email"
                      {...field}
                      placeholder="user@domain.com"
                      className={`input input-ghost w-full ${errors.lud06 ? "input-error" : ""}`}
                    />
                  )}
                />
                {errors.lud06 && <span className="text-error">{errors.lud06.message}</span>}
              </div>

              <div className="flex items-center gap-2">
                <Controller
                  name="bot"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value || false}
                      onChange={field.onChange}
                      className="checkbox checkbox-primary"
                    />
                  )}
                />
                <label>Bot Account</label>
              </div>

              <div>
                <label className="text-base-content/60 mb-1 block">Languages</label>
                <Controller
                  name="languages"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      value={field.value?.join(", ") || ""}
                      onChange={(e) => {
                        const languages = e.target.value
                          .split(",")
                          .map((lang) => lang.trim())
                          .filter((lang) => lang.length > 0);
                        field.onChange(languages.length > 0 ? languages : []);
                      }}
                      placeholder="en, ja, es-AR"
                      className="input input-ghost w-full"
                    />
                  )}
                />
              </div>

              <div>
                <label className="text-base-content/60 mb-1 block">Birthday</label>
                <div className="grid grid-cols-3 gap-2">
                  <Controller
                    name="birthday.year"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const year = e.target.value ? parseInt(e.target.value, 10) : undefined;
                          field.onChange(year);
                        }}
                        placeholder="Year"
                        min="1900"
                        max={new Date().getFullYear()}
                        className="input input-ghost"
                      />
                    )}
                  />
                  <Controller
                    name="birthday.month"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const month = e.target.value ? parseInt(e.target.value, 10) : undefined;
                          field.onChange(month);
                        }}
                        placeholder="Month"
                        min="1"
                        max="12"
                        className="input input-ghost"
                      />
                    )}
                  />
                  <Controller
                    name="birthday.day"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const day = e.target.value ? parseInt(e.target.value, 10) : undefined;
                          field.onChange(day);
                        }}
                        placeholder="Day"
                        min="1"
                        max="31"
                        className="input input-ghost"
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6">
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={saving || !isDirty}>
            {saving ? (
              <>
                <span className="loading loading-spinner" />
                Saving...
              </>
            ) : (
              "Save Profile"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ProfileEditorExample() {
  const signer = use$(signer$);
  const pubkey = use$(pubkey$);
  const user = use$(user$);

  if (!signer || !pubkey || !user) {
    return (
      <LoginView
        onLogin={(newSigner, newPubkey) => {
          signer$.next(newSigner);
          pubkey$.next(newPubkey);
        }}
      />
    );
  }

  return <ProfileEditor user={user} />;
}
