import type { TeamMember } from "@/app/lib/content-types";

type Props = {
  team: TeamMember[];
  value: string;
  onChange: (memberName: string) => void;
  className: string;
  id?: string;
};

/** Lower number = earlier in the list (Co-Presidents, then VP, then everyone else). */
function roleSortTier(role: string): number {
  const r = role.trim().toLowerCase();
  const isVp = r.includes("vice") && r.includes("president");
  const isCoPres =
    r.includes("co-president") ||
    r.includes("co president") ||
    /^co[\s-]president\b/.test(r) ||
    (r.includes("president") && r.includes("co") && !isVp);
  if (isCoPres) return 0;
  if (isVp) return 1;
  return 2;
}

function sortTeamForAuthorSelect(team: TeamMember[]): TeamMember[] {
  return [...team].sort((a, b) => {
    const ta = roleSortTier(a.role);
    const tb = roleSortTier(b.role);
    if (ta !== tb) return ta - tb;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

/**
 * Restricts “who logged this” to current team list from site content (Executive Board in CMS).
 */
export function AdminAuthorSelect({ team, value, onChange, className, id }: Props) {
  const sorted = sortTeamForAuthorSelect(team);

  if (sorted.length === 0) {
    return (
      <select id={id} disabled className={className} value="">
        <option value="">Add people under Executive Board in the CMS first</option>
      </select>
    );
  }

  return (
    <select id={id} required className={className} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select who is making this change…</option>
      {sorted.map((m) => (
        <option key={m.id} value={m.name}>
          {m.name} — {m.role}
        </option>
      ))}
    </select>
  );
}
