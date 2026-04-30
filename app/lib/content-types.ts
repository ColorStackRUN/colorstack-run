export type EventItem = {
  id: string;
  date: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  title: string;
  location: string;
  type: string;
  statusOverride?: "upcoming" | "past";
  raiderlinkUrl?: string;
  flyerImage?: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  linkedin: string;
  email?: string;
  graduationYear?: string;
  image?: string;
};

export type StatItem = {
  id: string;
  label: string;
  value: string;
};

export type ImpactItem = {
  id: string;
  title: string;
  description: string;
};

export type SiteLinks = {
  instagram: string;
  linkedin: string;
  join: string;
  email: string;
};

export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  eventId?: string;
};

export type TestimonialItem = {
  id: string;
  name: string;
  graduationYear: string;
  major?: string;
  testimonial: string;
  image?: string;
};

export type AlumniMember = {
  id: string;
  name: string;
  role: string;
  company: string;
  graduationYear: string;
  image?: string;
  linkedin?: string;
};

export type SiteContent = {
  links: SiteLinks;
  stats: StatItem[];
  impact: ImpactItem[];
  events: EventItem[];
  team: TeamMember[];
  gallery: GalleryImage[];
  alumni: AlumniMember[];
  testimonials: TestimonialItem[];
};

export const defaultSiteContent: SiteContent = {
  links: {
    instagram: "https://www.instagram.com/colorstack_run",
    linkedin: "https://www.linkedin.com/company/colorstack-rutgers/posts/?feedView=all",
    join: "https://raiderlink.newark.rutgers.edu/CSDC/club_signup",
    email: "csdevelopers.run@gmail.com",
  },
  stats: [
    { id: "stat-members", label: "Community", value: "Growing" },
    { id: "stat-events", label: "Events", value: "Career-Focused" },
    { id: "stat-partners", label: "Connections", value: "Industry" },
    { id: "stat-founded", label: "2024", value: "Founded" },
  ],
  impact: [
    {
      id: "impact-career",
      title: "Career Readiness",
      description: "Interview prep, resume reviews, and mentor support designed for competitive internships and full-time roles.",
    },
    {
      id: "impact-access",
      title: "Industry Access",
      description: "Networking mixers and employer-facing events that connect Rutgers-Newark students to real opportunities.",
    },
    {
      id: "impact-community",
      title: "Community",
      description: "A strong support system where members collaborate, build projects, and grow as leaders together.",
    },
  ],
  events: [
    {
      id: "event-tech-interview",
      date: "2026-05-15",
      startTime: "18:00",
      endTime: "19:30",
      title: "Tech Interview Workshop",
      location: "GITC 1400",
      type: "Workshop",
      raiderlinkUrl: "https://raiderlink.newark.rutgers.edu/CSDC/club_signup",
    },
    {
      id: "event-networking",
      date: "2026-05-22",
      startTime: "19:00",
      endTime: "20:30",
      title: "Spring Networking Mixer",
      location: "Campus Center",
      type: "Social",
      raiderlinkUrl: "https://raiderlink.newark.rutgers.edu/CSDC/club_signup",
    },
    {
      id: "event-resume",
      date: "2026-05-29",
      startTime: "17:30",
      endTime: "19:00",
      title: "Resume Review Sessions",
      location: "Virtual",
      type: "Workshop",
      raiderlinkUrl: "https://raiderlink.newark.rutgers.edu/CSDC/club_signup",
    },
  ],
  team: [
    {
      id: "eren-kahyaoglu",
      name: "Eren Kahyaoglu",
      role: "Co-President",
      bio: "Co-leading chapter strategy, partnerships, and member development initiatives.",
      linkedin: "https://www.linkedin.com/in/eren-kahyaoglu/",
    },
    {
      id: "arian-pedram",
      name: "Arian Pedram",
      role: "Co-President",
      bio: "Focused on chapter operations, growth, and high-impact campus programming.",
      linkedin: "https://www.linkedin.com/in/arian-pedram/",
    },
    {
      id: "jorge-ceballos",
      name: "Jorge Ceballos",
      role: "Vice President",
      bio: "Leads chapter execution across events, partnerships, and member experience.",
      linkedin: "https://www.linkedin.com/in/ceballosjorge/",
    },
    {
      id: "eric-huang",
      name: "Eric Huang",
      role: "Secretary",
      bio: "Coordinates communications and keeps chapter operations organized and on track.",
      linkedin: "https://www.linkedin.com/in/eczh/",
    },
    {
      id: "obianuju-enekebe",
      name: "Obianuju Enekebe",
      role: "Treasurer",
      bio: "Manages chapter finances and ensures resources are aligned with member impact.",
      linkedin: "https://www.linkedin.com/in/obianuju-enekebe/",
    },
  ],
  gallery: [],
  alumni: [],
  testimonials: [],
};
