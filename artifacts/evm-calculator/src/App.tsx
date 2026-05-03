import { useState, useMemo } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Info, Calculator, InfoIcon } from "lucide-react";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// EVM Math utilities
type EVMInputs = {
  bac: number | undefined;
  pv: number | undefined;
  ev: number | undefined;
  ac: number | undefined;
};

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
  if (val >= 0) return "good";
  return "bad";
};

const getIndexStatus = (val: number | undefined | null): MetricStatus => {
  if (val === undefined || val === null || isNaN(val) || !isFinite(val)) return "neutral";
  return val >= 1 ? "good" : "bad";
};

function Home() {
  const [bac, setBac] = useState<number | undefined>(undefined);
  const [pv, setPv] = useState<number | undefined>(undefined);
  const [ev, setEv] = useState<number | undefined>(undefined);
  const [ac, setAc] = useState<number | undefined>(undefined);

  // Parse strings to numbers gracefully
  const handleInput = (val: string, setter: (val: number | undefined) => void) => {
    if (val === "") {
      setter(undefined);
    } else {
      const num = parseFloat(val);
      setter(isNaN(num) ? undefined : num);
    }
  };

  // Compute metrics
  const metrics = useMemo(() => {
    const hasEv = ev !== undefined;
    const hasAc = ac !== undefined;
    const hasPv = pv !== undefined;
    const hasBac = bac !== undefined;

    // CPI = EV / AC
    const cpi = (hasEv && hasAc && ac !== 0) ? ev / ac : undefined;
    // SPI = EV / PV
    const spi = (hasEv && hasPv && pv !== 0) ? ev / pv : undefined;
    // CV = EV - AC
    const cv = (hasEv && hasAc) ? ev - ac : undefined;
    // SV = EV - PV
    const sv = (hasEv && hasPv) ? ev - pv : undefined;

    // EAC = BAC / CPI
    const eac = (hasBac && cpi !== undefined && cpi !== 0) ? bac / cpi : undefined;
    // ETC = EAC - AC
    const etc = (eac !== undefined && hasAc) ? eac - ac : undefined;
    // VAC = BAC - EAC
    const vac = (hasBac && eac !== undefined) ? bac - eac : undefined;
    
    // TCPI = (BAC - EV) / (BAC - AC)
    const tcpi = (hasBac && hasEv && hasAc && (bac - ac) !== 0) ? (bac - ev) / (bac - ac) : undefined;

    return { cpi, spi, cv, sv, eac, etc, vac, tcpi };
  }, [bac, pv, ev, ac]);

  const MetricCard = ({
    title,
    formula,
    value,
    explanation,
    status,
    goodLabel,
    badLabel,
    isMoney = false,
  }: {
    title: string;
    formula: string;
    value: number | undefined;
    explanation: string;
    status: MetricStatus;
    goodLabel: string;
    badLabel: string;
    isMoney?: boolean;
  }) => {
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
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background pb-20 selection:bg-primary/20">
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-2 py-1 -mx-2" aria-label="EVM Calculator home">
            <Calculator className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="font-bold text-lg tracking-tight">EVM Calculator</span>
          </a>
          <nav aria-label="Primary" className="text-sm font-medium text-muted-foreground flex items-center gap-4">
            <a href="/about/" className="hover:text-foreground">About</a>
            <a href="/privacy-policy/" className="hover:text-foreground hidden sm:inline">Privacy</a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="max-w-3xl mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Earned Value Management Calculator</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A precise, free tool for project managers and cost engineers to compute standard EVM metrics.
            Enter your project's BAC, PV, EV, and AC below to instantly calculate variances, indices, and forecasts including CPI, SPI, EAC, and TCPI.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Inputs */}
          <div className="lg:col-span-4 space-y-6 sticky top-24">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-muted/50 border-b pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  Project Data
                </CardTitle>
                <CardDescription>Enter values to compute metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bac" className="font-semibold text-foreground">BAC <span className="font-normal text-muted-foreground ml-1">Budget at Completion</span></Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" aria-hidden="true" focusable="false" />
                      </TooltipTrigger>
                      <TooltipContent><p className="w-[200px] text-sm">Total budget allocated to the project.</p></TooltipContent>
                    </Tooltip>
                  </div>
                  <Input 
                    id="bac" 
                    type="number" 
                    placeholder="e.g. 100000"
                    value={bac ?? ""} 
                    onChange={(e) => handleInput(e.target.value, setBac)}
                    className="font-mono text-base h-11 focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pv" className="font-semibold text-foreground">PV <span className="font-normal text-muted-foreground ml-1">Planned Value</span></Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" aria-hidden="true" focusable="false" />
                      </TooltipTrigger>
                      <TooltipContent><p className="w-[200px] text-sm">Budgeted cost of work scheduled to be completed by now.</p></TooltipContent>
                    </Tooltip>
                  </div>
                  <Input 
                    id="pv" 
                    type="number" 
                    placeholder="e.g. 50000"
                    value={pv ?? ""} 
                    onChange={(e) => handleInput(e.target.value, setPv)}
                    className="font-mono text-base h-11 focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ev" className="font-semibold text-foreground">EV <span className="font-normal text-muted-foreground ml-1">Earned Value</span></Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" aria-hidden="true" focusable="false" />
                      </TooltipTrigger>
                      <TooltipContent><p className="w-[200px] text-sm">Budgeted cost of work actually performed so far.</p></TooltipContent>
                    </Tooltip>
                  </div>
                  <Input 
                    id="ev" 
                    type="number" 
                    placeholder="e.g. 45000"
                    value={ev ?? ""} 
                    onChange={(e) => handleInput(e.target.value, setEv)}
                    className="font-mono text-base h-11 focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ac" className="font-semibold text-foreground">AC <span className="font-normal text-muted-foreground ml-1">Actual Cost</span></Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" aria-hidden="true" focusable="false" />
                      </TooltipTrigger>
                      <TooltipContent><p className="w-[200px] text-sm">Actual cost incurred for the work performed so far.</p></TooltipContent>
                    </Tooltip>
                  </div>
                  <Input 
                    id="ac" 
                    type="number" 
                    placeholder="e.g. 55000"
                    value={ac ?? ""} 
                    onChange={(e) => handleInput(e.target.value, setAc)}
                    className="font-mono text-base h-11 focus-visible:ring-primary"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Outputs Grid */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetricCard 
                title="Cost Variance (CV)"
                formula="CV = EV - AC"
                value={metrics.cv}
                explanation="The difference between the value of work completed and its actual cost."
                status={getVarianceStatus(metrics.cv)}
                goodLabel="Under Budget"
                badLabel="Over Budget"
                isMoney={true}
              />
              <MetricCard 
                title="Schedule Variance (SV)"
                formula="SV = EV - PV"
                value={metrics.sv}
                explanation="The difference between the value of work completed and the value of work planned."
                status={getVarianceStatus(metrics.sv)}
                goodLabel="Ahead"
                badLabel="Behind"
                isMoney={true}
              />
              <MetricCard 
                title="Cost Performance Index (CPI)"
                formula="CPI = EV / AC"
                value={metrics.cpi}
                explanation="Measure of the cost efficiency of budgeted resources."
                status={getIndexStatus(metrics.cpi)}
                goodLabel="Efficient"
                badLabel="Inefficient"
                isMoney={false}
              />
              <MetricCard 
                title="Schedule Performance Index (SPI)"
                formula="SPI = EV / PV"
                value={metrics.spi}
                explanation="Measure of schedule efficiency relative to the plan."
                status={getIndexStatus(metrics.spi)}
                goodLabel="Ahead"
                badLabel="Behind"
                isMoney={false}
              />
              <MetricCard 
                title="Estimate at Completion (EAC)"
                formula="EAC = BAC / CPI"
                value={metrics.eac}
                explanation="Expected total cost of completing all work, assuming current cost performance."
                status="neutral"
                goodLabel=""
                badLabel=""
                isMoney={true}
              />
              <MetricCard 
                title="Estimate to Complete (ETC)"
                formula="ETC = EAC - AC"
                value={metrics.etc}
                explanation="Expected cost required to finish all the remaining project work."
                status="neutral"
                goodLabel=""
                badLabel=""
                isMoney={true}
              />
              <MetricCard 
                title="Variance at Completion (VAC)"
                formula="VAC = BAC - EAC"
                value={metrics.vac}
                explanation="Projected budget surplus or deficit at the end of the project."
                status={getVarianceStatus(metrics.vac)}
                goodLabel="Surplus"
                badLabel="Deficit"
                isMoney={true}
              />
              <MetricCard 
                title="To-Complete Performance Index"
                formula="TCPI = (BAC - EV) / (BAC - AC)"
                value={metrics.tcpi}
                explanation="The cost performance required to complete the remaining work within the original budget."
                status={getIndexStatus(metrics.tcpi)}
                goodLabel="On Track"
                badLabel="Off Track"
                isMoney={false}
              />
            </div>
          </div>
        </div>

        {/* Glossary / Cheat Sheet */}
        <div className="mt-20 border-t pt-10">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            Glossary & Cheat Sheet
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Inputs</h4>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="font-semibold text-foreground">BAC (Budget at Completion)</dt>
                  <dd className="text-muted-foreground mt-1">The sum of all budgets established for the work to be performed.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">PV (Planned Value)</dt>
                  <dd className="text-muted-foreground mt-1">The authorized budget assigned to scheduled work. Also known as BCWS (Budgeted Cost of Work Scheduled).</dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">EV (Earned Value)</dt>
                  <dd className="text-muted-foreground mt-1">The measure of work performed expressed in terms of the budget authorized for that work. Also known as BCWP.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">AC (Actual Cost)</dt>
                  <dd className="text-muted-foreground mt-1">The realized cost incurred for the work performed on an activity during a specific time period. Also known as ACWP.</dd>
                </div>
              </dl>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Interpretation Rules</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex flex-col">
                  <span className="font-semibold text-foreground">Variances (CV, SV, VAC)</span>
                  <span className="text-muted-foreground mt-1">Positive is good. Negative is bad. A positive CV means you are under budget. A positive SV means you are ahead of schedule.</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-semibold text-foreground">Indices (CPI, SPI, TCPI)</span>
                  <span className="text-muted-foreground mt-1">Greater than or equal to 1.0 is on track. Less than 1.0 is off track. A CPI of 1.2 means you are getting $1.20 of work for every $1 spent.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <section className="mt-20 border-t pt-10" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-2xl font-bold tracking-tight mb-6">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-5xl">
            <div>
              <h3 className="font-semibold text-foreground">What is Earned Value Management (EVM)?</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">EVM is a project management technique that integrates scope, schedule, and cost data to objectively measure project performance and forecast future outcomes by comparing planned, completed, and actual work.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">What do BAC, PV, EV, and AC mean?</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">BAC is the total approved budget. PV is the budgeted cost of work scheduled. EV is the budgeted cost of work performed. AC is the actual cost of the work performed to date.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">How is the Cost Performance Index (CPI) calculated?</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">CPI = EV / AC. A CPI of 1.0 or higher indicates the project is on or under budget; a CPI below 1.0 indicates it is over budget.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">How is the Schedule Performance Index (SPI) calculated?</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">SPI = EV / PV. A value of 1.0 or higher means the project is on or ahead of schedule; below 1.0 means it is behind.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">What is Estimate at Completion (EAC)?</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">EAC = BAC / CPI is the most common forecast: the projected total cost assuming current cost performance continues to the end of the project.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Is this EVM Calculator free to use?</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">Yes. The calculator is completely free, requires no signup, and runs entirely in your browser. No data is collected or transmitted.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-20 border-t bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} EVM Calculator. All calculations run in your browser.</p>
          <nav aria-label="Footer" className="flex items-center gap-5">
            <a href="/" className="hover:text-foreground">Home</a>
            <a href="/about/" className="hover:text-foreground">About</a>
            <a href="/privacy-policy/" className="hover:text-foreground">Privacy</a>
            <a href="/sitemap.xml" className="hover:text-foreground">Sitemap</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={150}>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;