# HPO Architect — Scientific Basis and Traceability

## Purpose

HPO Architect is a **literature-informed, rule-based decision-support tool**. It does not train models, predict accuracy, estimate the probability that one HPO method is best, or guarantee a global optimum.

The recommendation engine translates published HPO principles and algorithm prerequisites into explicit, inspectable conditions. It intentionally avoids arbitrary numeric suitability scores such as `+25`, `-15`, or fixed scientific thresholds such as “trial time >= 5 minutes”.

## What is literature-backed vs author-developed?

### Literature-backed

- Definitions of HPO, trials, search spaces, Grid Search, Random Search, Bayesian Optimization, Successive Halving, Hyperband, ASHA and BOHB.
- Requirements for finite/discretized Grid Search enumeration.
- Random Search as a model-free HPO baseline.
- Model-based / sequential Bayesian optimization.
- Multi-fidelity early-stopping logic for Successive Halving / Hyperband.
- ASHA's asynchronous parallel early-stopping design.
- BOHB's combination of model-based sampling and Hyperband-style resource allocation.
- Validation/model-selection separation and the risk of selection bias/validation overfitting.
- Time-aware validation cautions for time-series data.
- Stratification as an evaluation design option for classification.

### Author-developed implementation

These are implementation/design choices, **not scientific claims**:

- The name **HPO Architect** and interface layout.
- The five-step workflow: Define → Search Space → Analysis → Recommendation → Blueprint.
- The Blueprint document layout and export buttons.
- Example/preset values (for example: 20 min/trial or 180 min budget).
- The qualitative labels `Strong Match`, `Reasonable Match`, and `Weak Match` (author-developed UI labels, not scientific scores).

The match labels are now defined only as qualitative summaries of rule applicability:

- **Strong Match**: author-developed qualitative label for the primary method whose literature-supported conditions/prerequisites align with the entered experiment under the tool's transparent decision policy.
- **Reasonable Match**: the method is scientifically applicable but is presented as an alternative under the current conditions.
- **Weak Match**: a prerequisite is missing or the method conflicts with an explicit compute/search-space feasibility condition.

They are **not probabilities, accuracy estimates, confidence scores, or empirically calibrated rankings**.

## Rule-to-reference matrix

| Engine decision | Rule used by HPO Architect | Scientific basis |
|---|---|---|
| Grid Search exact size | Exact exhaustive Grid Search is reported only when the search space is explicitly finite/discretized and conditional branches do not make the generic Cartesian-product count invalid. | Feurer & Hutter (2019); Bischl et al. (2023) |
| Grid feasibility | The exact finite-grid trial count is multiplied by the user-provided full-trial cost and compared directly with the user-provided total compute budget. | Arithmetic feasibility calculation + Grid Search definition from Feurer & Hutter (2019) / Bischl et al. (2023) |
| Random Search | Retained as a model-free baseline that does not require exhaustive enumeration. | Bergstra & Bengio (2012) |
| Bayesian Optimization | Applicable when model-based sequential search is useful for non-exhaustive HPO; it uses observations from earlier evaluations to guide later ones. | Snoek et al. (2012); Shahriari et al. (2016); Bischl et al. (2023) |
| Successive Halving | Applicable only when iterative/intermediate evaluation is available and weak configurations can be stopped before full resource allocation. | Jamieson & Talwalkar (2016) |
| Hyperband | Applicable when partial-resource evaluations / early stopping are meaningful; uses multiple Successive Halving brackets/resource schedules. | Li et al. (2018) |
| ASHA | Applicable when iterative early-stopping information exists; parallel workers provide the asynchronous scheduling advantage described by ASHA. | Li et al. (2020) |
| BOHB | Applicable when both model-based configuration selection and Hyperband-style multi-fidelity resource allocation are available. | Falkner et al. (2018); Li et al. (2018) |
| Final test separation | The final test set is reserved for reporting after model/hyperparameter selection to reduce selection bias. | Cawley & Talbot (2010) |
| Time-series validation | Time-series validation must account for temporal dependence/order; ordinary random CV may be inappropriate depending on the process. | Bergmeir et al. (2018) |
| Stratified validation | Stratification is an established option for classification evaluation to preserve class proportions across folds. | Kohavi (1995) |

## Primary recommendation path

The engine uses no numeric scores. Its primary-candidate path is:

1. **Finite/discretized grid that fits the declared total compute budget** → Grid Search.
2. **Iterative training + early stopping + model-based search conditions** → BOHB (combined model-based + multi-fidelity method).
3. **Iterative training + early stopping + multiple workers** → ASHA.
4. **Iterative training + early stopping** → Hyperband.
5. **Continuous/integer search dimensions without a feasible exhaustive grid** → Bayesian Optimization.
6. Otherwise → Random Search baseline.

This path is a transparent synthesis of the method requirements above. It is a decision-support policy, not a proof that the selected method will outperform every alternative. When performance evidence is required, applicable methods should be compared empirically under the same dataset, validation protocol and compute budget.

## Validation advisor

The previous arbitrary sample-count rule (`samples < 2000`) has been removed.

The advisor now uses only defensible structural conditions:

- **Time series** → time-aware ordered validation.
- **Imbalanced classification** → stratified validation option.
- **Otherwise** → cross-validation or hold-out chosen according to the data and compute context; no fixed sample threshold is imposed.
- **Final test** → kept separate from HPO selection.

## Starter-code policy

Generated code is an implementation starter only. Arbitrary defaults such as `n_trials=50`, `cv=3`, or `factor=3` have been removed. The user must explicitly provide run-count, validation and resource-reduction settings appropriate to the experiment.

## References

1. Feurer, M., & Hutter, F. (2019). Hyperparameter Optimization. In *Automated Machine Learning: Methods, Systems, Challenges* (pp. 3–33). Springer. https://doi.org/10.1007/978-3-030-05318-5_1
2. Bischl, B., et al. (2023). Hyperparameter optimization: Foundations, algorithms, best practices, and open challenges. *WIREs Data Mining and Knowledge Discovery, 13*(2), e1484. https://doi.org/10.1002/widm.1484
3. Bergstra, J., & Bengio, Y. (2012). Random search for hyper-parameter optimization. *Journal of Machine Learning Research, 13*, 281–305. https://www.jmlr.org/papers/v13/bergstra12a.html
4. Snoek, J., Larochelle, H., & Adams, R. P. (2012). Practical Bayesian Optimization of Machine Learning Algorithms. *Advances in Neural Information Processing Systems 25*. https://papers.nips.cc/paper_files/paper/2012/hash/05311655a15b75fab86956663e1819cd-Abstract.html
5. Shahriari, B., Swersky, K., Wang, Z., Adams, R. P., & de Freitas, N. (2016). Taking the human out of the loop: A review of Bayesian optimization. *Proceedings of the IEEE, 104*(1), 148–175. https://doi.org/10.1109/JPROC.2015.2494218
6. Jamieson, K., & Talwalkar, A. (2016). Non-stochastic best arm identification and hyperparameter optimization. *AISTATS, PMLR 51*, 240–248. https://proceedings.mlr.press/v51/jamieson16.html
7. Li, L., Jamieson, K., DeSalvo, G., Rostamizadeh, A., & Talwalkar, A. (2018). Hyperband: A novel bandit-based approach to hyperparameter optimization. *Journal of Machine Learning Research, 18*(185), 1–52. https://www.jmlr.org/papers/v18/16-558.html
8. Li, L., Jamieson, K., Rostamizadeh, A., Gonina, E., Ben-Tzur, J., Hardt, M., Recht, B., & Talwalkar, A. (2020). A System for Massively Parallel Hyperparameter Tuning. *Proceedings of MLSys 2020*. https://proceedings.mlsys.org/paper_files/paper/2020/hash/a06f20b349c6cf09a6b171c71b88bbfc-Abstract.html
9. Falkner, S., Klein, A., & Hutter, F. (2018). BOHB: Robust and Efficient Hyperparameter Optimization at Scale. *ICML, PMLR 80*, 1437–1446. https://proceedings.mlr.press/v80/falkner18a.html
10. Cawley, G. C., & Talbot, N. L. C. (2010). On Over-fitting in Model Selection and Subsequent Selection Bias in Performance Evaluation. *Journal of Machine Learning Research, 11*, 2079–2107. https://www.jmlr.org/papers/v11/cawley10a.html
11. Kohavi, R. (1995). A Study of Cross-Validation and Bootstrap for Accuracy Estimation and Model Selection. *IJCAI*. https://www.ijcai.org/Proceedings/95-2/Papers/016.pdf
12. Bergmeir, C., Hyndman, R. J., & Koo, B. (2018). A note on the validity of cross-validation for evaluating autoregressive time series prediction. *Computational Statistics & Data Analysis, 120*, 70–83. https://doi.org/10.1016/j.csda.2017.11.003


## Preset interpretation note

For the **Deep Neural Network** preset, continuous dimensions support Bayesian Optimization, while iterative training and early stopping make Hyperband/ASHA and model-based multi-fidelity methods applicable. The current metadata does not establish the reliability of intermediate/low-fidelity rankings, so the tool keeps Bayesian Optimization as the primary recommendation and exposes the resource-aware methods as alternatives requiring empirical comparison. This avoids treating early-stopping availability alone as proof that a multi-fidelity method will outperform Bayesian Optimization.
