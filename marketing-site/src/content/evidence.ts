const PR_URL =
  "https://github.com/speechlabinc/translate-ui-react/pull/1995";
const GITHUB_ISSUES_BASE =
  "https://github.com/speechlabinc/translate-ui-react/issues";

export interface BugEntry {
  issueNumber: string;
  href: string;
  description: string;
}

export interface EvidenceStat {
  value: string;
  label: string;
  sublabel: string;
  citationHref: string;
}

export const BRANCH_B_BUGS: BugEntry[] = [
  {
    issueNumber: "#1931",
    href: `${GITHUB_ISSUES_BASE}/1931`,
    description: "Segment drag no-op on collision boundary",
  },
  {
    issueNumber: "#1921",
    href: `${GITHUB_ISSUES_BASE}/1921`,
    description: "Resize handle flicker on rapid interaction",
  },
  {
    issueNumber: "#1927",
    href: `${GITHUB_ISSUES_BASE}/1927`,
    description: "seekTo frame offset regression",
  },
  {
    issueNumber: "#1956",
    href: `${GITHUB_ISSUES_BASE}/1956`,
    description: "WaveSurfer instance leak on unmount",
  },
  {
    issueNumber: "#1933",
    href: `${GITHUB_ISSUES_BASE}/1933`,
    description: "Playhead clock drift under setClock",
  },
  {
    issueNumber: "#1960",
    href: `${GITHUB_ISSUES_BASE}/1960`,
    description: "CSS z-index regression on segment stack",
  },
  {
    issueNumber: "#1964",
    href: `${GITHUB_ISSUES_BASE}/1964`,
    description: "Touch dispatch missed on scroll-locked container",
  },
  {
    issueNumber: "#1967",
    href: `${GITHUB_ISSUES_BASE}/1967`,
    description: "dispatchDrag off-by-seg.x for segment 0",
  },
];

export const EVIDENCE_STATS: EvidenceStat[] = [
  {
    value: "8",
    label: "historical bugs locked in",
    sublabel: "across the waveform editor",
    citationHref: PR_URL,
  },
  {
    value: "9 specs + 37 tests",
    label: "all GREEN",
    sublabel: "Chromium, Firefox, WebKit",
    citationHref: PR_URL,
  },
  {
    value: "0%",
    label: "CI flake rate",
    sublabel: "baseline was 5–15%",
    citationHref: PR_URL,
  },
  {
    value: "1",
    label: "harness bug self-caught",
    sublabel: "dispatchDrag off-by-seg.x",
    citationHref: PR_URL,
  },
];

export { PR_URL };
