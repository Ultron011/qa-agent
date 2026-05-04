export interface InteractiveElement {
  selector: string;
  type: 'button' | 'link' | 'input' | 'form' | 'select' | 'modal-trigger';
  label?: string;
  attributes: Record<string, string>;
}

export interface PageInfo {
  url: string;
  title: string;
  elements: InteractiveElement[];
}

export interface SiteMap {
  rootUrl: string;
  pages: PageInfo[];
}

export type SuiteName = 'visual' | 'functional' | 'console' | 'accessibility' | 'performance';

export interface TestFailure {
  suite: SuiteName;
  page: string;
  description: string;
  screenshotPath?: string;
  raw: unknown;
}

export interface RawResults {
  siteMap: SiteMap;
  failures: TestFailure[];
  durationMs: number;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface Bug {
  id: string;
  severity: Severity;
  page: string;
  title: string;
  reproduction: string;
  expected: string;
  actual: string;
  suspectedFile?: string;
  screenshotPath?: string;
}

export interface BugList {
  bugs: Bug[];
  totalDurationMs: number;
}

export interface Expectation {
  category: string;
  description: string;
}

export interface RunConfig {
  url: string;
  repoPath: string;
  expectFile?: string;
  maxDepth: number;
  outputDir: string;
}
