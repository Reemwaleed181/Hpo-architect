# HPO Architect — Reference-Based Update Notes

## Deployment safety

- The Vercel project metadata was **not changed**.
- The public live URL remains: https://hpo-architect.vercel.app
- The GitHub repository remains: https://github.com/Reemwaleed181/Hpo-architect
- `package.json`, Vite structure, build command, and output directory remain compatible with the existing Vercel deployment.
- `node_modules` is intentionally not included. Vercel installs dependencies during deployment.
- `dist` is generated output and is intentionally not included in the handoff ZIP; Vercel rebuilds it from source.

## Scientific changes

- Removed numeric HPO method scores (`+25`, `-15`, etc.).
- Removed score thresholds for `Strong / Reasonable / Weak Match`.
- Removed arbitrary rules such as `trial >= 5 min`, `params > 20`, `workers >= 16`, and `samples < 2000`.
- Replaced them with explicit literature-informed conditions and method prerequisites.
- Added scientific references directly to recommendation, reasoning, validation and blueprint outputs.
- Added `SCIENTIFIC_BASIS.md` with a rule-to-reference matrix.
- Retained `Strong Match / Reasonable Match / Weak Match` only for presentation continuity; the UI now explicitly states that these are qualitative applicability labels, not scores/probabilities.
- Preserved the submitted Expensive XGBoost demo result: **Bayesian Optimization — Strong Match**.
- Removed arbitrary values from starter code (`n_trials=50`, `cv=3`, `factor=3`) and replaced them with explicit user-defined placeholders.

## Validation performed in this handoff

- TypeScript/TSX source passed a static compile check using local type stubs (used because the execution environment could not reach the npm registry).
- The core `hpo-engine.ts` and `references.ts` were compiled with TypeScript and executed with Node for all three presets.
- Verified preset outputs:
  - Small Random Forest → Grid Search
  - Expensive XGBoost → Bayesian Optimization
  - Deep Neural Network → Bayesian Optimization (primary); Hyperband / ASHA / Bayesian + Multi-Fidelity / BOHB remain applicable alternatives

A full `npm ci && npm run build` should be run on a machine with npm registry access before pushing. Vercel will also run the production build after the GitHub push.

- Added explicit Random Search limitation: it does not use previous trial outcomes to guide later configurations.
- Clarified that Strong / Reasonable / Weak are author-developed qualitative applicability labels, not scientific scores or probabilities.
- Kept the Deep Neural Network preset aligned with the submitted presentation: Bayesian Optimization remains primary, while resource-aware methods are exposed as literature-supported alternatives rather than being promoted to primary without evidence that low-fidelity rankings are reliable.
