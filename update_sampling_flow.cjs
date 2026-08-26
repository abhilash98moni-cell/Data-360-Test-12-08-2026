const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

// 1. Add new views
code = code.replace(
  "const [view, setView] = useState<'dashboard' | 'population' | 'testing_list' | 'review' | 'summary'>('dashboard');",
  "const [view, setView] = useState<'dashboard' | 'overview' | 'population_records' | 'sampling_plan' | 'select_sample' | 'testing_list' | 'review' | 'summary'>('dashboard');"
);

// 2. Add sampling method state
const stateAnchor = "const [validationError, setValidationError] = useState('');";
code = code.replace(
  stateAnchor,
  stateAnchor + "\n  const [samplingMethod, setSamplingMethod] = useState<'Judgmental / Targeted' | 'Random' | 'Systematic' | 'Monetary / Value-Based'>('Judgmental / Targeted');\n  const [selectionRationale, setSelectionRationale] = useState('');\n  const [randomSampleSize, setRandomSampleSize] = useState(40);\n  const [sysSampleSize, setSysSampleSize] = useState(40);\n  const [sysStart, setSysStart] = useState(1);\n  const [monetaryMin, setMonetaryMin] = useState('');\n  const [monetaryTop, setMonetaryTop] = useState('');"
);

// 3. Change handleSelectPopulation to navigate to 'overview'
code = code.replace(
  "setView('population');",
  "setView('overview');"
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
