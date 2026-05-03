import { useState, useMemo, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, Link } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info, Calculator, InfoIcon, Printer, BookOpen, ArrowLeft } from "lucide-react";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const SITE_URL = "https://evm-calculator.replit.app";

// Formatter utilities
const formatMoney = (val: number | undefined | null) => {
  if (val === undefined || val === null || isNaN(val) || !isFinite(val)) return "N/A";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
};

const formatIndex = (val: number | undefined | null) => {
  if (val === undefined || val === null || isNaN(val) || !isFinite(val)) return "N/A";
  return val.toFixed(3);
};

type MetricStatus = "good" | "bad" | "neutral";

const getVarianceStatus = (val: number | undefined | null): MetricStatus => {
  if (val === undefined || val === null || isNaN(val) || !isFinite(val)) return "neutral";
  return val >= 0 ? "good" : "bad";
};

const getIndexStatus = (val: number | undefined | null): MetricStatus => {
  if (val === undefined || val === null || isNaN(val) || !isFinite(val)) return "neutral";
  return val >= 1 ? "good" : "bad";
};

// TCPI is interpreted in the opposite direction from CPI/SPI:
// TCPI <= 1.0 means the remaining work can be done at or below the planned rate (favorable).
// TCPI > 1.0 means the team must outperform the planned rate to finish on budget (warning).
const getTcpiStatus = (val: number | undefined | null): MetricStatus => {
  if (val === undefined || val === null || isNaN(val) || !isFinite(val)) return "neutral";
  return val <= 1 ? "good" : "bad";
};

// Set per-route document head fields
function useSeo({ title, description, canonical }: { title: string; description: string; canonical: string }) {
  useEffect(() => {
    document.title = title;
    const setMeta = (selector: string, attr: string, value: string, create: () => HTMLElement) => {
      let el = document.head.querySelector(selector) as HTMLElement | null;
      if (!el) {
        el = create();
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };
    setMeta('meta[name="description"]', "content", description, () => {
      const m = document.createElement("meta");
      m.setAttribute("name", "description");
      return m;
    });
    setMeta('link[rel="canonical"]', "href", canonical, () => {
      const l = document.createElement("link");
      l.setAttribute("rel", "canonical");
      return l;
    });
    setMeta('meta[property="og:title"]', "content", title, () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:title");
      return m;
    });
    setMeta('meta[property="og:description"]', "content", description, () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:description");
      return m;
    });
    setMeta('meta[property="og:url"]', "content", canonical, () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:url");
      return m;
    });
  }, [title, description, canonical]);
}

// PMP formulas reference list reused in the cheat sheet and exam-mode dialog
const PMP_FORMULAS: { name: string; formula: string; meaning: string }[] = [
  { name: "Cost Variance", formula: "CV = EV − AC", meaning: "Positive = under budget; negative = over budget." },
  { name: "Schedule Variance", formula: "SV = EV − PV", meaning: "Positive = ahead of schedule; negative = behind." },
  { name: "Cost Performance Index", formula: "CPI = EV / AC", meaning: "≥ 1.0 efficient; < 1.0 inefficient." },
  { name: "Schedule Performance Index", formula: "SPI = EV / PV", meaning: "≥ 1.0 on/ahead; < 1.0 behind." },
  { name: "Estimate at Completion (typical)", formula: "EAC = BAC / CPI", meaning: "Forecast assuming current cost performance continues." },
  { name: "Estimate at Completion (atypical)", formula: "EAC = AC + (BAC − EV)", meaning: "Use when current variance is a one-off." },
  { name: "Estimate to Complete", formula: "ETC = EAC − AC", meaning: "Cost expected from now to finish." },
  { name: "Variance at Completion", formula: "VAC = BAC − EAC", meaning: "Forecast surplus (positive) or deficit (negative)." },
  { name: "To-Complete Performance Index", formula: "TCPI = (BAC − EV) / (BAC − AC)", meaning: "≤ 1.0 achievable; > 1.0 means future work must beat the original rate." },
];

function PmpExamButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 no-print" data-testid="button-pmp-exam-mode">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <span>PMP Exam Mode</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>PMP Formula Reference Sheet</DialogTitle>
          <DialogDescription>
            All standard Earned Value Management formulas at a glance, ready for memorization before the PMP exam.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {PMP_FORMULAS.map((f) => (
            <div key={f.name} className="border rounded-md p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-foreground">{f.name}</span>
                <code className="font-mono text-sm bg-muted px-2 py-0.5 rounded">{f.formula}</code>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{f.meaning}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-2">
            See the full <a href="/pmp-formulas/" className="underline hover:text-foreground">PMP Formulas cheat sheet</a> for printable layout.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PrintButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 no-print"
      onClick={() => window.print()}
      data-testid="button-print-pdf"
    >
      <Printer className="h-4 w-4" aria-hidden="true" />
      <span>Export to PDF</span>
    </Button>
  );
}

function SiteHeader() {
  return (
    <header className="border-b bg-card shadow-sm sticky top-0 z-10 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-2 py-1 -mx-2" aria-label="EVM Calculator home">
          <Calculator className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="font-bold text-base sm:text-lg tracking-tight">EVM Calculator</span>
        </Link>
        <div className="flex items-center gap-2">
          <PmpExamButton />
          <PrintButton />
          <nav aria-label="Primary" className="hidden md:flex items-center gap-4 ml-2 text-sm font-medium text-muted-foreground">
            <Link href="/cpi-calculator" className="hover:text-foreground">CPI</Link>
            <Link href="/eac-calculator" className="hover:text-foreground">EAC</Link>
            <a href="/pmp-formulas/" className="hover:text-foreground">PMP Formulas</a>
            <a href="/about/" className="hover:text-foreground">About</a>
          </nav>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-20 border-t bg-card no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} EVM Calculator. All calculations run in your browser.</p>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2 justify-center">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <Link href="/cpi-calculator" className="hover:text-foreground">CPI Calculator</Link>
          <Link href="/eac-calculator" className="hover:text-foreground">EAC Calculator</Link>
          <a href="/pmp-formulas/" className="hover:text-foreground">PMP Formulas</a>
          <a href="/what-is-budget-at-completion/" className="hover:text-foreground">What is BAC?</a>
          <a href="/about/" className="hover:text-foreground">About</a>
          <a href="/privacy-policy/" className="hover:text-foreground">Privacy</a>
          <a href="/sitemap.xml" className="hover:text-foreground">Sitemap</a>
        </nav>
      </div>
    </footer>
  );
}

type MetricCardProps = {
  title: string;
  formula: string;
  value: number | undefined;
  explanation: string;
  status: MetricStatus;
  goodLabel: string;
  badLabel: string;
  isMoney?: boolean;
};

function MetricCard({ title, formula, value, explanation, status, goodLabel, badLabel, isMoney = false }: MetricCardProps) {
  let badgeText = "N/A";
  let badgeVariant: "default" | "destructive" | "secondary" | "outline" = "outline";
  let badgeClass = "";

  if (status === "good") {
    badgeText = goodLabel;
    badgeVariant = "default";
    badgeClass = "bg-green-600 hover:bg-green-700 text-white border-transparent";
  } else if (status === "bad") {
    badgeText = badLabel;
    badgeVariant = "destructive";
  } else if (status === "neutral" && value !== undefined) {
    badgeText = "Informational";
    badgeVariant = "secondary";
  }

  const displayValue = isMoney ? formatMoney(value) : formatIndex(value);

  return (
    <Card className="transition-all hover:shadow-md flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight">{title}</CardTitle>
            <CardDescription className="text-xs font-mono mt-1 opacity-70">{formula}</CardDescription>
          </div>
          {badgeText !== "N/A" && badgeText !== "Informational" && (
            <Badge variant={badgeVariant} className={`text-[10px] uppercase font-bold tracking-wider ${badgeClass}`}>
              {badgeText}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-4 flex-grow">
        <div className="text-3xl font-mono font-bold tracking-tight text-foreground transition-all">
          {displayValue}
        </div>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          {explanation}
        </p>
      </CardContent>
    </Card>
  );
}

function NumberField({
  id,
  label,
  hint,
  tooltip,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  tooltip: string;
  placeholder: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="font-semibold text-foreground">
          {label} <span className="font-normal text-muted-foreground ml-1">{hint}</span>
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" aria-hidden="true" focusable="false" />
          </TooltipTrigger>
          <TooltipContent><p className="w-[200px] text-sm">{tooltip}</p></TooltipContent>
        </Tooltip>
      </div>
      <Input
        id={id}
        data-testid={`input-${id}`}
        type="number"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") onChange(undefined);
          else {
            const n = parseFloat(v);
            onChange(isNaN(n) ? undefined : n);
          }
        }}
        className="font-mono text-base h-11 focus-visible:ring-primary"
      />
    </div>
  );
}

function Home() {
  useSeo({
    title: "EVM Calculator — Budget at Completion, CPI, SPI, EAC",
    description: "Free Earned Value Management calculator. Enter BAC, PV, EV, AC and instantly compute CPI, SPI, CV, SV, EAC, ETC, VAC, and TCPI with formulas and explanations.",
    canonical: `${SITE_URL}/`,
  });

  const [bac, setBac] = useState<number | undefined>(undefined);
  const [pv, setPv] = useState<number | undefined>(undefined);
  const [ev, setEv] = useState<number | undefined>(undefined);
  const [ac, setAc] = useState<number | undefined>(undefined);

  const metrics = useMemo(() => {
    const hasEv = ev !== undefined;
    const hasAc = ac !== undefined;
    const hasPv = pv !== undefined;
    const hasBac = bac !== undefined;

    const cpi = (hasEv && hasAc && ac !== 0) ? ev / ac : undefined;
    const spi = (hasEv && hasPv && pv !== 0) ? ev / pv : undefined;
    const cv = (hasEv && hasAc) ? ev - ac : undefined;
    const sv = (hasEv && hasPv) ? ev - pv : undefined;
    const eac = (hasBac && cpi !== undefined && cpi !== 0) ? bac / cpi : undefined;
    const etc = (eac !== undefined && hasAc) ? eac - ac : undefined;
    const vac = (hasBac && eac !== undefined) ? bac - eac : undefined;
    const tcpi = (hasBac && hasEv && hasAc && (bac - ac) !== 0) ? (bac - ev) / (bac - ac) : undefined;

    return { cpi, spi, cv, sv, eac, etc, vac, tcpi };
  }, [bac, pv, ev, ac]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
      <div className="max-w-3xl mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Earned Value Management Calculator</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          A precise, free tool for project managers and cost engineers to compute standard EVM metrics.
          Enter your project's BAC, PV, EV, and AC below to instantly calculate variances, indices, and forecasts including CPI, SPI, EAC, and TCPI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-muted/50 border-b pb-4">
              <CardTitle className="text-base">Project Data</CardTitle>
              <CardDescription>Enter values to compute metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <NumberField id="bac" label="BAC" hint="Budget at Completion" tooltip="Total budget allocated to the project." placeholder="e.g. 100000" value={bac} onChange={setBac} />
              <NumberField id="pv" label="PV" hint="Planned Value" tooltip="Budgeted cost of work scheduled to be completed by now." placeholder="e.g. 50000" value={pv} onChange={setPv} />
              <NumberField id="ev" label="EV" hint="Earned Value" tooltip="Budgeted cost of work actually performed so far." placeholder="e.g. 45000" value={ev} onChange={setEv} />
              <NumberField id="ac" label="AC" hint="Actual Cost" tooltip="Actual cost incurred for the work performed so far." placeholder="e.g. 55000" value={ac} onChange={setAc} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetricCard title="Cost Variance (CV)" formula="CV = EV - AC" value={metrics.cv} explanation="The difference between the value of work completed and its actual cost." status={getVarianceStatus(metrics.cv)} goodLabel="Under Budget" badLabel="Over Budget" isMoney />
            <MetricCard title="Schedule Variance (SV)" formula="SV = EV - PV" value={metrics.sv} explanation="The difference between the value of work completed and the value of work planned." status={getVarianceStatus(metrics.sv)} goodLabel="Ahead" badLabel="Behind" isMoney />
            <MetricCard title="Cost Performance Index (CPI)" formula="CPI = EV / AC" value={metrics.cpi} explanation="Measure of the cost efficiency of budgeted resources." status={getIndexStatus(metrics.cpi)} goodLabel="Efficient" badLabel="Inefficient" />
            <MetricCard title="Schedule Performance Index (SPI)" formula="SPI = EV / PV" value={metrics.spi} explanation="Measure of schedule efficiency relative to the plan." status={getIndexStatus(metrics.spi)} goodLabel="Ahead" badLabel="Behind" />
            <MetricCard title="Estimate at Completion (EAC)" formula="EAC = BAC / CPI" value={metrics.eac} explanation="Expected total cost of completing all work, assuming current cost performance." status="neutral" goodLabel="" badLabel="" isMoney />
            <MetricCard title="Estimate to Complete (ETC)" formula="ETC = EAC - AC" value={metrics.etc} explanation="Expected cost required to finish all the remaining project work." status="neutral" goodLabel="" badLabel="" isMoney />
            <MetricCard title="Variance at Completion (VAC)" formula="VAC = BAC - EAC" value={metrics.vac} explanation="Projected budget surplus or deficit at the end of the project." status={getVarianceStatus(metrics.vac)} goodLabel="Surplus" badLabel="Deficit" isMoney />
            <MetricCard title="To-Complete Performance Index" formula="TCPI = (BAC - EV) / (BAC - AC)" value={metrics.tcpi} explanation="The cost efficiency required on remaining work to finish within the original BAC. Values above 1.0 mean the team must outperform the planned rate." status={getTcpiStatus(metrics.tcpi)} goodLabel="Achievable" badLabel="Stretch Required" />
          </div>
        </div>
      </div>

      <div className="mt-20 border-t pt-10">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Info className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          Glossary &amp; Cheat Sheet
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Inputs</h3>
            <dl className="space-y-4 text-sm">
              <div><dt className="font-semibold text-foreground">BAC (Budget at Completion)</dt><dd className="text-muted-foreground mt-1">The sum of all budgets established for the work to be performed.</dd></div>
              <div><dt className="font-semibold text-foreground">PV (Planned Value)</dt><dd className="text-muted-foreground mt-1">The authorized budget assigned to scheduled work. Also known as BCWS.</dd></div>
              <div><dt className="font-semibold text-foreground">EV (Earned Value)</dt><dd className="text-muted-foreground mt-1">The measure of work performed expressed in terms of the budget authorized for that work. Also known as BCWP.</dd></div>
              <div><dt className="font-semibold text-foreground">AC (Actual Cost)</dt><dd className="text-muted-foreground mt-1">The realized cost incurred for the work performed. Also known as ACWP.</dd></div>
            </dl>
          </div>
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Interpretation Rules</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex flex-col"><span className="font-semibold text-foreground">Variances (CV, SV, VAC)</span><span className="text-muted-foreground mt-1">Positive is good. Negative is bad. A positive CV means under budget; a positive SV means ahead of schedule.</span></li>
              <li className="flex flex-col"><span className="font-semibold text-foreground">Indices (CPI, SPI)</span><span className="text-muted-foreground mt-1">≥ 1.0 is on track; &lt; 1.0 is off track. A CPI of 1.2 means $1.20 of work for every $1 spent.</span></li>
              <li className="flex flex-col"><span className="font-semibold text-foreground">TCPI (inverted)</span><span className="text-muted-foreground mt-1">≤ 1.0 is achievable; &gt; 1.0 is a warning that remaining work must be done more efficiently than originally planned.</span></li>
            </ul>
          </div>
        </div>
      </div>

      <section className="mt-16 border-t pt-10" aria-labelledby="related-heading">
        <h2 id="related-heading" className="text-xl font-semibold mb-6">Focused calculators &amp; references</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/cpi-calculator" className="block border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="font-semibold">CPI Calculator</div>
            <p className="text-sm text-muted-foreground mt-1">Compute Cost Performance Index from EV and AC alone.</p>
          </Link>
          <Link href="/eac-calculator" className="block border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="font-semibold">EAC Calculator</div>
            <p className="text-sm text-muted-foreground mt-1">Forecast total project cost using BAC, EV, and AC.</p>
          </Link>
          <a href="/what-is-budget-at-completion/" className="block border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="font-semibold">What is Budget at Completion?</div>
            <p className="text-sm text-muted-foreground mt-1">Long-form guide to BAC, its role in EVM, and how to set it.</p>
          </a>
          <a href="/pmp-formulas/" className="block border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="font-semibold">PMP Formulas Cheat Sheet</div>
            <p className="text-sm text-muted-foreground mt-1">Printable reference of all 9 EVM formulas for the PMP exam.</p>
          </a>
        </div>
      </section>

      <section className="mt-20 border-t pt-10" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-2xl font-bold tracking-tight mb-6">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-5xl">
          <div><h3 className="font-semibold text-foreground">What is Earned Value Management (EVM)?</h3><p className="text-sm text-muted-foreground mt-1 leading-relaxed">EVM is a project management technique that integrates scope, schedule, and cost data to objectively measure project performance and forecast future outcomes by comparing planned, completed, and actual work.</p></div>
          <div><h3 className="font-semibold text-foreground">What do BAC, PV, EV, and AC mean?</h3><p className="text-sm text-muted-foreground mt-1 leading-relaxed">BAC is the total approved budget. PV is the budgeted cost of work scheduled. EV is the budgeted cost of work performed. AC is the actual cost of the work performed to date.</p></div>
          <div><h3 className="font-semibold text-foreground">How is the Cost Performance Index (CPI) calculated?</h3><p className="text-sm text-muted-foreground mt-1 leading-relaxed">CPI = EV / AC. A CPI of 1.0 or higher indicates the project is on or under budget; a CPI below 1.0 indicates it is over budget.</p></div>
          <div><h3 className="font-semibold text-foreground">How is the Schedule Performance Index (SPI) calculated?</h3><p className="text-sm text-muted-foreground mt-1 leading-relaxed">SPI = EV / PV. A value of 1.0 or higher means the project is on or ahead of schedule; below 1.0 means it is behind.</p></div>
          <div><h3 className="font-semibold text-foreground">What is Estimate at Completion (EAC)?</h3><p className="text-sm text-muted-foreground mt-1 leading-relaxed">EAC = BAC / CPI is the most common forecast: the projected total cost assuming current cost performance continues to the end of the project.</p></div>
          <div><h3 className="font-semibold text-foreground">Is this EVM Calculator free to use?</h3><p className="text-sm text-muted-foreground mt-1 leading-relaxed">Yes. The calculator is completely free, requires no signup, and runs entirely in your browser. No data is collected or transmitted.</p></div>
        </div>
      </section>
    </main>
  );
}

function SubCalculatorLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 no-print">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to full EVM Calculator
      </Link>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">{title}</h1>
      <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl">{description}</p>
      {children}
      <section className="mt-16 border-t pt-8 no-print" aria-label="Related references">
        <h2 className="text-base font-semibold mb-3">Related references</h2>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li><a className="hover:text-foreground underline underline-offset-2" href="/pmp-formulas/">PMP Formulas cheat sheet</a></li>
          <li><a className="hover:text-foreground underline underline-offset-2" href="/what-is-budget-at-completion/">What is Budget at Completion?</a></li>
          <li><Link className="hover:text-foreground underline underline-offset-2" href="/cpi-calculator">CPI Calculator</Link></li>
          <li><Link className="hover:text-foreground underline underline-offset-2" href="/eac-calculator">EAC Calculator</Link></li>
        </ul>
      </section>
    </main>
  );
}

function CpiCalculatorPage() {
  useSeo({
    title: "CPI Calculator — Cost Performance Index | EVM Calculator",
    description: "Free Cost Performance Index (CPI) calculator. Enter Earned Value and Actual Cost to compute CPI = EV / AC, with interpretation and examples.",
    canonical: `${SITE_URL}/cpi-calculator`,
  });

  const [ev, setEv] = useState<number | undefined>(undefined);
  const [ac, setAc] = useState<number | undefined>(undefined);
  const cpi = (ev !== undefined && ac !== undefined && ac !== 0) ? ev / ac : undefined;
  const status = getIndexStatus(cpi);

  return (
    <SubCalculatorLayout
      title="Cost Performance Index (CPI) Calculator"
      description="Cost Performance Index measures how efficiently the project is using its budget. CPI is calculated by dividing Earned Value by Actual Cost. A CPI of 1.0 or higher means the project is on or under budget; a CPI below 1.0 indicates cost overrun."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Card className="border-primary/20">
          <CardHeader className="bg-muted/50 border-b">
            <CardTitle className="text-base">Inputs</CardTitle>
            <CardDescription>CPI = EV / AC</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <NumberField id="cpi-ev" label="EV" hint="Earned Value" tooltip="Budgeted cost of work performed." placeholder="e.g. 45000" value={ev} onChange={setEv} />
            <NumberField id="cpi-ac" label="AC" hint="Actual Cost" tooltip="Real cost spent on the work performed." placeholder="e.g. 55000" value={ac} onChange={setAc} />
          </CardContent>
        </Card>
        <MetricCard
          title="Cost Performance Index (CPI)"
          formula="CPI = EV / AC"
          value={cpi}
          explanation="A CPI of 1.0 or higher means the project is delivering at least one dollar of work per dollar spent. Below 1.0 indicates cost inefficiency."
          status={status}
          goodLabel="Efficient"
          badLabel="Inefficient"
        />
      </div>
      <section className="mt-12 prose prose-slate max-w-none dark:prose-invert">
        <h2>How to interpret CPI</h2>
        <ul>
          <li><strong>CPI &gt; 1.0</strong> — favorable. The project is producing more value than its cost so far.</li>
          <li><strong>CPI = 1.0</strong> — exactly on budget. Earned and actual cost are equal.</li>
          <li><strong>CPI &lt; 1.0</strong> — unfavorable. Each dollar spent is producing less than a dollar of work.</li>
        </ul>
        <h2>Worked example</h2>
        <p>If a project has EV = $35,000 and AC = $38,000, then CPI = 35,000 / 38,000 = <strong>0.921</strong>. The project is delivering only 92.1 cents of value per dollar spent — a sign of cost overrun that should trigger a control action.</p>
      </section>
    </SubCalculatorLayout>
  );
}

function EacCalculatorPage() {
  useSeo({
    title: "EAC Calculator — Estimate at Completion | EVM Calculator",
    description: "Free Estimate at Completion (EAC) calculator. Enter BAC, EV, and AC to compute EAC = BAC / CPI and forecast total project cost.",
    canonical: `${SITE_URL}/eac-calculator`,
  });

  const [bac, setBac] = useState<number | undefined>(undefined);
  const [ev, setEv] = useState<number | undefined>(undefined);
  const [ac, setAc] = useState<number | undefined>(undefined);

  const cpi = (ev !== undefined && ac !== undefined && ac !== 0) ? ev / ac : undefined;
  const eac = (bac !== undefined && cpi !== undefined && cpi !== 0) ? bac / cpi : undefined;
  const vac = (bac !== undefined && eac !== undefined) ? bac - eac : undefined;

  return (
    <SubCalculatorLayout
      title="Estimate at Completion (EAC) Calculator"
      description="Estimate at Completion forecasts the total cost of the project given current performance. The most common formula assumes current cost performance continues: EAC = BAC / CPI. The calculator also reports projected variance at completion."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Card className="border-primary/20">
          <CardHeader className="bg-muted/50 border-b">
            <CardTitle className="text-base">Inputs</CardTitle>
            <CardDescription>EAC = BAC / CPI, where CPI = EV / AC</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <NumberField id="eac-bac" label="BAC" hint="Budget at Completion" tooltip="Total approved budget for the project." placeholder="e.g. 100000" value={bac} onChange={setBac} />
            <NumberField id="eac-ev" label="EV" hint="Earned Value" tooltip="Budgeted cost of work performed." placeholder="e.g. 35000" value={ev} onChange={setEv} />
            <NumberField id="eac-ac" label="AC" hint="Actual Cost" tooltip="Real cost spent on the work performed." placeholder="e.g. 38000" value={ac} onChange={setAc} />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <MetricCard
            title="Estimate at Completion (EAC)"
            formula="EAC = BAC / CPI"
            value={eac}
            explanation="The forecasted total cost of the project assuming the current cost performance continues to the end."
            status="neutral"
            goodLabel=""
            badLabel=""
            isMoney
          />
          <MetricCard
            title="Variance at Completion (VAC)"
            formula="VAC = BAC - EAC"
            value={vac}
            explanation="Projected surplus (positive) or deficit (negative) versus the original budget."
            status={getVarianceStatus(vac)}
            goodLabel="Surplus"
            badLabel="Deficit"
            isMoney
          />
        </div>
      </div>
      <section className="mt-12 prose prose-slate max-w-none dark:prose-invert">
        <h2>Choosing an EAC formula</h2>
        <p>Project managers typically use one of three EAC formulas depending on the situation:</p>
        <ul>
          <li><strong>EAC = BAC / CPI</strong> — assumes current cost performance continues. Default for most projects.</li>
          <li><strong>EAC = AC + (BAC − EV)</strong> — assumes the current variance was a one-off and remaining work will run at the original rate.</li>
          <li><strong>EAC = AC + ((BAC − EV) / (CPI × SPI))</strong> — assumes both cost and schedule performance will continue.</li>
        </ul>
        <h2>Worked example</h2>
        <p>BAC = $100,000, EV = $35,000, AC = $38,000. CPI = 35,000 / 38,000 = 0.9211. EAC = 100,000 / 0.9211 = <strong>$108,571.43</strong>. VAC = 100,000 − 108,571.43 = <strong>−$8,571.43</strong>, indicating a projected ~$8.5K overrun.</p>
      </section>
    </SubCalculatorLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/cpi-calculator" component={CpiCalculatorPage} />
      <Route path="/eac-calculator" component={EacCalculatorPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={150}>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <div className="min-h-[100dvh] w-full bg-background pb-20 selection:bg-primary/20 flex flex-col">
            <SiteHeader />
            <div className="flex-1">
              <Router />
            </div>
            <SiteFooter />
          </div>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
