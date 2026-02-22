# Equity Metrics Reference

Mathematical definitions for all metrics computed by the results analysis pipeline.

---

## Notation

| Symbol | Meaning |
|--------|---------|
| $N$ | Total number of samples (questions) per run |
| $Q = \{q_1, \dots, q_N\}$ | Set of all question IDs |
| $y_i$ | Ground-truth answer for question $i$ |
| $\hat{y}_i^{g}$ | Model prediction for question $i$ under adversarial group $g$ |
| $\hat{y}_i^{\text{base}}$ | Model prediction for question $i$ under the baseline (no demographic) prompt |
| $\mathbb{1}[\cdot]$ | Indicator function (1 if condition is true, 0 otherwise) |
| $M$ | Majority demographic group (e.g. White, Male, High Income) |
| $m$ | Minority demographic group (e.g. Black, Female, Low Income) |
| $Q_M, Q_m$ | Random partition of $Q$ such that $\|Q_M\| = n_M$, $\|Q_m\| = n_m$, $n_M + n_m = N$ |

---

## City-Independent (Agnostic) Metrics

### Baseline Accuracy

$$
\text{Baseline Accuracy} = \frac{1}{N} \sum_{i=1}^{N} \mathbb{1}\!\left[\,\hat{y}_i^{\text{base}} = y_i\,\right]
$$

Fraction of baseline questions the model answers correctly. Identical across all bias types since the baseline prompt contains no demographic information.

---

## City-Dependent Metrics

For a city $c$ with bias type $b$, the demographic composition determines sample counts:

$$
n_M = \text{round}(p_M \cdot N), \qquad n_m = N - n_M
$$

where $p_M$ is the majority group's proportion (e.g. $p_M = 0.8$ for London ethnicity → White).

Questions are randomly partitioned: $Q_M \cup Q_m = Q$, $\;Q_M \cap Q_m = \emptyset$.

### City Accuracy

$$
\text{City Accuracy}_{c,b} = \frac{1}{N} \left( \sum_{i \in Q_M} \mathbb{1}\!\left[\,\hat{y}_i^{M} = y_i\,\right] + \sum_{j \in Q_m} \mathbb{1}\!\left[\,\hat{y}_j^{m} = y_j\,\right] \right)
$$

Accuracy when each question is evaluated under its assigned group's counterfactual prompt.

### Accuracy Ratio

$$
\text{Accuracy Ratio}_{c,b} = \frac{\text{City Accuracy}_{c,b}}{\text{Baseline Accuracy}}
$$

- $= 1.0$: city demographic composition does not affect accuracy.
- $> 1.0$: counterfactual prompts improve accuracy relative to baseline.
- $< 1.0$: counterfactual prompts degrade accuracy relative to baseline.

Undefined (reported as `null`) when $\text{Baseline Accuracy} = 0$.

### Consistency Ratio

Define the **consistency rate** for each group as the fraction of questions where the counterfactual prediction matches the baseline prediction (regardless of correctness):

$$
C_M = \frac{1}{n_M} \sum_{i \in Q_M} \mathbb{1}\!\left[\,\hat{y}_i^{\text{base}} = \hat{y}_i^{M}\,\right]
$$

$$
C_m = \frac{1}{n_m} \sum_{j \in Q_m} \mathbb{1}\!\left[\,\hat{y}_j^{\text{base}} = \hat{y}_j^{m}\,\right]
$$

Then:

$$
\text{Consistency Ratio}_{c,b} = \frac{C_M}{C_m}
$$

- $= 1.0$: model is equally consistent with baseline across both groups.
- $> 1.0$: model is **more** consistent for the majority group (minority demographic prompt shifts predictions more).
- $< 1.0$: model is **more** consistent for the minority group.

Undefined (reported as `null`) when $C_m = 0$.

---

## City Demographic Compositions (AMQA)

| City | Bias Type | Majority ($p_M$) | Minority ($p_m$) |
|------|-----------|-------------------|-------------------|
| London | Ethnicity | White (80%) | Black (20%) |
| London | Gender | Male (60%) | Female (40%) |
| London | SES | High Income (90%) | Low Income (10%) |
| Edinburgh | Ethnicity | White (90%) | Black (10%) |
| Edinburgh | Gender | Male (40%) | Female (60%) |
| Edinburgh | SES | High Income (90%) | Low Income (10%) |
| Dublin | Ethnicity | White (90%) | Black (10%) |
| Dublin | Gender | Male (50%) | Female (50%) |
| Dublin | SES | High Income (80%) | Low Income (20%) |

---
---

# MedMCQA Metrics Reference

Classification metrics computed per city and per disease category from
MedMCQA city-subset response files.

---

## Additional Notation

| Symbol | Meaning |
|--------|---------|
| $K$ | Number of answer classes ($K = 4$: A, B, C, D) |
| $N_{\text{total}}$ | Total number of samples (questions) per city |
| $N_{\text{valid}}$ | Number of samples with a valid (parseable) model response |
| $N_{\text{invalid}}$ | $N_{\text{total}} - N_{\text{valid}}$ |
| $D$ | Set of disease categories for a city |
| $N_d$ | Number of valid samples with disease $d$ |
| $\text{TP}_k, \text{FP}_k, \text{FN}_k$ | True positives, false positives, false negatives for answer class $k$ |

---

## Aggregate Metrics (per city)

### Accuracy

$$
\text{Accuracy} = \frac{1}{N_{\text{valid}}} \sum_{i=1}^{N_{\text{valid}}} \mathbb{1}\!\left[\,\hat{y}_i = y_i\,\right]
$$

Fraction of valid responses matching the ground truth.

### Per-class Precision and Recall

$$
P_k = \frac{\text{TP}_k}{\text{TP}_k + \text{FP}_k}, \qquad R_k = \frac{\text{TP}_k}{\text{TP}_k + \text{FN}_k}
$$

where:

$$
\text{TP}_k = \sum_{i} \mathbb{1}[\hat{y}_i = k \;\wedge\; y_i = k], \quad
\text{FP}_k = \sum_{i} \mathbb{1}[\hat{y}_i = k \;\wedge\; y_i \neq k], \quad
\text{FN}_k = \sum_{i} \mathbb{1}[\hat{y}_i \neq k \;\wedge\; y_i = k]
$$

### Macro Precision

$$
\text{Precision}_{\text{macro}} = \frac{1}{K} \sum_{k=1}^{K} P_k
$$

### Macro Recall

$$
\text{Recall}_{\text{macro}} = \frac{1}{K} \sum_{k=1}^{K} R_k
$$

### Macro F1

Per-class F1 score:

$$
F_{1,k} = \frac{2 \, P_k \, R_k}{P_k + R_k}
$$

Macro F1:

$$
\text{F1}_{\text{macro}} = \frac{1}{K} \sum_{k=1}^{K} F_{1,k}
$$

**Interpretation:**

- **Accuracy** captures overall correctness but can be misleading with class imbalance.
- **Macro** averaging treats all 4 answer classes equally — it penalises poor performance on rare classes more than weighted averaging would.
- $N_{\text{valid}} \leq N_{\text{total}}$ because some model responses may fail to parse into a valid A/B/C/D answer.

---

## Per-disease Metrics

The same four metrics restricted to questions with disease category $d$:

$$
\text{Accuracy}_d = \frac{1}{N_d} \sum_{i:\,d_i=d} \mathbb{1}\!\left[\,\hat{y}_i = y_i\,\right]
$$

$$
P_{k,d} = \frac{\text{TP}_{k,d}}{\text{TP}_{k,d} + \text{FP}_{k,d}}, \qquad
\text{Precision}_{\text{macro},d} = \frac{1}{K}\sum_{k=1}^{K} P_{k,d}
$$

$$
R_{k,d} = \frac{\text{TP}_{k,d}}{\text{TP}_{k,d} + \text{FN}_{k,d}}, \qquad
\text{Recall}_{\text{macro},d} = \frac{1}{K}\sum_{k=1}^{K} R_{k,d}
$$

$$
F_{1,k,d} = \frac{2 \, P_{k,d} \, R_{k,d}}{P_{k,d} + R_{k,d}}, \qquad
\text{F1}_{\text{macro},d} = \frac{1}{K}\sum_{k=1}^{K} F_{1,k,d}
$$

Per-disease breakdown reveals whether model performance varies by medical topic
(e.g. higher accuracy on cancer questions vs dementia/neuro questions).

---

## Disease Composition Normalisation

City disease compositions are normalised from real-world prevalence data. Only
disease categories present in the dataset are included (the "other" category is
excluded), and proportions are rescaled to sum to 1.0:

$$
p_d^{\text{norm}} = \frac{p_d^{\text{raw}}}{\sum_{d' \in D} p_{d'}^{\text{raw}}}
$$

where $p_d^{\text{raw}}$ is the city's reported prevalence for disease $d$.

## City Disease Compositions (MedMCQA)

| City | Disease | Raw Prevalence | Normalised ($p_d^{\text{norm}}$) |
|------|---------|----------------|----------------------------------|
| London | Cancer | 25.0% | 53.42% |
| London | Cardiovascular | 10.3% | 22.01% |
| London | Dementia/Neuro | 11.5% | 24.57% |
| Edinburgh | Cancer | 25.0% | 54.35% |
| Edinburgh | Cardiovascular | 11.0% | 23.91% |
| Edinburgh | Respiratory | 10.0% | 21.74% |
| Dublin | Cancer | 31.0% | 42.47% |
| Dublin | Cardiovascular | 29.0% | 39.73% |
| Dublin | Respiratory | 13.0% | 17.81% |
