/**
 * Create date-based and time-based calendar events (NIP-52) with location and details
 * @tags calendar, events, nip-52
 * @related calendar/timeline, calendar/map
 */
import { DateBasedCalendarEventFactory, TimeBasedCalendarEventFactory } from "applesauce-common/factories";
import { RelayPool } from "applesauce-relay";
import { ExtensionSigner } from "applesauce-signers";
import { useState } from "react";
import { Control, Controller, FieldErrors, FieldPath, useFieldArray, useForm } from "react-hook-form";

// Global state management
const signer = new ExtensionSigner();
const pool = new RelayPool();

// Form Field Components
interface FormFieldProps<T extends Record<string, any>> {
  name: FieldPath<T>;
  control: Control<T>;
  errors: FieldErrors<T>;
  label: string;
  required?: boolean;
  rules?: any;
  children: (field: any) => React.ReactElement;
}

function FormField<T extends Record<string, any>>({
  name,
  control,
  errors,
  label,
  required = false,
  rules,
  children,
}: FormFieldProps<T>) {
  const error = errors[name];

  return (
    <div className="flex flex-col">
      <label className="label">
        {label} {required && "*"}
      </label>
      <Controller name={name} control={control} rules={rules} render={({ field }) => children(field)} />
      {error && <span className="text-error text-sm">{String(error.message || "Invalid value")}</span>}
    </div>
  );
}

interface TextInputProps {
  field: any;
  placeholder?: string;
  type?: "text" | "url" | "date" | "datetime-local";
  error?: boolean;
  min?: string;
}

function TextInput({ field, placeholder, type = "text", error, min }: TextInputProps) {
  return (
    <input
      {...field}
      type={type}
      className={`input input-bordered w-full ${error ? "input-error" : ""}`}
      placeholder={placeholder}
      min={min}
    />
  );
}

function TextArea({ field, placeholder, error }: { field: any; placeholder?: string; error?: boolean }) {
  return (
    <textarea
      {...field}
      className={`textarea textarea-bordered h-32 w-full ${error ? "textarea-error" : ""}`}
      placeholder={placeholder}
    />
  );
}

interface FieldArrayProps<T extends Record<string, any>> {
  name: string;
  label: string;
  control: Control<T>;
  fields: any[];
  append: (value: any) => void;
  remove: (index: number) => void;
  placeholder: string;
  type?: "text" | "url";
  validation?: any;
  required?: boolean;
}

function FieldArray<T extends Record<string, any>>({
  name,
  label,
  control,
  fields,
  append,
  remove,
  placeholder,
  type = "text",
  validation,
  required = false,
}: FieldArrayProps<T>) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">
        {label} {required && "*"}
      </legend>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2 mb-2">
          <Controller
            name={`${name}.${index}.value` as any}
            control={control}
            rules={validation}
            render={({ field: inputField, fieldState }) => (
              <input
                {...inputField}
                type={type}
                className={`input input-bordered flex-1 ${fieldState.error ? "input-error" : ""}`}
                placeholder={placeholder}
              />
            )}
          />
          {fields.length > 1 && (
            <button type="button" onClick={() => remove(index)} className="btn btn-error btn-square btn-outline">
              X
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={() => append({ value: "" })} className="btn btn-outline btn-primary ms-auto">
        Add {label.slice(0, -1)}
      </button>
    </fieldset>
  );
}

// Calendar Event Form Types
type CalendarEventFormData = {
  eventType: "date" | "time";
  title: string;
  description: string;
  summary?: string;
  image?: string;
  startDate?: string;
  endDate?: string;
  startDateTime?: string;
  endDateTime?: string;
  timezone?: string;
  locations: { value: string }[];
  referenceLinks: { value: string }[];
  relays: { value: string }[];
  geohash?: string;
};

function buildDateBasedCalendarEvent(data: CalendarEventFormData): DateBasedCalendarEventFactory {
  let factory = DateBasedCalendarEventFactory.create(data.title).description(data.description);
  if (data.summary) factory = factory.summary(data.summary);
  if (data.image) factory = factory.image(data.image);
  if (data.startDate) factory = factory.startDate(data.startDate);
  if (data.endDate) factory = factory.endDate(data.endDate);
  if (data.geohash) factory = factory.geohash(data.geohash);
  for (const loc of data.locations.filter((l) => l.value.trim())) factory = factory.location(loc.value.trim());
  for (const link of data.referenceLinks.filter((l) => l.value.trim()))
    factory = factory.referenceLink(link.value.trim());
  return factory;
}

function buildTimeBasedCalendarEvent(data: CalendarEventFormData): TimeBasedCalendarEventFactory {
  let factory = TimeBasedCalendarEventFactory.create(data.title).description(data.description);
  if (data.summary) factory = factory.summary(data.summary);
  if (data.image) factory = factory.image(data.image);
  if (data.startDateTime) factory = factory.startTime(new Date(data.startDateTime), data.timezone);
  if (data.endDateTime) factory = factory.endTime(new Date(data.endDateTime), data.timezone);
  if (data.geohash) factory = factory.geohash(data.geohash);
  for (const loc of data.locations.filter((l) => l.value.trim())) factory = factory.location(loc.value.trim());
  for (const link of data.referenceLinks.filter((l) => l.value.trim()))
    factory = factory.referenceLink(link.value.trim());
  return factory;
}

// Form component for creating calendar events
function CalendarEventForm() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [noSignerWarning, setNoSignerWarning] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CalendarEventFormData>({
    defaultValues: {
      eventType: "time",
      title: "",
      description: "",
      summary: "",
      image: "",
      startDate: "",
      endDate: "",
      startDateTime: "",
      endDateTime: "",
      timezone: "",
      locations: [{ value: "" }],
      referenceLinks: [{ value: "" }],
      relays: [{ value: "wss://relay.damus.io/" }],
      geohash: "",
    },
  });

  const {
    fields: locationFields,
    append: appendLocation,
    remove: removeLocation,
  } = useFieldArray({
    control,
    name: "locations",
  });

  const {
    fields: referenceLinkFields,
    append: appendReferenceLink,
    remove: removeReferenceLink,
  } = useFieldArray({
    control,
    name: "referenceLinks",
  });

  const {
    fields: relayFields,
    append: appendRelay,
    remove: removeRelay,
  } = useFieldArray({
    control,
    name: "relays",
  });

  const eventType = watch("eventType");
  const startDate = watch("startDate");
  const startDateTime = watch("startDateTime");

  const onSubmit = async (data: CalendarEventFormData) => {
    try {
      setCreating(true);
      setError(null);
      setNoSignerWarning(false);

      // Check for window.nostr signer
      if (typeof window === "undefined" || !(window as any).nostr) {
        setNoSignerWarning(true);
        setError("No Nostr extension found. Please install a Nostr browser extension like Alby or nos2x.");
        return;
      }

      // Validate required fields based on event type
      if (data.eventType === "date" && !data.startDate) {
        setError("Start date is required for date-based events");
        return;
      }

      if (data.eventType === "time" && !data.startDateTime) {
        setError("Start time is required for time-based events");
        return;
      }

      // Validate at least one relay
      const validRelays = data.relays.filter((relay) => relay.value.trim());
      if (validRelays.length === 0) {
        setError("At least one relay is required");
        return;
      }

      // Build and sign the event using the appropriate factory
      const builder = data.eventType === "date" ? buildDateBasedCalendarEvent(data) : buildTimeBasedCalendarEvent(data);
      const signed = await builder.sign(signer);

      // Publish to all specified relays
      const relayUrls = validRelays.map((relay) => relay.value.trim());
      await pool.publish(relayUrls, signed);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        reset();
      }, 3000);
    } catch (err) {
      console.error("Failed to create calendar event:", err);
      setError(err instanceof Error ? err.message : "Failed to create calendar event");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">NIP-52 Calendar Event Creator</h1>
        <p className="text-lg text-base-content/70">
          Create date-based or time-based calendar events following the NIP-52 specification
        </p>
      </div>

      {success && <div className="alert alert-success mb-6">Calendar event created successfully!</div>}

      {error && (
        <div className={`alert mb-6 ${noSignerWarning ? "alert-warning" : "alert-error"}`}>
          {error}
          {noSignerWarning && (
            <div className="mt-2 text-sm">
              Popular extensions:{" "}
              <a href="https://getalby.com" target="_blank" rel="noopener noreferrer" className="link">
                Alby
              </a>
              ,{" "}
              <a href="https://github.com/fiatjaf/nos2x" target="_blank" rel="noopener noreferrer" className="link">
                nos2x
              </a>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Event Type */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Event Type</span>
              </label>
              <div className="flex gap-6">
                <Controller
                  name="eventType"
                  control={control}
                  render={({ field }) => (
                    <>
                      <label className="label cursor-pointer">
                        <input
                          type="radio"
                          className="radio radio-primary"
                          checked={field.value === "time"}
                          onChange={() => field.onChange("time")}
                        />
                        <span className="label-text ml-2">Time-based</span>
                      </label>
                      <label className="label cursor-pointer">
                        <input
                          type="radio"
                          className="radio radio-primary"
                          checked={field.value === "date"}
                          onChange={() => field.onChange("date")}
                        />
                        <span className="label-text ml-2">Date-based</span>
                      </label>
                    </>
                  )}
                />
              </div>
            </div>

            <FormField
              name="title"
              control={control}
              errors={errors}
              label="Title"
              required
              rules={{ required: "Title is required" }}
            >
              {(field) => <TextInput field={field} placeholder="Event title" error={!!errors.title} />}
            </FormField>

            <FormField
              name="description"
              control={control}
              errors={errors}
              label="Description"
              required
              rules={{ required: "Description is required" }}
            >
              {(field) => <TextArea field={field} placeholder="Event description" error={!!errors.description} />}
            </FormField>

            <FormField name="summary" control={control} errors={errors} label="Summary">
              {(field) => <TextInput field={field} placeholder="Brief summary" />}
            </FormField>

            <FormField
              name="image"
              control={control}
              errors={errors}
              label="Image URL"
              rules={{
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: "Please enter a valid URL",
                },
              }}
            >
              {(field) => (
                <TextInput
                  field={field}
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  error={!!errors.image}
                />
              )}
            </FormField>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Date/Time Fields */}
            {eventType === "date" ? (
              <>
                <FormField
                  name="startDate"
                  control={control}
                  errors={errors}
                  label="Start Date"
                  required
                  rules={{ required: "Start date is required for date-based events" }}
                >
                  {(field) => <TextInput field={field} type="date" error={!!errors.startDate} />}
                </FormField>

                <FormField name="endDate" control={control} errors={errors} label="End Date">
                  {(field) => <TextInput field={field} type="date" min={startDate} />}
                </FormField>
              </>
            ) : (
              <>
                <FormField
                  name="startDateTime"
                  control={control}
                  errors={errors}
                  label="Start Time"
                  required
                  rules={{ required: "Start time is required for time-based events" }}
                >
                  {(field) => <TextInput field={field} type="datetime-local" error={!!errors.startDateTime} />}
                </FormField>

                <FormField name="endDateTime" control={control} errors={errors} label="End Time">
                  {(field) => <TextInput field={field} type="datetime-local" min={startDateTime} />}
                </FormField>

                <FormField name="timezone" control={control} errors={errors} label="Timezone">
                  {(field) => <TextInput field={field} placeholder="America/New_York" />}
                </FormField>
              </>
            )}

            <FormField name="geohash" control={control} errors={errors} label="Geohash">
              {(field) => <TextInput field={field} placeholder="9q8yyk8yuzvw" />}
            </FormField>
          </div>
        </div>

        {/* Full Width Fields */}
        <div className="space-y-6">
          <FieldArray
            name="relays"
            label="Publish to relays"
            control={control}
            fields={relayFields}
            append={appendRelay}
            remove={removeRelay}
            placeholder="wss://relay.example.com"
            type="url"
            required
            validation={{
              pattern: {
                value: /^wss?:\/\/.+/,
                message: "Please enter a valid WebSocket URL",
              },
            }}
          />

          <FieldArray
            name="locations"
            label="Locations"
            control={control}
            fields={locationFields}
            append={appendLocation}
            remove={removeLocation}
            placeholder="Location, address, or coordinates"
            type="text"
          />

          <FieldArray
            name="referenceLinks"
            label="Reference Links"
            control={control}
            fields={referenceLinkFields}
            append={appendReferenceLink}
            remove={removeReferenceLink}
            placeholder="https://example.com"
            type="url"
            validation={{
              pattern: {
                value: /^https?:\/\/.+/,
                message: "Please enter a valid URL",
              },
            }}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mt-8">
          <button type="submit" className="btn btn-primary btn-lg min-w-48" disabled={creating}>
            {creating ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Creating Event...
              </>
            ) : (
              "Create Calendar Event"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Main app component
function App() {
  return (
    <div className="min-h-screen bg-base-200">
      <CalendarEventForm />
    </div>
  );
}

export default App;
