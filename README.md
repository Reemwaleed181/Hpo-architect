# HPO Architect

### Design the Search Before You Run the Search

**Live application:** https://hpo-architect.vercel.app  
**GitHub repository:** https://github.com/Reemwaleed181/Hpo-architect

HPO Architect is a **literature-informed, rule-based decision-support tool** for designing hyperparameter optimization experiments before compute resources are spent.

It evaluates:

- search-space structure
- exact finite-grid feasibility when the grid is explicitly enumerable
- full-trial cost and total compute budget
- parallel resources
- iterative training behavior
- early-stopping / intermediate-metric capability
- validation requirements

It then provides a primary HPO recommendation, applicable alternatives, transparent reasoning, references, and an experiment blueprint.

> HPO Architect does **not** train the model, predict model accuracy, estimate the probability that one method is best, or guarantee a global optimum.

![HPO Architect](docs/screenshots/01-hero.png)

## Scientific traceability

The recommendation engine is implemented in `src/lib/hpo-engine.ts` and the reference registry is in `src/lib/references.ts`.

The previous arbitrary numerical scoring logic has been removed. There are no `+25 / -15` method scores and no scientific claim based on thresholds such as `trialTime >= 5`, `params > 20`, or `Strong Match >= 20`.

The current engine translates published HPO principles and method prerequisites into explicit rules. Scientific evidence is surfaced in the Analysis, Recommendation, Reasoning Path and Blueprint views.

See **[SCIENTIFIC_BASIS.md](SCIENTIFIC_BASIS.md)** for the complete rule-to-reference matrix and the distinction between literature-backed content and author-developed implementation choices.

### About the Match labels

`Strong Match`, `Reasonable Match`, and `Weak Match` are retained for continuity with the submitted presentation/UI. They are **author-developed qualitative applicability labels** describing how closely the entered experiment satisfies literature-supported conditions/prerequisites. They are not accuracy scores, probabilities, confidence values, performance estimates, or empirically calibrated rankings.

## Core Workflow

### 01 — Define

Define the ML task, model family, objective metric, dataset characteristics, total compute budget, parallel resources, and training behavior.

![Experiment Designer](docs/screenshots/02-experiment-designer.png)

### 02 — Search Space

Represent continuous, integer, discrete, categorical, and conditional parameters. Grid Search requires an explicitly finite/discretized space before an exact exhaustive size can be calculated.

Scientific basis: Feurer & Hutter (2019); Bischl et al. (2023).

![Search Space Builder](docs/screenshots/03-search-space.png)

### 03 — Analyze

HPO Architect evaluates:

- affordable full-trial equivalents (`total compute budget ÷ full-trial cost`)
- exact Grid Search feasibility when the space is enumerable
- search-space structural diagnostics
- validation strategy
- compute and parallel-resource constraints

No arbitrary scientific threshold is used to classify a trial as “expensive” or a dataset as “small”.

![Experiment Analysis](docs/screenshots/04-analysis.png)

### 04 — Decide

The system evaluates these HPO strategy categories:

- Grid Search
- Random Search
- Bayesian Optimization
- Successive Halving
- Hyperband
- ASHA
- Bayesian + Multi-Fidelity
- BOHB

The recommendation is condition-based and literature-informed; applicable alternatives remain visible for empirical comparison.

![HPO Recommendation](docs/screenshots/05-recommendation.png)

## Transparent HPO Reasoning

HPO Architect exposes the explicit decision trace:

**Observation → Implication → Favored Strategy → Final Decision → Scientific Basis**

Recommendations come from explicit rules rather than hidden model predictions or arbitrary numerical method scores.

![HPO Reasoning Path](docs/screenshots/06-reasoning-path.png)

## Strategy Comparison

The comparison is **case-conditional, not a universal ranking**. The correct empirical winner can only be established by running candidate HPO methods under comparable dataset, validation and compute conditions.

![Strategy Comparison](docs/screenshots/07-decision-comparison.png)

## HPO Experiment Blueprint

The final stage creates an author-developed structured experiment plan containing:

1. Experiment
2. Search Space
3. Compute
4. Recommended Strategy
5. Validation
6. Resource Strategy
7. Reproducibility
8. Execution Plan
9. Warnings
10. Scientific references used by the recommendation

Blueprints can be copied or exported as TXT, JSON, or YAML, and can be printed or saved as PDF from the browser.

![HPO Blueprint](docs/screenshots/08-blueprint.png)

## Implementation Starter

The application provides starter templates for:

- scikit-learn `GridSearchCV`
- scikit-learn `RandomizedSearchCV`
- Optuna model-based optimization
- Successive Halving
- Optuna pruning / multi-fidelity optimization

Generated code is a starter only. Arbitrary defaults such as `n_trials=50`, `cv=3`, and `factor=3` have been removed; run count, validation splitters, and resource-reduction settings remain explicit user-defined placeholders.

## Educational Scenarios

The scenario numbers below are **illustrative author-defined examples**, not published scientific thresholds.

### Small Random Forest

- 2 hyperparameters
- 6 explicitly finite Grid configurations
- 2 min per full trial
- 60 min total compute budget
- Primary rule-based recommendation: **Grid Search** because the complete declared finite grid fits the budget.

### Expensive XGBoost

- 3 search dimensions
- continuous dimensions without Grid discretization
- 20 min per full trial
- 180 min total compute budget
- no iterative early stopping
- Primary rule-based recommendation: **Bayesian Optimization** because exact exhaustive Grid Search is not defined without discretization and model-based sequential search is applicable to the continuous/integer space.

This preserves the recommendation used in the submitted PowerPoint/live-demo screenshots.

### Deep Neural Network

- continuous search dimensions
- iterative training
- intermediate metrics / early stopping
- multiple workers
- Primary literature-informed recommendation: **Bayesian Optimization** because continuous search dimensions make model-based sequential HPO applicable.
- **Hyperband, ASHA, Bayesian + Multi-Fidelity, and BOHB remain applicable alternatives** because iterative training and early stopping are available. The preset does not assert that intermediate / low-fidelity rankings are reliable enough to make a multi-fidelity method the primary choice without empirical evidence.
- Hyperband, ASHA and Bayesian Optimization remain applicable alternatives.

## Validation Integrity

The advisor no longer uses a fixed sample threshold such as `samples < 2000`.

- Time-series data → time-aware ordered validation.
- Imbalanced classification → stratified validation is suggested as an evaluation design option.
- Other cases → cross-validation or hold-out should be chosen for the data and compute context rather than by a fixed sample-count rule.
- The final test set remains separate from HPO/model selection and is used for final reporting.

Scientific basis: Cawley & Talbot (2010); Kohavi (1995); Bergmeir et al. (2018); Bischl et al. (2023).

## Training Optimizer vs HPO Strategy

| | Training optimizer | HPO strategy |
|---|---|---|
| Examples | SGD, Adam, AdamW | Grid Search, Bayesian Optimization, Hyperband |
| Selects or updates | Model parameters | Hyperparameters |
| Typical targets | Weights and biases | Learning rate, batch size, depth, dropout |
| Operates | During one model-training run | Across multiple model configurations |

## Presentation Mode

Presentation Mode keeps the same demonstration workflow used in the project presentation:

- experiment summary
- search space and compute analysis
- Grid feasibility
- recommendation
- reasoning path
- decision diagram
- strategy comparison
- blueprint summary

Keyboard controls:

- `←` Previous
- `→` Next
- `Esc` Exit

![Presentation Mode](docs/screenshots/09-presentation-mode.png)

## Responsive Design

HPO Architect supports desktop, tablet, and mobile layouts.

![Mobile HPO Architect](docs/screenshots/10-mobile.png)

## Technology Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts

The application is frontend-only and stores saved experiments in browser `localStorage`.

## Running Locally

`node_modules` is intentionally **not included** in the repository/archive.

```bash
git clone https://github.com/Reemwaleed181/Hpo-architect.git
cd Hpo-architect
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Vercel Deployment

The existing Vercel/GitHub deployment structure is preserved.

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Live URL: https://hpo-architect.vercel.app
- Repository: https://github.com/Reemwaleed181/Hpo-architect

Vercel installs dependencies during deployment; a local `node_modules` folder is not required in GitHub.

## Core Scientific References

- Feurer, M., & Hutter, F. (2019). *Hyperparameter Optimization*. Springer. https://doi.org/10.1007/978-3-030-05318-5_1
- Bischl, B., et al. (2023). *Hyperparameter optimization: Foundations, algorithms, best practices, and open challenges*. WIREs Data Mining and Knowledge Discovery, 13(2), e1484. https://doi.org/10.1002/widm.1484
- Bergstra, J., & Bengio, Y. (2012). Random search for hyper-parameter optimization. JMLR, 13, 281–305. https://www.jmlr.org/papers/v13/bergstra12a.html
- Snoek, J., Larochelle, H., & Adams, R. P. (2012). Practical Bayesian Optimization of Machine Learning Algorithms. NeurIPS 25. https://papers.nips.cc/paper_files/paper/2012/hash/05311655a15b75fab86956663e1819cd-Abstract.html
- Jamieson, K., & Talwalkar, A. (2016). Non-stochastic best arm identification and hyperparameter optimization. AISTATS / PMLR 51. https://proceedings.mlr.press/v51/jamieson16.html
- Li, L., et al. (2018). Hyperband. JMLR, 18(185), 1–52. https://www.jmlr.org/papers/v18/16-558.html
- Li, L., et al. (2020). A System for Massively Parallel Hyperparameter Tuning. MLSys 2020. https://proceedings.mlsys.org/paper_files/paper/2020/hash/a06f20b349c6cf09a6b171c71b88bbfc-Abstract.html
- Falkner, S., Klein, A., & Hutter, F. (2018). BOHB. ICML / PMLR 80. https://proceedings.mlr.press/v80/falkner18a.html
- Cawley, G. C., & Talbot, N. L. C. (2010). On Over-fitting in Model Selection and Subsequent Selection Bias in Performance Evaluation. JMLR, 11, 2079–2107. https://www.jmlr.org/papers/v11/cawley10a.html
