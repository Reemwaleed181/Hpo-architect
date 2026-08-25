export type ScientificReference = {
  id: string
  short: string
  citation: string
  url: string
  supports: string
}

export const SCIENTIFIC_REFERENCES: Record<string, ScientificReference> = {
  feurer2019: {
    id: 'feurer2019',
    short: 'Feurer & Hutter (2019)',
    citation: 'Feurer, M., & Hutter, F. (2019). Hyperparameter Optimization. In Automated Machine Learning: Methods, Systems, Challenges (pp. 3–33). Springer.',
    url: 'https://doi.org/10.1007/978-3-030-05318-5_1',
    supports: 'HPO foundations, search spaces, grid/random/model-based optimization, evaluation and practical HPO design.'
  },
  bischl2023: {
    id: 'bischl2023',
    short: 'Bischl et al. (2023)',
    citation: 'Bischl, B., et al. (2023). Hyperparameter optimization: Foundations, algorithms, best practices, and open challenges. WIREs Data Mining and Knowledge Discovery, 13(2), e1484.',
    url: 'https://doi.org/10.1002/widm.1484',
    supports: 'General HPO workflow, search-space design, resampling, parallelization, multi-fidelity methods and best practices.'
  },
  bergstra2012: {
    id: 'bergstra2012',
    short: 'Bergstra & Bengio (2012)',
    citation: 'Bergstra, J., & Bengio, Y. (2012). Random search for hyper-parameter optimization. Journal of Machine Learning Research, 13, 281–305.',
    url: 'https://www.jmlr.org/papers/v13/bergstra12a.html',
    supports: 'Random Search as a strong model-free baseline and its coverage advantages over grid search in many-dimensional spaces.'
  },
  snoek2012: {
    id: 'snoek2012',
    short: 'Snoek et al. (2012)',
    citation: 'Snoek, J., Larochelle, H., & Adams, R. P. (2012). Practical Bayesian Optimization of Machine Learning Algorithms. Advances in Neural Information Processing Systems 25.',
    url: 'https://papers.nips.cc/paper_files/paper/2012/hash/05311655a15b75fab86956663e1819cd-Abstract.html',
    supports: 'Bayesian optimization for hyperparameter tuning, sequential model-based selection, variable evaluation cost and parallel experimentation.'
  },
  shahriari2016: {
    id: 'shahriari2016',
    short: 'Shahriari et al. (2016)',
    citation: 'Shahriari, B., Swersky, K., Wang, Z., Adams, R. P., & de Freitas, N. (2016). Taking the human out of the loop: A review of Bayesian optimization. Proceedings of the IEEE, 104(1), 148–175.',
    url: 'https://doi.org/10.1109/JPROC.2015.2494218',
    supports: 'Bayesian optimization foundations, surrogate modeling, acquisition functions and black-box optimization.'
  },
  jamieson2016: {
    id: 'jamieson2016',
    short: 'Jamieson & Talwalkar (2016)',
    citation: 'Jamieson, K., & Talwalkar, A. (2016). Non-stochastic best arm identification and hyperparameter optimization. Proceedings of AISTATS, PMLR 51, 240–248.',
    url: 'https://proceedings.mlr.press/v51/jamieson16.html',
    supports: 'Successive Halving / resource allocation using iterative learning behavior and allocating more resources to promising configurations.'
  },
  li2018: {
    id: 'li2018',
    short: 'Li et al. (2018)',
    citation: 'Li, L., Jamieson, K., DeSalvo, G., Rostamizadeh, A., & Talwalkar, A. (2018). Hyperband: A novel bandit-based approach to hyperparameter optimization. Journal of Machine Learning Research, 18(185), 1–52.',
    url: 'https://www.jmlr.org/papers/v18/16-558.html',
    supports: 'Hyperband, adaptive resource allocation, early stopping and multiple Successive Halving brackets.'
  },
  li2020: {
    id: 'li2020',
    short: 'Li et al. (2020)',
    citation: 'Li, L., Jamieson, K., Rostamizadeh, A., Gonina, E., Ben-Tzur, J., Hardt, M., Recht, B., & Talwalkar, A. (2020). A System for Massively Parallel Hyperparameter Tuning. Proceedings of MLSys 2020.',
    url: 'https://proceedings.mlsys.org/paper_files/paper/2020/hash/a06f20b349c6cf09a6b171c71b88bbfc-Abstract.html',
    supports: 'ASHA, asynchronous Successive Halving, parallelism and aggressive early stopping.'
  },
  falkner2018: {
    id: 'falkner2018',
    short: 'Falkner et al. (2018)',
    citation: 'Falkner, S., Klein, A., & Hutter, F. (2018). BOHB: Robust and Efficient Hyperparameter Optimization at Scale. Proceedings of ICML, PMLR 80, 1437–1446.',
    url: 'https://proceedings.mlr.press/v80/falkner18a.html',
    supports: 'BOHB: model-based configuration selection combined with Hyperband-style multi-fidelity resource allocation.'
  },
  cawley2010: {
    id: 'cawley2010',
    short: 'Cawley & Talbot (2010)',
    citation: 'Cawley, G. C., & Talbot, N. L. C. (2010). On Over-fitting in Model Selection and Subsequent Selection Bias in Performance Evaluation. Journal of Machine Learning Research, 11, 2079–2107.',
    url: 'https://www.jmlr.org/papers/v11/cawley10a.html',
    supports: 'Validation during model/hyperparameter selection, selection bias, validation overfitting and separation of final performance evaluation.'
  },
  kohavi1995: {
    id: 'kohavi1995',
    short: 'Kohavi (1995)',
    citation: 'Kohavi, R. (1995). A Study of Cross-Validation and Bootstrap for Accuracy Estimation and Model Selection. Proceedings of IJCAI.',
    url: 'https://www.ijcai.org/Proceedings/95-2/Papers/016.pdf',
    supports: 'Cross-validation and stratified cross-validation for model selection and performance estimation.'
  },
  bergmeir2018: {
    id: 'bergmeir2018',
    short: 'Bergmeir et al. (2018)',
    citation: 'Bergmeir, C., Hyndman, R. J., & Koo, B. (2018). A note on the validity of cross-validation for evaluating autoregressive time series prediction. Computational Statistics & Data Analysis, 120, 70–83.',
    url: 'https://doi.org/10.1016/j.csda.2017.11.003',
    supports: 'Special care for cross-validation in time-series settings and dependence-aware evaluation.'
  }
}

export function refs(ids: string[]) {
  return ids.map(id => SCIENTIFIC_REFERENCES[id]).filter(Boolean)
}

export function shortRefs(ids: string[]) {
  return refs(ids).map(r => r.short).join('; ')
}
