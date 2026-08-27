"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState, useSyncExternalStore } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import type { SiteContent } from "@/app/lib/content-types";
import { buildSiteContentChangeSummary } from "@/app/lib/site-content-change-summary";
import { LearningResourcesEditor } from "./learning-resources-editor";
import { OpportunitiesEditor } from "./opportunities-editor";

type AdminDashboardProps = {
  initialContent: SiteContent;
  publishingDisabled: boolean;
  admin: {
    email: string;
    googleProfileName: string | null;
    displayName: string;
  };
};

type AdminGalleryGroup = {
  key: string;
  eventId: string | undefined;
  title: string;
  images: SiteContent["gallery"];
};

const buttonClass =
  "px-3 py-2 rounded-lg border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600";
const primaryButtonClass =
  "px-4 py-2 rounded-lg bg-[#E11D2E] text-white hover:bg-red-700 transition-colors shadow-sm shadow-red-900/20 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600";
const destructiveLinkClass =
  "text-sm font-medium text-red-600 hover:text-red-700 hover:underline underline-offset-2";

const sectionClass =
  "admin-section space-y-5";
const EVENT_TYPE_OPTIONS = ["Workshop", "Social", "Panel", "Info Session"];
const EVENT_STATUS_OPTIONS = ["auto", "upcoming", "past"] as const;
const GRADUATION_YEAR_OPTIONS = Array.from({ length: 9 }, (_, i) => String(2024 + i));
const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${minute}`;
});
const subscribeToNothing = () => () => {};

export function AdminDashboard({ initialContent, admin, publishingDisabled }: AdminDashboardProps) {
  const [content, setContent] = useState<SiteContent>(initialContent);
  // The server snapshot keeps hydration stable; the client snapshot enables the
  // local-only affordances immediately after hydration. The API guard remains
  // authoritative throughout.
  const localDraftMode = useSyncExternalStore(
    subscribeToNothing,
    () => publishingDisabled,
    () => false
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeSection, setActiveSection] = useState("links");
  const [dirty, setDirty] = useState(false);
  const [customTypeOpen, setCustomTypeOpen] = useState<Record<string, boolean>>({});
  const [extraGalleryGroups, setExtraGalleryGroups] = useState<string[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveHistory, setSaveHistory] = useState<string[]>([]);
  const [publishedBaseline, setPublishedBaseline] = useState<SiteContent>(() => structuredClone(initialContent));
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishLogDraft, setPublishLogDraft] = useState("");
  const [publishModalError, setPublishModalError] = useState<string | null>(null);

  const hasGallery = useMemo(() => content.gallery.length > 0, [content.gallery.length]);
  const hasAlumni = useMemo(() => content.alumni.length > 0, [content.alumni.length]);

  const galleryGroups = useMemo(
    () => buildAdminGalleryGroups(content.gallery, content.events),
    [content.gallery, content.events]
  );
  const galleryGroupKeys = useMemo(() => new Set(galleryGroups.map((g) => g.key)), [galleryGroups]);
  const visibleGalleryGroups = useMemo(() => {
    const extra = extraGalleryGroups
      .filter((k) => !galleryGroupKeys.has(k))
      .map((k): AdminGalleryGroup => {
        if (k === "__ungrouped") {
          return { key: "__ungrouped", eventId: undefined, title: "Recent Moments", images: [] };
        }
        const event = content.events.find((e) => e.id === k);
        return { key: k, eventId: k, title: event?.title ?? "Event", images: [] };
      });
    return [...galleryGroups, ...extra];
  }, [galleryGroups, galleryGroupKeys, extraGalleryGroups, content.events]);
  const eventsWithoutGallery = useMemo(() => {
    const represented = new Set([...galleryGroupKeys, ...extraGalleryGroups]);
    return content.events.filter((e) => !represented.has(e.id));
  }, [content.events, galleryGroupKeys, extraGalleryGroups]);
  const showUngroupedOption = useMemo(
    () => !galleryGroupKeys.has("__ungrouped") && !extraGalleryGroups.includes("__ungrouped"),
    [galleryGroupKeys, extraGalleryGroups]
  );

  const update = (next: SiteContent) => {
    setContent(next);
    setDirty(true);
  };

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 2800);
  };

  const openPublishModal = () => {
    if (localDraftMode) {
      showToast("error", "Publishing is disabled in local development.");
      return;
    }
    if (!dirty) {
      showToast("error", "Nothing to save yet.");
      return;
    }
    setPublishModalError(null);
    setPublishLogDraft(buildSiteContentChangeSummary(publishedBaseline, content));
    setPublishModalOpen(true);
  };

  const closePublishModal = () => {
    if (saving) return;
    setPublishModalOpen(false);
    setPublishModalError(null);
  };

  const confirmPublish = async () => {
    if (localDraftMode) return;
    const message = publishLogDraft.trim();
    if (!message) {
      setPublishModalError("Add what changed (the summary below can be edited).");
      return;
    }
    setPublishModalError(null);
    setSaving(true);
    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      if (!response.ok) {
        showToast("error", "Failed to save changes.");
        return;
      }
      setPublishedBaseline(structuredClone(content));
      setDirty(false);
      const savedAt = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      setLastSavedAt(savedAt);
      setSaveHistory((prev) => [savedAt, ...prev].slice(0, 4));

      const logRes = await fetch("/api/admin/changelog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      setPublishModalOpen(false);
      if (!logRes.ok) {
        let err = "Unknown error";
        try {
          const b = (await logRes.json()) as { error?: string };
          if (b.error) err = b.error;
        } catch {
          /* ignore */
        }
        showToast(
          "error",
          `Your changes are live, but the activity log could not be saved (${err}). Try Save & publish again, or check your database / network.`
        );
        return;
      }
      showToast("success", "Changes saved, published, and logged.");
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  const uploadImage = async (file: File, scope: "events" | "team" | "gallery" | "alumni" | "partners" | "learning") => {
    if (localDraftMode) {
      throw new Error("Image uploads are disabled in local development.");
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("scope", scope);

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed.");
    }

    const body = (await response.json()) as { url: string };
    return body.url;
  };

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!publishModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || saving) return;
      setPublishModalOpen(false);
      setPublishModalError(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [publishModalOpen, saving]);

  useEffect(() => {
    const sectionIds = ["links", "events", "learning", "opportunities", "team", "committee", "partners", "gallery", "alumni", "testimonials"];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActiveSection(visible.target.id);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.25, 0.5, 0.8] }
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(`admin-${id}`);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [hasGallery, hasAlumni]);

  return (
    <main className="min-h-screen bg-[#F5F6F8] px-4 py-4 text-zinc-900 md:px-6">
      <div className="mx-auto grid max-w-[1440px] gap-4 lg:grid-cols-[236px_minmax(0,1fr)]">
        <aside className="hidden lg:block sticky top-4 self-start">
          <nav className="admin-rail">
            <div className="mb-7 px-3"><p className="text-lg font-bold text-white">ColorStack<span className="text-red-500">RUN</span></p><p className="mt-1 font-mono text-[10px] uppercase tracking-[.18em] text-zinc-400">Content console</p></div>
            <p className="admin-rail-label">Sections</p>
            <AdminNavItem href="#admin-links" label="Chapter Links" active={activeSection === "links"} />
            <AdminNavItem href="#admin-events" label="Events" active={activeSection === "events"} />
            <AdminNavItem href="#admin-learning" label="Learning Hub" active={activeSection === "learning"} />
            <AdminNavItem href="#admin-opportunities" label="Opportunities" active={activeSection === "opportunities"} />
            <AdminNavItem href="#admin-team" label="Executive Board" active={activeSection === "team"} />
            <AdminNavItem href="#admin-committee" label="Committee" active={activeSection === "committee"} />
            <AdminNavItem href="#admin-partners" label="Partners" active={activeSection === "partners"} />
            <AdminNavItem href="#admin-gallery" label="Gallery" active={activeSection === "gallery"} />
            <AdminNavItem href="#admin-alumni" label="Alumni Network" active={activeSection === "alumni"} />
            <AdminNavItem href="#admin-testimonials" label="Testimonials" active={activeSection === "testimonials"} />
            <p className="admin-rail-label mt-5 border-t border-white/10 pt-5">Tools</p>
            <Link
              href="/admin/changelog"
              className="admin-rail-link"
            >
              Change log
            </Link>
            <Link href="/" className="admin-rail-link">View public site ↗</Link>
          </nav>
        </aside>

        <div className="space-y-5">
        <header className="sticky top-3 z-20 rounded-xl border border-zinc-200 bg-white/95 p-4 shadow-sm backdrop-blur md:px-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.16em] text-red-700">Content console</p>
              <h1 className="mt-1 text-xl font-bold text-zinc-950">ColorStackRUN Admin</h1>
              <p className="mt-1 text-sm text-zinc-600">{localDraftMode ? "Local draft mode" : saving ? "Publishing…" : dirty ? "Unsaved changes" : "Published"}{lastSavedAt ? ` · saved ${lastSavedAt}` : ""}</p>
              <p className="mt-2">
                <Link
                  href="/admin/changelog"
                  className="text-sm font-medium text-red-700 hover:text-red-800 hover:underline underline-offset-2"
                >
                  Open change log →
                </Link>
              </p>
              {lastSavedAt && (
                <p className="mt-2 text-sm text-emerald-700 font-medium">
                  Last saved at {lastSavedAt}
                </p>
              )}
              {saveHistory.length > 1 && (
                <p className="mt-1 text-xs text-gray-500">
                  Recent saves: {saveHistory.join(" · ")}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <div className="min-w-[240px] rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/70 px-4 py-3 text-left shadow-sm shadow-emerald-950/5">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  Logged in as
                </p>
                <p className="mt-1 max-w-60 truncate text-base font-bold leading-tight text-zinc-950">
                  {admin.googleProfileName ?? admin.displayName}
                </p>
                <p className="mt-1 max-w-60 truncate text-sm text-zinc-600" title={admin.email}>
                  {admin.email}
                </p>
              </div>
              <button className={buttonClass} onClick={onLogout}>Log out</button>
              <button
                className={primaryButtonClass}
                onClick={openPublishModal}
                disabled={localDraftMode || saving || publishModalOpen}
                title={localDraftMode ? "Publishing is disabled in local development." : undefined}
              >
                {localDraftMode ? "Publishing disabled locally" : saving ? "Saving..." : "Save & Publish"}
              </button>
            </div>
          </div>
          {localDraftMode && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950" role="status">
              <span className="mt-0.5 font-bold" aria-hidden="true">LOCAL</span>
              <p><strong>Draft mode is on.</strong> Publishing and image uploads are disabled here, so this server cannot change the live site.</p>
            </div>
          )}
          {dirty && <p className="mt-3 inline-block rounded-md bg-[#FFF1F2] px-2 py-1 font-mono text-xs text-red-700">DRAFT CHANGES</p>}
        </header>

        <nav aria-label="Jump to admin section" className="flex gap-2 overflow-x-auto rounded-lg border border-zinc-200 bg-white p-2 lg:hidden">
          {["links","events","learning","opportunities","team","partners","gallery","alumni","testimonials"].map((id) => <a key={id} href={`#admin-${id}`} className="whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-rose-50 hover:text-red-700">{id.replace("-", " ")}</a>)}
        </nav>

        <div className="admin-pulse" aria-label="Content pulse"><span>{content.events.length} events</span><span>{content.team.length} leaders</span><span>{content.committee.length} committee</span><span>{content.partners.length} partners</span><span>{content.gallery.length} photos</span><span>{content.alumni.length} alumni</span><span>{content.learningResources.length} learning</span><span>{content.opportunities.length} opportunities</span></div>

        <section id="admin-links" className={sectionClass}>
          <h2 className="text-2xl font-semibold text-gray-900">Chapter Links</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <LabeledInput label="Instagram" value={content.links.instagram} onChange={(value) => update({ ...content, links: { ...content.links, instagram: value } })} />
            <LabeledInput label="LinkedIn" value={content.links.linkedin} onChange={(value) => update({ ...content, links: { ...content.links, linkedin: value } })} />
            <LabeledInput label="Join Link (RaiderLink)" value={content.links.join} onChange={(value) => update({ ...content, links: { ...content.links, join: value } })} />
            <LabeledInput label="Email" value={content.links.email} onChange={(value) => update({ ...content, links: { ...content.links, email: value } })} />
          </div>
        </section>

        <section id="admin-events" className={sectionClass}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">Events</h2>
            <button
              className={buttonClass}
              onClick={() =>
                update({
                  ...content,
                  events: [
                    ...content.events,
                    {
                      id: crypto.randomUUID(),
                      title: "New Event",
                      date: new Date().toISOString().slice(0, 10),
                      endDate: undefined,
                      startTime: "18:00",
                      endTime: "19:00",
                      location: "TBD",
                      type: "Workshop",
                      raiderlinkUrl: content.links.join,
                    },
                  ],
                })
              }
            >
              Add Event
            </button>
          </div>

          <div className="space-y-6">
            {content.events.map((event) => (
              <div key={event.id} className="rounded-2xl border border-gray-200/90 bg-white p-4 md:p-5 space-y-4 shadow-sm">
                <div className="flex justify-end">
                  <button
                    className={destructiveLinkClass}
                    onClick={() => update({ ...content, events: content.events.filter((e) => e.id !== event.id) })}
                  >
                    Remove
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <LabeledInput label="Title" value={event.title} onChange={(value) => updateEvent(content, event.id, { title: value }, update)} />
                  <LabeledDateInput
                    label={isMultiDayEvent(event) ? "Start Date" : "Date"}
                    value={event.date}
                    onChange={(value) => updateEvent(content, event.id, { date: value }, update)}
                  />
                  {isMultiDayEvent(event) ? (
                    <LabeledDateInput
                      label="End Date"
                      value={event.endDate ?? event.date}
                      onChange={(value) => updateEvent(content, event.id, { endDate: value || event.date }, update)}
                    />
                  ) : (
                    <div />
                  )}
                  <label className="md:col-span-2 inline-flex items-center gap-2.5 text-sm text-gray-700 rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2.5">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      checked={isMultiDayEvent(event)}
                      onChange={(e) =>
                        updateEvent(content, event.id, { endDate: e.target.checked ? event.endDate ?? event.date : undefined }, update)
                      }
                    />
                    <span className="font-medium">This is a multiple-day event</span>
                  </label>
                  <LabeledTimeInput
                    label="Start Time (ET)"
                    value={event.startTime}
                    onChange={(value) => updateEvent(content, event.id, { startTime: value }, update)}
                    suggestions={TIME_OPTIONS}
                  />
                  <LabeledTimeInput
                    label="End Time (ET)"
                    value={event.endTime}
                    onChange={(value) => updateEvent(content, event.id, { endTime: value }, update)}
                    suggestions={TIME_OPTIONS}
                  />
                  <LabeledInput label="Location" value={event.location} onChange={(value) => updateEvent(content, event.id, { location: value }, update)} />
                  <LabeledDropdown
                    label="Status"
                    value={event.statusOverride ?? "auto"}
                    options={[...EVENT_STATUS_OPTIONS]}
                    onChange={(value) => {
                      updateEvent(content, event.id, {
                        statusOverride:
                          value === "auto"
                            ? undefined
                            : (value as SiteContent["events"][number]["statusOverride"]),
                      }, update);
                    }}
                    formatOptionLabel={(option) =>
                      option === "auto" ? "Auto (date-based)" : option[0].toUpperCase() + option.slice(1)
                    }
                  />
                  <LabeledDropdown
                    label="Type"
                    value={customTypeOpen[event.id] ? "__custom" : event.type}
                    options={[
                      ...EVENT_TYPE_OPTIONS,
                      ...(!EVENT_TYPE_OPTIONS.includes(event.type) ? [event.type] : []),
                      "__custom",
                    ]}
                    onChange={(value) => {
                      if (value === "__custom") {
                        setCustomTypeOpen((previous) => ({ ...previous, [event.id]: true }));
                        if (EVENT_TYPE_OPTIONS.includes(event.type)) {
                          updateEvent(content, event.id, { type: "" }, update);
                        }
                        return;
                      }
                      setCustomTypeOpen((previous) => ({ ...previous, [event.id]: false }));
                      updateEvent(content, event.id, { type: value }, update);
                    }}
                    formatOptionLabel={(option) => (option === "__custom" ? "Custom..." : option)}
                  />
                  <LabeledInput label="RaiderLink URL" value={event.raiderlinkUrl ?? ""} onChange={(value) => updateEvent(content, event.id, { raiderlinkUrl: value }, update)} />
                </div>
                {customTypeOpen[event.id] && (
                  <LabeledInput
                    label="Custom Type"
                    value={event.type}
                    onChange={(value) => updateEvent(content, event.id, { type: value }, update)}
                  />
                )}
                <ImageUploadField
                  label="Event Flyer"
                  currentUrl={event.flyerImage}
                  onUpload={async (file) => {
                    const url = await uploadImage(file, "events");
                    updateEvent(content, event.id, { flyerImage: url }, update);
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        <LearningResourcesEditor content={content} onChange={update} onUpload={(file) => uploadImage(file, "learning")} />
        <OpportunitiesEditor content={content} onChange={update} />

        <section id="admin-team" className={sectionClass}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">Executive Board</h2>
            <button
              className={buttonClass}
              onClick={() =>
                update({
                  ...content,
                  team: [
                    ...content.team,
                    {
                      id: crypto.randomUUID(),
                      name: "New Member",
                      role: "Role",
                      bio: "Short bio",
                      linkedin: "https://www.linkedin.com/",
                    },
                  ],
                })
              }
            >
              Add Member
            </button>
          </div>
          <div className="space-y-6">
            {content.team.map((member) => (
              <div key={member.id} className="rounded-2xl border border-gray-200/90 bg-white p-4 md:p-5 space-y-4 shadow-sm">
                <div className="flex justify-end">
                  <button
                    className={destructiveLinkClass}
                    onClick={() => update({ ...content, team: content.team.filter((m) => m.id !== member.id) })}
                  >
                    Remove
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <LabeledInput label="Name" value={member.name} onChange={(value) => updateMember(content, member.id, { name: value }, update)} />
                  <LabeledInput label="Role" value={member.role} onChange={(value) => updateMember(content, member.id, { role: value }, update)} />
                  <LabeledInput label="LinkedIn URL" value={member.linkedin} onChange={(value) => updateMember(content, member.id, { linkedin: value }, update)} />
                  <LabeledDropdown
                    label="Graduation Year"
                    value={member.graduationYear ?? ""}
                    options={["", ...GRADUATION_YEAR_OPTIONS]}
                    onChange={(value) => updateMember(content, member.id, { graduationYear: value || undefined }, update)}
                    formatOptionLabel={(option) => option === "" ? "Not specified" : option}
                  />
                  <LabeledEmailInput label="Email" value={member.email ?? ""} onChange={(value) => updateMember(content, member.id, { email: value || undefined }, update)} />
                </div>
                <LabeledTextArea label="Bio" value={member.bio} onChange={(value) => updateMember(content, member.id, { bio: value }, update)} />
                <ImageUploadField
                  label="Portrait Image"
                  currentUrl={member.image}
                  cropShape="rect"
                  cropAspect={3 / 4}
                  allowReCrop
                  onUpload={async (file) => {
                    const url = await uploadImage(file, "team");
                    updateMember(content, member.id, { image: url }, update);
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        <section id="admin-committee" className={sectionClass}>
          <div className="flex items-center justify-between">
            <div><h2 className="text-2xl font-semibold text-gray-900">Committee Members</h2><p className="mt-1 text-sm text-gray-500">Committee members appear below the Executive Board on the public site.</p></div>
            <button className={buttonClass} onClick={() => update({ ...content, committee: [...content.committee, { id: crypto.randomUUID(), name: "New Committee Member", role: "Committee Role", bio: "Short bio", linkedin: "https://www.linkedin.com/" }] })}>Add Member</button>
          </div>
          {content.committee.length > 0 ? <div className="space-y-6">{content.committee.map((member) => (
            <div key={member.id} className="rounded-2xl border border-gray-200/90 bg-white p-4 md:p-5 space-y-4 shadow-sm">
              <div className="flex justify-end"><button className={destructiveLinkClass} onClick={() => update({ ...content, committee: content.committee.filter((m) => m.id !== member.id) })}>Remove</button></div>
              <div className="grid md:grid-cols-2 gap-3">
                <LabeledInput label="Name" value={member.name} onChange={(value) => updateCommitteeMember(content, member.id, { name: value }, update)} />
                <LabeledInput label="Committee Role" value={member.role} onChange={(value) => updateCommitteeMember(content, member.id, { role: value }, update)} />
                <LabeledInput label="LinkedIn URL" value={member.linkedin} onChange={(value) => updateCommitteeMember(content, member.id, { linkedin: value }, update)} />
                <LabeledDropdown label="Graduation Year" value={member.graduationYear ?? ""} options={["", ...GRADUATION_YEAR_OPTIONS]} onChange={(value) => updateCommitteeMember(content, member.id, { graduationYear: value || undefined }, update)} formatOptionLabel={(option) => option === "" ? "Not specified" : option} />
                <LabeledEmailInput label="Email" value={member.email ?? ""} onChange={(value) => updateCommitteeMember(content, member.id, { email: value || undefined }, update)} />
              </div>
              <LabeledTextArea label="Bio" value={member.bio} onChange={(value) => updateCommitteeMember(content, member.id, { bio: value }, update)} />
              <ImageUploadField label="Portrait Image" currentUrl={member.image} cropShape="rect" cropAspect={3 / 4} allowReCrop onUpload={async (file) => { const url = await uploadImage(file, "team"); updateCommitteeMember(content, member.id, { image: url }, update); }} />
            </div>
          ))}</div> : <p className="text-sm text-gray-600">No committee members yet. Add one when their profile is ready to share.</p>}
        </section>

        <section id="admin-partners" className={sectionClass}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Partner logos (marquee)</h2>
              <p className="text-sm text-gray-500 mt-1">
                {
                  'Logos scroll on the homepage "Our Partners" strip. Use wide PNG or WebP (transparent background works well). You can paste a URL or upload to storage.'
                }
              </p>
            </div>
            <button
              type="button"
              className={buttonClass}
              onClick={() =>
                update({
                  ...content,
                  partners: [
                    ...content.partners,
                    {
                      id: crypto.randomUUID(),
                      name: "New partner",
                      src: "",
                    },
                  ],
                })
              }
            >
              Add partner
            </button>
          </div>
          <div className="space-y-6">
            {content.partners.length === 0 && (
              <p className="text-sm text-gray-600">No partners yet — add one to show the moving strip on the site.</p>
            )}
            {content.partners.map((partner) => (
              <div key={partner.id} className="rounded-2xl border border-gray-200/90 bg-white p-4 md:p-5 space-y-4 shadow-sm">
                <div className="flex justify-end">
                  <button
                    type="button"
                    className={destructiveLinkClass}
                    onClick={() =>
                      update({ ...content, partners: content.partners.filter((p) => p.id !== partner.id) })
                    }
                  >
                    Remove
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <LabeledInput
                    label="Partner name"
                    value={partner.name}
                    onChange={(value) => updatePartner(content, partner.id, { name: value }, update)}
                  />
                  <LabeledInput
                    label="Logo image URL"
                    value={partner.src}
                    onChange={(value) => updatePartner(content, partner.id, { src: value }, update)}
                    placeholder="https://… or /uploads/…"
                  />
                </div>
                <ImageUploadField
                  label="Upload logo (optional)"
                  currentUrl={partner.src || undefined}
                  onUpload={async (file) => {
                    const url = await uploadImage(file, "partners");
                    updatePartner(content, partner.id, { src: url }, update);
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        <section id="admin-gallery" className={sectionClass}>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Events Gallery</h2>
            <p className="text-sm text-gray-500 mt-1">Photos are grouped by event. Select multiple files at once to bulk-upload.</p>
          </div>

          {visibleGalleryGroups.length === 0 && !hasGallery && (
            <p className="text-sm text-gray-600">No gallery photos yet. Use the selector below to start uploading.</p>
          )}

          <div className="space-y-5">
            {visibleGalleryGroups.map((group) => (
              <GalleryGroupPanel
                key={group.key}
                group={group}
                onUploadFiles={async (files) => {
                  const urls = await Promise.all(files.map((f) => uploadImage(f, "gallery")));
                  const newItems = urls.map((url) => ({
                    id: crypto.randomUUID(),
                    src: url,
                    alt: "Gallery image",
                    caption: "",
                    eventId: group.eventId,
                  }));
                  update({ ...content, gallery: [...content.gallery, ...newItems] });
                }}
                onUpdateCaption={(id, caption) => updateGallery(content, id, { caption }, update)}
                onRemove={(id) => update({ ...content, gallery: content.gallery.filter((g) => g.id !== id) })}
              />
            ))}
          </div>

          {(eventsWithoutGallery.length > 0 || showUngroupedOption) && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 p-4">
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Add photos for another event</p>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-xl border border-gray-300/90 bg-white px-3 py-2.5 pr-10 text-sm text-gray-700 shadow-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
                  value=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    setExtraGalleryGroups((prev) => [...prev, e.target.value]);
                  }}
                >
                  <option value="">Select an event...</option>
                  {eventsWithoutGallery.map((event) => (
                    <option key={event.id} value={event.id}>{event.title}</option>
                  ))}
                  {showUngroupedOption && <option value="__ungrouped">Recent Moments (no event)</option>}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">▾</span>
              </div>
            </div>
          )}
        </section>
        <section id="admin-alumni" className={sectionClass}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Alumni Network</h2>
              <p className="text-sm text-gray-500 mt-1">Alumni appear on the public site when at least one entry is added.</p>
            </div>
            <button
              className={buttonClass}
              onClick={() =>
                update({
                  ...content,
                  alumni: [
                    ...content.alumni,
                    {
                      id: crypto.randomUUID(),
                      name: "Alumni Name",
                      role: "Software Engineer",
                      company: "Company",
                      graduationYear: new Date().getFullYear().toString(),
                      story: "",
                      linkedin: "https://www.linkedin.com/",
                    },
                  ],
                })
              }
            >
              Add Alumni
            </button>
          </div>

          {hasAlumni ? (
            <div className="space-y-6">
              {content.alumni.map((member) => (
                <div key={member.id} className="rounded-2xl border border-gray-200/90 bg-white p-4 md:p-5 space-y-4 shadow-sm">
                  <div className="flex justify-end">
                    <button
                      className={destructiveLinkClass}
                      onClick={() => update({ ...content, alumni: content.alumni.filter((a) => a.id !== member.id) })}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <LabeledInput label="Name" value={member.name} onChange={(value) => updateAlumni(content, member.id, { name: value }, update)} />
                    <LabeledInput label="Current Role / Title" value={member.role} onChange={(value) => updateAlumni(content, member.id, { role: value }, update)} />
                    <LabeledInput label="Company" value={member.company} onChange={(value) => updateAlumni(content, member.id, { company: value }, update)} />
                    <LabeledInput label="Graduation Year" value={member.graduationYear} onChange={(value) => updateAlumni(content, member.id, { graduationYear: value }, update)} />
                    <LabeledInput label="LinkedIn URL" value={member.linkedin ?? ""} onChange={(value) => updateAlumni(content, member.id, { linkedin: value }, update)} />
                  </div>
                  <LabeledTextArea
                    label="Story (shown in alumni story popup)"
                    value={member.story ?? ""}
                    onChange={(value) => updateAlumni(content, member.id, { story: value }, update)}
                  />
                  <ImageUploadField
                    label="Headshot / Photo"
                    currentUrl={member.image}
                    cropShape="rect"
                    cropAspect={4 / 3}
                    allowReCrop
                    previewBadgeText={`Class of ${member.graduationYear || "20XX"}`}
                    onUpload={async (file) => {
                      const url = await uploadImage(file, "alumni");
                      updateAlumni(content, member.id, { image: url }, update);
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No alumni added yet. Add one to activate the Alumni Network section on the public site.</p>
          )}
        </section>

        <section id="admin-testimonials" className={sectionClass}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Testimonials</h2>
              <p className="text-sm text-gray-500 mt-1">Member quotes shown on the public site. Appears when at least one entry is added.</p>
            </div>
            <button
              className={buttonClass}
              onClick={() =>
                update({
                  ...content,
                  testimonials: [
                    ...content.testimonials,
                    {
                      id: crypto.randomUUID(),
                      name: "Member Name",
                      graduationYear: new Date().getFullYear().toString(),
                      major: "Computer Science",
                      testimonial: "Share your experience with ColorStackRUN.",
                    },
                  ],
                })
              }
            >
              Add Testimonial
            </button>
          </div>

          {content.testimonials.length > 0 ? (
            <div className="space-y-6">
              {content.testimonials.map((item) => (
                <div key={item.id} className="rounded-2xl border border-gray-200/90 bg-white p-4 md:p-5 space-y-4 shadow-sm">
                  <div className="flex justify-end">
                    <button
                      className={destructiveLinkClass}
                      onClick={() => update({ ...content, testimonials: content.testimonials.filter((t) => t.id !== item.id) })}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <LabeledInput label="Name" value={item.name} onChange={(value) => updateTestimonial(content, item.id, { name: value }, update)} />
                    <LabeledDropdown
                      label="Graduation Year"
                      value={item.graduationYear}
                      options={GRADUATION_YEAR_OPTIONS}
                      onChange={(value) => updateTestimonial(content, item.id, { graduationYear: value }, update)}
                    />
                    <LabeledInput label="Major (optional)" value={item.major ?? ""} onChange={(value) => updateTestimonial(content, item.id, { major: value || undefined }, update)} />
                  </div>
                  <LabeledTextArea label="Testimonial" value={item.testimonial} onChange={(value) => updateTestimonial(content, item.id, { testimonial: value }, update)} />
                  <ImageUploadField
                    label="Headshot (optional)"
                    currentUrl={item.image}
                    cropShape="round"
                    allowReCrop
                    onUpload={async (file) => {
                      const url = await uploadImage(file, "team");
                      updateTestimonial(content, item.id, { image: url }, update);
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No testimonials yet. Add member quotes to activate this section on the public site.</p>
          )}
        </section>

        </div>
      </div>

      {publishModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-modal-title"
          onClick={closePublishModal}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/80 bg-white shadow-2xl shadow-slate-900/15 p-6 md:p-7 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="publish-modal-title" className="text-xl font-bold text-slate-900">
              Save & publish
            </h2>
            <p className="text-sm text-slate-600">
              We pre-filled a summary of edits since your last successful publish. Review the summary, then confirm.
            </p>
            <div className="rounded-xl border border-amber-300/80 bg-amber-100 px-3 py-2.5 text-sm leading-relaxed text-slate-900">
              <strong className="font-semibold text-slate-950">Please describe exactly what you changed</strong>{" "}
              (edit the summary below if the auto-generated list is incomplete). This creates a clear record for the
              team.
            </div>
            <p className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm leading-relaxed text-sky-950">
              This publish will be attributed to your verified Google account.
            </p>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">What changed (activity log)</span>
              <textarea
                value={publishLogDraft}
                onChange={(e) => setPublishLogDraft(e.target.value)}
                rows={10}
                className="w-full rounded-xl border border-slate-300/80 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 font-mono leading-relaxed"
              />
            </label>
            {publishModalError && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{publishModalError}</p>
            )}
            <div className="flex flex-wrap justify-end gap-3 pt-1">
              <button type="button" className={buttonClass} onClick={closePublishModal} disabled={saving}>
                Cancel
              </button>
              <button
                type="button"
                className={primaryButtonClass}
                onClick={confirmPublish}
                disabled={saving}
              >
                {saving ? "Publishing…" : "Confirm publish"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </main>
  );
}

function AdminNavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <a
      href={href}
      className={`admin-rail-link ${
        active
          ? "admin-rail-link-active"
          : ""
      }`}
    >
      {label}
    </a>
  );
}

function Toast({ toast }: { toast: { type: "success" | "error"; text: string } | null }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50" role="status" aria-live="polite">
      <div
        className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
          toast.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-red-50 border-red-200 text-red-700"
        }`}
      >
        {toast.text}
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="text-sm text-slate-700 space-y-1.5 block">
      <span className="font-medium">{label}</span>
      <input
        className="w-full rounded-xl border border-slate-300/80 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function LabeledEmailInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const isValid = !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return (
    <label className="text-sm text-slate-700 space-y-1.5 block">
      <span className="font-medium">{label}</span>
      <input
        type="email"
        className={`w-full rounded-xl border bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none focus:ring-2 transition-all ${
          isValid
            ? "border-gray-300/90 focus:border-red-500 focus:ring-red-100"
            : "border-red-400 focus:border-red-500 focus:ring-red-100"
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="name@domain.com"
      />
      {!isValid && <p className="text-xs text-red-600 font-medium">Please enter a valid email address.</p>}
    </label>
  );
}

function LabeledDateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm text-slate-700 space-y-1.5 block">
      <span className="font-medium">{label}</span>
      <input
        type="date"
        className="w-full rounded-xl border border-gray-300/90 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
        value={toDateInputValue(value)}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function LabeledTimeInput({
  label,
  value,
  suggestions,
  onChange,
}: {
  label: string;
  value: string;
  suggestions?: string[];
  onChange: (value: string) => void;
}) {
  const datalistId = useId();
  const formattedValue = formatTimeOption(value);
  const [draftState, setDraftState] = useState(() => ({ sourceValue: value, draft: formattedValue }));
  const draft = draftState.sourceValue === value ? draftState.draft : formattedValue;
  const resolvedSuggestions = suggestions ?? [];

  const onBlur = () => {
    const parsed = parseTimeInput(draft);
    if (!parsed) {
      setDraftState({ sourceValue: value, draft: formattedValue });
      return;
    }
    onChange(parsed);
    setDraftState({ sourceValue: parsed, draft: formatTimeOption(parsed) });
  };

  return (
    <label className="text-sm text-slate-700 space-y-1.5 block">
      <span className="font-medium">{label}</span>
      <input
        list={datalistId}
        className="w-full rounded-xl border border-gray-300/90 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
        value={draft}
        placeholder="e.g. 3:50 PM"
        onChange={(e) => setDraftState({ sourceValue: value, draft: e.target.value })}
        onBlur={onBlur}
      />
      <datalist id={datalistId}>
        {resolvedSuggestions.map((option) => (
          <option key={option} value={formatTimeOption(option)} />
        ))}
      </datalist>
    </label>
  );
}

function LabeledDropdown({
  label,
  value,
  options,
  onChange,
  formatOptionLabel,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  formatOptionLabel?: (value: string) => string;
}) {
  return (
    <label className="text-sm text-slate-700 space-y-1.5 block">
      <span className="font-medium">{label}</span>
      <div className="relative">
        <select
          className="w-full appearance-none rounded-xl border border-gray-300/90 bg-white px-3 py-2.5 pr-10 text-gray-900 shadow-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {formatOptionLabel ? formatOptionLabel(option) : option}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">▾</span>
      </div>
    </label>
  );
}

function LabeledTextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm text-slate-700 space-y-1.5 block">
      <span className="font-medium">{label}</span>
      <textarea
        className="w-full rounded-xl border border-gray-300/90 bg-white px-3 py-2.5 text-gray-900 min-h-24 shadow-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function ImageUploadField({
  label,
  currentUrl,
  cropShape = "rect",
  cropAspect,
  allowReCrop = false,
  previewBadgeText,
  onUpload,
}: {
  label: string;
  currentUrl?: string;
  cropShape?: "rect" | "round";
  cropAspect?: number;
  allowReCrop?: boolean;
  previewBadgeText?: string;
  onUpload: (file: File) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [loadingExistingImage, setLoadingExistingImage] = useState(false);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [sourceFileName, setSourceFileName] = useState("image");
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cardPreviewUrl, setCardPreviewUrl] = useState<string | null>(null);
  const showEboardCardPreview = cropShape === "rect" && cropAspect === 3 / 4;
  const showAlumniCardPreview = cropShape === "rect" && cropAspect === 4 / 3;
  const showCardPreview = showEboardCardPreview || showAlumniCardPreview;

  useEffect(() => {
    if (!showCardPreview || !sourceImageUrl || !croppedAreaPixels) {
      const id = window.setTimeout(() => {
        setCardPreviewUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return null;
        });
      }, 0);
      return () => window.clearTimeout(id);
    }

    let isCancelled = false;
    void getCroppedPreviewUrl(sourceImageUrl, croppedAreaPixels).then((nextUrl) => {
      if (isCancelled) {
        URL.revokeObjectURL(nextUrl);
        return;
      }
      setCardPreviewUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return nextUrl;
      });
    }).catch(() => {
      if (!isCancelled) setCardPreviewUrl(null);
    });

    return () => {
      isCancelled = true;
    };
  }, [showCardPreview, sourceImageUrl, croppedAreaPixels]);

  const openCropper = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setSourceImageUrl(objectUrl);
    setSourceFileName(file.name || "image");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const closeCropper = () => {
    if (sourceImageUrl) {
      URL.revokeObjectURL(sourceImageUrl);
    }
    setCardPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setSourceImageUrl(null);
  };

  const editExistingImage = async () => {
    if (!currentUrl) return;
    setLoadingExistingImage(true);
    try {
      const response = await fetch(currentUrl);
      if (!response.ok) {
        throw new Error("Failed to load current image for editing.");
      }
      const blob = await response.blob();
      const fileNameFromUrl = currentUrl.split("/").pop()?.split("?")[0] || "existing-image.jpg";
      const mimeType = blob.type || "image/jpeg";
      const existingFile = new File([blob], fileNameFromUrl, { type: mimeType });
      openCropper(existingFile);
    } catch {
      window.alert("Could not open existing image for editing. Please upload the image again.");
    } finally {
      setLoadingExistingImage(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {currentUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentUrl}
          alt={label}
          className={`object-cover border border-gray-200 shadow-sm ${
            cropShape === "round"
              ? "w-28 h-28 rounded-full"
              : cropAspect === 3 / 4
                ? "w-28 aspect-[3/4] rounded-2xl"
                : cropAspect === 4 / 3
                  ? "w-36 aspect-[4/3] rounded-2xl"
                : "w-28 h-28 rounded-xl"
          }`}
        />
      )}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300/90 bg-white shadow-sm hover:bg-gray-50 cursor-pointer transition-colors w-fit text-sm font-medium text-gray-700">
          <span>{uploading ? "Uploading..." : "Upload Image"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (cropShape === "round" || typeof cropAspect === "number") {
                openCropper(file);
                e.target.value = "";
                return;
              }
              setUploading(true);
              try {
                await onUpload(file);
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
        {allowReCrop && currentUrl && (
          <button
            type="button"
            onClick={editExistingImage}
            disabled={loadingExistingImage || uploading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300/90 bg-white shadow-sm hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors w-fit text-sm font-medium text-gray-700"
          >
            {loadingExistingImage ? "Opening editor..." : "Edit image"}
          </button>
        )}
      </div>
      {sourceImageUrl && (
        <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Adjust portrait crop</h3>
              <button
                type="button"
                onClick={closeCropper}
                className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>

            <div className={`grid gap-4 ${showCardPreview ? "md:grid-cols-[minmax(0,1fr)_240px]" : ""}`}>
              <div className="relative h-[340px] w-full rounded-xl overflow-hidden bg-gray-100">
                <Cropper
                  image={sourceImageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={cropAspect ?? 1}
                  cropShape={cropShape}
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropAreaChange={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                  onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                />
              </div>
              {showCardPreview && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Card Preview</p>
                  {showEboardCardPreview ? (
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-gray-200 bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cardPreviewUrl ?? sourceImageUrl} alt="Card preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/75 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent" />
                      <div className="absolute left-2 top-2 right-20">
                        <div className="h-2 w-2/5 rounded bg-red-400/90" />
                        <div className="mt-1.5 h-3 w-full rounded bg-white/85" />
                      </div>
                      <div className="absolute right-2 top-2 w-14 h-6 rounded-full border border-white/40 bg-black/45 flex items-center justify-center">
                        <div className="h-2 w-10 rounded bg-white/80" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full rounded-2xl border border-red-200/80 bg-white overflow-hidden">
                      <div className="relative aspect-[4/3] w-full bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cardPreviewUrl ?? sourceImageUrl} alt="Alumni card preview" className="h-full w-full object-cover" />
                        <div className="absolute right-2 top-2 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm">
                          {previewBadgeText ?? "Class of 20XX"}
                        </div>
                      </div>
                      <div className="px-3 py-3 space-y-2.5">
                        <div className="h-3 w-3/4 rounded bg-slate-800/85" />
                        <div className="h-2.5 w-2/3 rounded bg-slate-500/70" />
                        <div className="h-2.5 w-1/2 rounded bg-slate-500/60" />
                      </div>
                    </div>
                  )}
                  <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                    Preview simulates the public card framing and text overlay zone.
                  </p>
                </div>
              )}
            </div>

            <label className="block text-sm text-gray-700">
              <span className="font-medium">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full mt-2"
              />
            </label>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeCropper}
                className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-700 to-red-600 text-white hover:from-red-800 hover:to-red-700 transition-all disabled:opacity-70"
                disabled={!croppedAreaPixels || uploading}
                onClick={async () => {
                  if (!sourceImageUrl || !croppedAreaPixels) return;
                  setUploading(true);
                  try {
                    const croppedFile = await getCroppedFile(sourceImageUrl, croppedAreaPixels, sourceFileName, "image/jpeg");
                    await onUpload(croppedFile);
                    closeCropper();
                  } finally {
                    setUploading(false);
                  }
                }}
              >
                {uploading ? "Saving..." : "Use cropped image"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GalleryGroupPanel({
  group,
  onUploadFiles,
  onUpdateCaption,
  onRemove,
}: {
  group: AdminGalleryGroup;
  onUploadFiles: (files: File[]) => Promise<void>;
  onUpdateCaption: (id: string, caption: string) => void;
  onRemove: (id: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-200/90 bg-white p-4 md:p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-gray-900">{group.title}</h3>
        <label className={`${buttonClass} cursor-pointer inline-flex items-center gap-2`}>
          <span>{uploading ? "Uploading..." : "Add Photos"}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []);
              if (!files.length) return;
              setUploading(true);
              try {
                await onUploadFiles(files);
              } finally {
                setUploading(false);
                e.target.value = "";
              }
            }}
          />
        </label>
      </div>

      {group.images.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {group.images.map((image) => (
            <div key={image.id} className="space-y-1.5">
              <div className="relative group/thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full aspect-square object-cover rounded-xl border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => onRemove(image.id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-all"
                >
                  ×
                </button>
              </div>
              <input
                value={image.caption ?? ""}
                onChange={(e) => onUpdateCaption(image.id, e.target.value)}
                placeholder="Caption..."
                className="w-full text-xs text-gray-900 placeholder:text-gray-400 rounded-lg border border-gray-200 bg-white px-2 py-1.5 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 transition-all"
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 py-1">No photos yet. Click &quot;Add Photos&quot; to upload.</p>
      )}
    </div>
  );
}

function buildAdminGalleryGroups(
  gallery: SiteContent["gallery"],
  events: SiteContent["events"]
): AdminGalleryGroup[] {
  const eventById = new Map(events.map((e) => [e.id, e]));
  const grouped = new Map<string, SiteContent["gallery"]>();
  const ungrouped: SiteContent["gallery"] = [];

  for (const item of gallery) {
    if (item.eventId && eventById.has(item.eventId)) {
      const arr = grouped.get(item.eventId) ?? [];
      arr.push(item);
      grouped.set(item.eventId, arr);
    } else {
      ungrouped.push(item);
    }
  }

  const groups: AdminGalleryGroup[] = events
    .filter((e) => (grouped.get(e.id)?.length ?? 0) > 0)
    .map((e) => ({ key: e.id, eventId: e.id, title: e.title, images: grouped.get(e.id) ?? [] }));

  if (ungrouped.length > 0) {
    groups.push({ key: "__ungrouped", eventId: undefined, title: "Recent Moments", images: ungrouped });
  }

  return groups;
}

function updateEvent(content: SiteContent, id: string, patch: Partial<SiteContent["events"][number]>, update: (content: SiteContent) => void) {
  update({
    ...content,
    events: content.events.map((event) => (event.id === id ? { ...event, ...patch } : event)),
  });
}

function isMultiDayEvent(event: SiteContent["events"][number]) {
  return Boolean(event.endDate);
}

function updateMember(content: SiteContent, id: string, patch: Partial<SiteContent["team"][number]>, update: (content: SiteContent) => void) {
  update({
    ...content,
    team: content.team.map((member) => (member.id === id ? { ...member, ...patch } : member)),
  });
}

function updateCommitteeMember(content: SiteContent, id: string, patch: Partial<SiteContent["committee"][number]>, update: (content: SiteContent) => void) {
  update({
    ...content,
    committee: content.committee.map((member) => (member.id === id ? { ...member, ...patch } : member)),
  });
}

function updatePartner(content: SiteContent, id: string, patch: Partial<SiteContent["partners"][number]>, update: (content: SiteContent) => void) {
  update({
    ...content,
    partners: content.partners.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  });
}

function updateGallery(content: SiteContent, id: string, patch: Partial<SiteContent["gallery"][number]>, update: (content: SiteContent) => void) {
  update({
    ...content,
    gallery: content.gallery.map((image) => (image.id === id ? { ...image, ...patch } : image)),
  });
}

function updateTestimonial(content: SiteContent, id: string, patch: Partial<SiteContent["testimonials"][number]>, update: (content: SiteContent) => void) {
  update({
    ...content,
    testimonials: content.testimonials.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  });
}

function updateAlumni(content: SiteContent, id: string, patch: Partial<SiteContent["alumni"][number]>, update: (content: SiteContent) => void) {
  update({
    ...content,
    alumni: content.alumni.map((member) => (member.id === id ? { ...member, ...patch } : member)),
  });
}

function toDateInputValue(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatTimeOption(value: string) {
  const [hourPart, minutePart] = value.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
  const meridiem = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 === 0 ? 12 : hour % 12;
  const normalizedMinute = String(minute).padStart(2, "0");
  return `${normalizedHour}:${normalizedMinute} ${meridiem} EST`;
}

function parseTimeInput(input: string) {
  const trimmed = input.trim().toUpperCase().replace("EST", "").trim();
  if (!trimmed) return null;

  const twelveHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (twelveHourMatch) {
    const hourRaw = Number(twelveHourMatch[1]);
    const minute = Number(twelveHourMatch[2]);
    const meridiem = twelveHourMatch[3];
    if (hourRaw < 1 || hourRaw > 12 || minute < 0 || minute > 59) return null;
    const hour24 = meridiem === "PM" ? (hourRaw % 12) + 12 : hourRaw % 12;
    return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  const twentyFourHourMatch = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (twentyFourHourMatch) {
    const hour = Number(twentyFourHourMatch[1]);
    const minute = Number(twentyFourHourMatch[2]);
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  return null;
}

async function getCroppedFile(
  imageSrc: string,
  cropPixels: Area,
  fileName: string,
  mimeType: string
) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create canvas context.");
  }

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, 0.92);
  });

  if (!blob) {
    throw new Error("Failed to create cropped image.");
  }

  const extension = mimeType.split("/")[1] ?? "jpg";
  const baseName = fileName.replace(/\.[^/.]+$/, "");
  return new File([blob], `${baseName}-cropped.${extension}`, { type: mimeType });
}

async function getCroppedPreviewUrl(imageSrc: string, cropPixels: Area) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create canvas context.");
  }

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.92);
  });
  if (!blob) throw new Error("Failed to create cropped preview image.");
  return URL.createObjectURL(blob);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = (error) => reject(error);
    image.src = src;
  });
}
