# GRPO Mathematics Reference

**Version:** 1.0.0  
**Last Updated:** 2026-07-09  
**Audience:** ML researchers, alignment engineers, reward function designers  
**Load Stage:** L3 (on-demand when tuning reward functions)  
**Primary Sources:** DeepSeekMath (2024), HuggingFace GRPO Blog (2025), arXiv:2601.08521

---

## Table of Contents

1. [Introduction to GRPO](#1-introduction-to-grpo)
2. [Group Sampling](#2-group-sampling)
3. [Monte Carlo Baseline](#3-monte-carlo-baseline)
4. [Group-Relative Advantage Estimation](#4-group-relative-advantage-estimation)
5. [Objective Function](#5-objective-function)
6. [KL Divergence Estimator](#6-kl-divergence-estimator)
7. [Comparison to PPO](#7-comparison-to-ppo)
8. [Binary Rewards as Bernoulli Variables](#8-binary-rewards-as-bernoulli-variables)
9. [Plackett-Luce Ranking Model](#9-plackett-luce-ranking-model)
10. [Practical Implementation](#10-practical-implementation)
11. [Integration with Hakim Reward Function](#11-integration-with-hakim-reward-function)
12. [Common Pitfalls and Corrections](#12-common-pitfalls-and-corrections)

---

## 1. Introduction to GRPO

**Group Relative Policy Optimization (GRPO)** is a reinforcement learning algorithm for language model alignment that eliminates the need for a separate Critic/Value Network while maintaining training stability comparable to Proximal Policy Optimization (PPO).

### 1.1 Key Innovation

GRPO replaces the learned value function baseline with a **Monte Carlo estimate** computed from a group of sampled outputs for the same input. This architectural change:

- Reduces memory consumption by **~50%** compared to PPO
- Eliminates Critic Network training instability
- Maintains low-variance policy gradient updates
- Enables scalable training on consumer hardware

### 1.2 Historical Context

| Algorithm | Year | Key Innovation | Memory Overhead |
|-----------|------|----------------|-----------------|
| REINFORCE | 1992 | Basic policy gradient | Low |
| PPO | 2017 | Clipped surrogate objective | High (Critic Network) |
| DPO | 2023 | Direct preference optimization | Medium |
| GRPO | 2024 | Group-relative advantage | **Low** |

### 1.3 When to Use GRPO

**Ideal scenarios:**
- Limited GPU memory (consumer hardware)
- Binary reward signals (success/failure)
- Mathematical reasoning tasks
- Code generation with verifiable outputs

**Less ideal:**
- Dense reward environments (PPO preferred)
- Continuous control tasks
- Environments requiring precise value estimation

---

## 2. Group Sampling

### 2.1 Core Mechanism

For each input query `q`, GRPO generates a **group of G independent outputs** from the current policy:

```
{o₁, o₂, ..., o_G} ~ π_θ(·|q)
```

Where:
- `q` = input query/prompt
- `π_θ` = current policy with parameters θ
- `G` = group size (typically 4-16)
- `o_i` = i-th sampled output sequence

### 2.2 Sampling Procedure

```python
def group_sample(policy, query, G=8, temperature=1.0):
    """Generate G independent outputs for the same query."""
    outputs = []
    for _ in range(G):
        output = policy.generate(
            query,
            temperature=temperature,
            do_sample=True,
            top_p=0.95
        )
        outputs.append(output)
    return outputs
```

### 2.3 Statistical Properties

The group of outputs forms an **i.i.d. sample** from the policy distribution:

```
E[o_i] = E_{o ~ π_θ(·|q)}[o]
Var[o_i] = Var_{o ~ π_θ(·|q)}[o]
Cov[o_i, o_j] = 0 for i ≠ j
```

**Critical assumption:** Outputs are sampled **independently** (not beam search).

### 2.4 Choosing Group Size G

| Group Size | Variance | Memory | Compute | Use Case |
|------------|----------|--------|---------|----------|
| G = 4 | High | Low | Low | Prototyping |
| G = 8 | Medium | Medium | Medium | **Recommended default** |
| G = 16 | Low | High | High | Production training |
| G = 32 | Very low | Very high | Very high | Research |

**Rule of thumb:** `G ≥ 4` for statistical significance, `G ≥ 8` for stable training.

---

> **ملخص Group Sampling (بالعربية):**
>
> يتم توليد G مخرجات مستقلة لنفس المدخل من السياسة الحالية. العينات مستقلة إحصائياً (i.i.d.)، والحجم الموصى به G=8 يوازن بين التباين واستهلاك الذاكرة.

---

## 3. Monte Carlo Baseline

### 3.1 The Baseline Problem

In policy gradient methods, we need a **baseline** to reduce variance:

```
∇_θ J(θ) = E[∇_θ log π_θ(o|q) · (R(o) - b(q))]
```

Traditional approaches use a learned **Critic Network** `V_φ(q)` to estimate `b(q)`.

### 3.2 GRPO's Solution

GRPO replaces the Critic with the **sample mean** of rewards within the group:

```
b(q) = (1/G) Σᵢ₌₁ᴳ r_i ≈ E_{o ~ π_θ(·|q)}[r(q, o)]
```

Where:
- `r_i = r(q, o_i)` = reward for i-th output
- `b(q)` = Monte Carlo baseline estimate

### 3.3 Unbiased Estimator

The sample mean is an **unbiased estimator** of the expected reward:

```
E[b(q)] = E[(1/G) Σᵢ r_i] = (1/G) Σᵢ E[r_i] = E[r]
```

**Proof:**
```
E[b(q)] = E[(1/G) Σᵢ₌₁ᴳ r_i]
        = (1/G) Σᵢ₌₁ᴳ E[r_i]        # Linearity of expectation
        = (1/G) · G · E[r]           # All r_i identically distributed
        = E[r]                        # Unbiased
```

### 3.4 Variance of the Baseline

```
Var[b(q)] = Var[(1/G) Σᵢ r_i]
          = (1/G²) Σᵢ Var[r_i]      # Independence
          = (1/G²) · G · Var[r]
          = Var[r] / G
```

**Key insight:** Variance decreases as `1/G`, motivating larger group sizes.

### 3.5 Why No Critic Network?

| Aspect | PPO (with Critic) | GRPO (Monte Carlo) |
|--------|-------------------|---------------------|
| Baseline source | Learned `V_φ(q)` | Sample mean |
| Training overhead | Two networks | One network |
| Memory | 2× policy size | 1× policy size |
| Stability risk | Critic divergence | None |
| Bias risk | Approximation error | Unbiased |

---

> **ملخص Monte Carlo Baseline (بالعربية):**
>
> يستبدل GRPO شبكة الـ Critic بمتوسط العينات كمُقدِّر غير متحيز للـ baseline. التباين يقل بـ 1/G، مما يبرر استخدام مجموعات أكبر. هذا يلغي الحاجة إلى تدريب شبكتين ويوفر ~50% من الذاكرة.

---

## 4. Group-Relative Advantage Estimation

### 4.1 The Advantage Function

The **advantage** measures how much better a specific output is compared to the average:

```
A(q, o) = R(q, o) - V(q)
```

In GRPO, we approximate this using the group:

```
Âᵢ = (rᵢ - mean(r₁,...,r_G)) / (std(r₁,...,r_G) + ε)
```

### 4.2 Full Mathematical Formulation

```
Âᵢ = (r_i - μ_G) / (σ_G + ε)
```

Where:
- `μ_G = (1/G) Σⱼ₌₁ᴳ r_j` (sample mean)
- `σ_G = √[(1/G) Σⱼ₌₁ᴳ (r_j - μ_G)²]` (sample std)
- `ε = 10⁻⁸` (numerical stability)

### 4.3 Statistical Properties

#### Property 1: Zero-Centered

```
Σᵢ₌₁ᴳ Âᵢ = Σᵢ (r_i - μ_G) / σ_G
          = (1/σ_G) Σᵢ (r_i - μ_G)
          = (1/σ_G) · 0           # By definition of mean
          = 0
```

**Implication:** Advantages sum to zero, ensuring unbiased policy updates.

#### Property 2: Unit Variance

```
Var[Âᵢ] = Var[(r_i - μ_G) / σ_G]
        = (1/σ_G²) · Var[r_i - μ_G]
        ≈ 1                          # For large G
```

**Implication:** Normalized scale prevents gradient explosion/vanishing.

#### Property 3: Correlation Structure

```
Cov[Âᵢ, Âⱼ] = -1/(G-1) for i ≠ j
```

**Implication:** Negative correlation ensures advantages "balance out" within group.

### 4.4 Numerical Stability

The `ε` term prevents division by zero when all outputs have identical rewards:

```python
def compute_advantages(rewards, eps=1e-8):
    """Compute group-relative advantages."""
    mean_r = np.mean(rewards)
    std_r = np.std(rewards)
    
    if std_r < eps:
        # All rewards identical → zero advantages
        return np.zeros_like(rewards)
    
    return (rewards - mean_r) / (std_r + eps)
```

### 4.5 Edge Cases

| Scenario | Result | Handling |
|----------|--------|----------|
| All rewards equal | All Âᵢ = 0 | No update (correct) |
| One outlier reward | Large Âᵢ for outlier | Clipped by PPO objective |
| G = 1 | Undefined | Require G ≥ 2 |
| Binary rewards (0/1) | Discrete advantages | Handled by Bernoulli model |

### 4.6 Bias Correction (arXiv:2601.08521)

Recent work shows GRPO advantages have small finite-sample bias:

```
E[Âᵢ] ≈ A(q, o_i) + O(1/G)
```

**Correction (optional):**
```
Âᵢ_corrected = Âᵢ · √(G/(G-1))
```

For `G ≥ 8`, the bias is negligible (< 7%).

---

> **ملخص Group-Relative Advantage (بالعربية):**
>
> يتم حساب الـ advantage لكل مخرجة بطرح المتوسط وقسمة النتيجة على الانحراف المعياري للمجموعة. الخصائص الإحصائية: مركزية صفرية، تباين وحدة، وارتباط سلبي بين المخرجات. الثابت ε يمنع القسمة على صفر.

---

## 5. Objective Function

### 5.1 Complete GRPO Objective

The GRPO objective function to **maximize**:

```
J_GRPO(θ) = E_{q~D, {oᵢ}~π_{θ_old}(·|q)} [
    (1/G) Σᵢ₌₁ᴳ (1/|oᵢ|) Σₜ₌₁^{|oᵢ|} [
        min(
            r_{i,t}(θ) · Âᵢ,
            clip(r_{i,t}(θ), 1-ε, 1+ε) · Âᵢ
        )
        - β · D_KL^{(i,t)}
    ]
]
```

### 5.2 Component Breakdown

#### Component 1: Policy Ratio

```
r_{i,t}(θ) = π_θ(o_{i,t} | q, o_{i,<t}) / π_{θ_old}(o_{i,t} | q, o_{i,<t})
```

**Meaning:** How much more/less likely the new policy is to generate token `t` compared to old policy.

#### Component 2: Clipped Surrogate

```
L_clip = min(r_{i,t} · Âᵢ, clip(r_{i,t}, 1-ε, 1+ε) · Âᵢ)
```

**Purpose:** Prevents large policy updates that could destabilize training.

**Cases:**
| Condition | Behavior |
|-----------|----------|
| `r_{i,t} ∈ [1-ε, 1+ε]` | Use `r_{i,t} · Âᵢ` (no clipping) |
| `r_{i,t} < 1-ε` and `Âᵢ > 0` | Clip to `(1-ε) · Âᵢ` |
| `r_{i,t} > 1+ε` and `Âᵢ > 0` | Clip to `(1+ε) · Âᵢ` |
| `r_{i,t} < 1-ε` and `Âᵢ < 0` | Use `r_{i,t} · Âᵢ` (negative advantage) |
| `r_{i,t} > 1+ε` and `Âᵢ < 0` | Clip to `(1+ε) · Âᵢ` |

#### Component 3: Per-Token Averaging

```
(1/|oᵢ|) Σₜ₌₁^{|oᵢ|} [...]
```

**Purpose:** Normalizes by sequence length to prevent bias toward long outputs.

#### Component 4: KL Penalty

```
-β · D_KL^{(i,t)}
```

**Purpose:** Prevents policy from drifting too far from reference policy `π_ref`.

### 5.3 Gradient Computation

```
∇_θ J_GRPO ≈ (1/G) Σᵢ (1/|oᵢ|) Σₜ ∇_θ [
    min(r_{i,t} · Âᵢ, clip(r_{i,t}, 1-ε, 1+ε) · Âᵢ)
    - β · D_KL^{(i,t)}
]
```

Using reparameterization:
```
∇_θ r_{i,t} = r_{i,t} · ∇_θ log π_θ(o_{i,t} | q, o_{i,<t})
```

### 5.4 Hyperparameters

| Parameter | Symbol | Typical Value | Effect |
|-----------|--------|---------------|--------|
| Clipping range | ε | 0.2 | Controls update magnitude |
| KL coefficient | β | 0.01-0.1 | Prevents drift |
| Group size | G | 4-16 | Variance reduction |
| Learning rate | α | 1e-5 to 5e-6 | Training stability |

### 5.5 Complete Training Loop (Pseudo-code)

```python
def grpo_training_step(policy, ref_policy, queries, G=8, eps=0.2, beta=0.01):
    """Single GRPO training step."""
    
    # Step 1: Group sampling
    outputs = [policy.generate(q, num_samples=G) for q in queries]
    
    # Step 2: Compute rewards
    rewards = [[reward_fn(q, o) for o in group] for group in outputs]
    
    # Step 3: Compute advantages
    advantages = [compute_advantages(group_rewards) for group_rewards in rewards]
    
    # Step 4: Compute objective
    total_loss = 0.0
    for q_idx, (query, group_outputs, group_advantages) in enumerate(
        zip(queries, outputs, advantages)
    ):
        for o_idx, (output, advantage) in enumerate(zip(group_outputs, group_advantages)):
            # Per-token loss
            for t in range(len(output)):
                # Policy ratio
                ratio = (
                    policy.log_prob(output[t] | query, output[:t]) -
                    old_policy.log_prob(output[t] | query, output[:t])
                ).exp()
                
                # Clipped surrogate
                surr1 = ratio * advantage
                surr2 = torch.clamp(ratio, 1-eps, 1+eps) * advantage
                policy_loss = -torch.min(surr1, surr2)
                
                # KL penalty
                kl = kl_estimator(policy, ref_policy, output[t], query, output[:t])
                
                # Total loss
                total_loss += (policy_loss + beta * kl) / len(output)
    
    # Step 5: Backprop
    total_loss /= (len(queries) * G)
    total_loss.backward()
    optimizer.step()
    
    return total_loss.item()
```

---

> **ملخص Objective Function (بالعربية):**
>
> دالة الهدف الكاملة لـ GRPO تجمع بين: (1) نسبة السياسة، (2) clipping لمنع التحديثات الكبيرة، (3) متوسط per-token لتطبيع طول التسلسل، و(4) عقوبة KL لمنع الانحراف عن السياسة المرجعية.

---

## 6. KL Divergence Estimator

### 6.1 The KL Penalty

The KL divergence term prevents the policy from drifting too far from the reference:

```
D_KL[π_θ || π_ref] = E_{o~π_θ}[log(π_θ(o) / π_ref(o))]
```

### 6.2 GRPO's Unbiased Estimator

GRPO uses a **per-token unbiased estimator**:

```
D_KL^{(i,t)} = π_ref(o_{i,t} | ...) / π_θ(o_{i,t} | ...) 
              - log(π_ref(o_{i,t} | ...) / π_θ(o_{i,t} | ...)) 
              - 1
```

Let `x = π_ref / π_θ`, then:

```
D_KL^{(i,t)} = x - log(x) - 1
```

### 6.3 Properties

#### Property 1: Non-Negativity

```
f(x) = x - log(x) - 1 ≥ 0 for all x > 0
```

**Proof:**
```
f'(x) = 1 - 1/x
f'(x) = 0 ⟹ x = 1
f''(x) = 1/x² > 0  # Convex
f(1) = 1 - 0 - 1 = 0  # Global minimum
```

Therefore `f(x) ≥ 0` for all `x > 0`.

#### Property 2: Unbiased Estimation

```
E_{o~π_θ}[x - log(x) - 1] = D_KL[π_θ || π_ref]
```

**Proof sketch:**
```
E[x - log(x) - 1] 
  = E[π_ref/π_θ] - E[log(π_ref/π_θ)] - 1
  = 1 - E[log(π_ref/π_θ)] - 1        # E[π_ref/π_θ] = 1
  = -E[log(π_ref/π_θ)]
  = E[log(π_θ/π_ref)]
  = D_KL[π_θ || π_ref]
```

#### Property 3: Quadratic Behavior Near x=1

For `x ≈ 1` (policy close to reference):

```
f(x) ≈ (x-1)²/2
```

**Taylor expansion:**
```
f(x) = x - log(x) - 1
     ≈ x - (x-1 - (x-1)²/2 + ...) - 1
     ≈ (x-1)²/2
```

### 6.4 Comparison with Standard KL Estimator

| Estimator | Formula | Bias | Variance | Non-negative |
|-----------|---------|------|----------|--------------|
| **Standard** | `log(π_θ/π_ref)` | Unbiased | High | ❌ Can be negative |
| **GRPO** | `π_ref/π_θ - log(π_ref/π_θ) - 1` | Unbiased | Lower | ✅ Always ≥ 0 |

### 6.5 Numerical Implementation

```python
def kl_estimator(policy, ref_policy, token, query, context):
    """Compute unbiased KL divergence estimate."""
    log_pi_theta = policy.log_prob(token | query, context)
    log_pi_ref = ref_policy.log_prob(token | query, context)
    
    # x = π_ref / π_θ = exp(log π_ref - log π_θ)
    log_ratio = log_pi_ref - log_pi_theta
    x = torch.exp(log_ratio)
    
    # KL estimator: x - log(x) - 1
    kl = x - log_ratio - 1.0
    
    # Numerical safety
    kl = torch.clamp(kl, min=0.0)
    
    return kl
```

---

> **ملخص KL Estimator (بالعربية):**
>
> يستخدم GRPO مُقدِّر KL غير متحيز وغير سالب: `x - log(x) - 1` حيث `x = π_ref/π_θ`. الخصائص: دائماً ≥ 0، غير متحيز، وتباين أقل من المقدر القياسي. السلوك تربيعي قرب x=1.

---

## 7. Comparison to PPO

### 7.1 Architectural Differences

| Aspect | PPO | GRPO |
|--------|-----|------|
| **Networks** | Actor + Critic | Actor only |
| **Baseline** | Learned `V_φ(s)` | Monte Carlo mean |
| **Advantage** | GAE (TD-based) | Group-relative |
| **Memory** | ~2× policy size | ~1× policy size |
| **Training complexity** | High (2 networks) | Medium (1 network) |
| **Hyperparameters** | Many (GAE λ, etc.) | Fewer |

### 7.2 Memory Analysis

**PPO Memory Requirements:**
```
Memory_PPO = Memory(π_θ) + Memory(V_φ) + Memory(Optimizers) + Memory(Buffers)
           ≈ 2 × Policy_Size + Overhead
```

**GRPO Memory Requirements:**
```
Memory_GRPO = Memory(π_θ) + Memory(π_ref) + Memory(Optimizer) + Memory(Group_Buffer)
            ≈ 1 × Policy_Size + G × Sequence_Length + Overhead
```

**For typical settings (G=8, sequence_length=512):**
```
Memory_GRPO / Memory_PPO ≈ 0.5
```

**Result:** ~50% memory reduction.

### 7.3 Training Stability

| Metric | PPO | GRPO |
|--------|-----|------|
| **Critic collapse risk** | Yes | No (no critic) |
| **Value function drift** | Common | N/A |
| **Gradient variance** | Low (with good critic) | Medium |
| **Hyperparameter sensitivity** | High | Medium |

### 7.4 Performance Comparison

Empirical results from DeepSeekMath paper:

| Benchmark | PPO Score | GRPO Score | Delta |
|-----------|-----------|------------|-------|
| GSM8K (math) | 78.2% | 79.8% | +1.6% |
| MATH | 42.5% | 44.1% | +1.6% |
| Training time | 100% | 85% | -15% |
| Memory usage | 100% | 52% | -48% |

### 7.5 When PPO Might Be Better

PPO may outperform GRPO when:
1. **Dense rewards:** Continuous reward signals (not binary)
2. **Long horizons:** Tasks requiring precise value estimation
3. **Large datasets:** When Critic can be trained accurately
4. **Continuous control:** Robotics, physical simulations

---

> **ملخص المقارنة مع PPO (بالعربية):**
>
> GRPO يقلل الذاكرة بنسبة ~50% بإلغاء Critic Network. الأداء مكافئ أو أفضل قليلاً في المهام الرياضية. PPO قد يتفوق في البيئات ذات المكافآت الكثيفة والآفاق الطويلة.

---

## 8. Binary Rewards as Bernoulli Variables

### 8.1 Binary Reward Structure

Many alignment tasks have **binary outcomes**:
- Mathematical proof: correct (1) or incorrect (0)
- Code execution: passes tests (1) or fails (0)
- Factual accuracy: true (1) or false (0)

### 8.2 Bernoulli Model

Treat rewards as Bernoulli random variables:

```
r_i ~ Bernoulli(p)
```

Where:
- `p = P(success)` = probability of correct output
- `E[r_i] = p`
- `Var[r_i] = p(1-p)`

### 8.3 Group Statistics

For a group of G binary rewards:

```
K = Σᵢ r_i ~ Binomial(G, p)
```

**Sample mean:**
```
p̂ = K/G
```

**Advantage calculation:**
```
μ_G = p̂
σ_G = √(p̂(1-p̂))
Âᵢ = (r_i - p̂) / (√(p̂(1-p̂)) + ε)
```

### 8.4 Advantage Values for Binary Rewards

| r_i | p̂ | Âᵢ |
|-----|---|-----|
| 1 (success) | 0.5 | +1.0 |
| 0 (failure) | 0.5 | -1.0 |
| 1 | 0.75 | +0.577 |
| 0 | 0.75 | -1.732 |
| 1 | 0.25 | +1.732 |
| 0 | 0.25 | -0.577 |

**Interpretation:** Successes when `p̂` is low get higher advantage (surprising success).

### 8.5 Edge Case: All Successes or All Failures

When all outputs have the same reward:

```
σ_G = 0 → Âᵢ = 0 for all i
```

**Result:** No policy update (correct behavior — no learning signal).

### 8.6 Minimum Group Size for Binary Rewards

For statistical significance with binary rewards:

```
G ≥ 1 / (p(1-p))
```

| Success Rate p | Minimum G |
|----------------|-----------|
| 0.5 | 4 |
| 0.3 or 0.7 | 5 |
| 0.1 or 0.9 | 11 |
| 0.05 or 0.95 | 21 |

**Recommendation:** For binary rewards, use `G ≥ 8` to ensure adequate signal.

---

> **ملخص المكافآت الثنائية (بالعربية):**
>
> المكافآت الثنائية (نجاح/فشل) تُعامل كمتغيرات Bernoulli. الـ advantage يعتمد على معدل النجاح في المجموعة. الحجم الأدنى الموصى به G ≥ 8 للإشارات الثنائية.

---

## 9. Plackett-Luce Ranking Model

### 9.1 Motivation

When an agent generates multiple outputs and must select the best one, we need a probabilistic ranking model.

### 9.2 Bradley-Terry Model (Pairwise)

For comparing two outputs `i` and `j`:

```
P(i ≻ j) = α_i / (α_i + α_j)
```

Where `α_i` represents the "strength" of output `i`.

### 9.3 Plackett-Luce Extension (Listwise)

For ranking a set of outputs `{i₁, i₂, ..., i_n}`:

```
P(i₁ ≻ i₂ ≻ ... ≻ i_n) = Π_{k=1}^{n} [α_{i_k} / Σ_{j=k}^{n} α_{i_j}]
```

**Interpretation:** Sequential selection without replacement, with probabilities proportional to strengths.

### 9.4 Example: 3-Output Ranking

```
P(i ≻ j ≻ k) = [α_i / (α_i + α_j + α_k)] · [α_j / (α_j + α_k)] · [α_k / α_k]
             = [α_i / (α_i + α_j + α_k)] · [α_j / (α_j + α_k)]
```

### 9.5 General Selection Probability

Probability of selecting output `i` from set `S`:

```
P(choose i from S) = α_i / Σ_{j∈S} α_j
```

### 9.6 Connection to GRPO

In GRPO context, we can map **advantages to strengths**:

```
α_i = exp(Âᵢ)
```

Then Plackett-Luce gives probability of output `i` being "best" in the group:

```
P(i is best) = exp(Âᵢ) / Σ_j exp(Â_j)
```

This is equivalent to **softmax over advantages**.

### 9.7 Application in Hakim

The Evaluator agent can use Plackett-Luce to select the best proposal among multiple candidates:

```python
def select_best_proposal(proposals, advantages):
    """Select best proposal using Plackett-Luce model."""
    strengths = np.exp(advantages)
    probabilities = strengths / strengths.sum()
    
    # Select proportionally to strength
    best_idx = np.random.choice(len(proposals), p=probabilities)
    return proposals[best_idx]
```

---

> **ملخص Plackett-Luce (بالعربية):**
>
> نموذج احتمالي لترتيب المخرجات. يمتد Bradley-Terry من المقارنة الزوجية إلى الترتيب الكامل. في GRPO، يمكن تعيين الـ advantages كـ strengths واختيار الأفضل بنسبة softmax.

---

## 10. Practical Implementation

### 10.1 Complete GRPO Training Class

```python
import torch
import torch.nn.functional as F
import numpy as np

class GRPOTrainer:
    """Group Relative Policy Optimization trainer."""
    
    def __init__(
        self,
        policy,
        ref_policy,
        optimizer,
        reward_fn,
        G=8,
        eps=0.2,
        beta=0.01,
        lr=1e-5
    ):
        self.policy = policy
        self.ref_policy = ref_policy
        self.optimizer = optimizer
        self.reward_fn = reward_fn
        self.G = G
        self.eps = eps
        self.beta = beta
        
        # Freeze reference policy
        for param in self.ref_policy.parameters():
            param.requires_grad = False
    
    def compute_advantages(self, rewards):
        """Compute group-relative advantages."""
        rewards = np.array(rewards)
        mean_r = rewards.mean()
        std_r = rewards.std()
        
        if std_r < 1e-8:
            return np.zeros_like(rewards)
        
        return (rewards - mean_r) / (std_r + 1e-8)
    
    def kl_divergence(self, log_pi_theta, log_pi_ref):
        """Unbiased KL divergence estimator."""
        log_ratio = log_pi_ref - log_pi_theta
        x = torch.exp(log_ratio)
        kl = x - log_ratio - 1.0
        return torch.clamp(kl, min=0.0)
    
    def training_step(self, queries):
        """Single GRPO training step."""
        total_loss = 0.0
        total_kl = 0.0
        
        for query in queries:
            # Step 1: Group sampling
            outputs = []
            old_log_probs = []
            
            with torch.no_grad():
                for _ in range(self.G):
                    output, log_probs = self.policy.generate_with_logprobs(
                        query, 
                        temperature=1.0
                    )
                    outputs.append(output)
                    old_log_probs.append(log_probs)
            
            # Step 2: Compute rewards
            rewards = [self.reward_fn(query, output) for output in outputs]
            
            # Step 3: Compute advantages
            advantages = self.compute_advantages(rewards)
            
            # Step 4: Compute policy loss
            for output, old_log_prob, advantage in zip(
                outputs, old_log_probs, advantages
            ):
                # Forward pass with current policy
                new_log_probs = self.policy.log_prob_sequence(
                    output, query
                )
                
                # Per-token loss
                for t in range(len(output)):
                    # Policy ratio
                    ratio = torch.exp(
                        new_log_probs[t] - old_log_prob[t].detach()
                    )
                    
                    # Clipped surrogate
                    surr1 = ratio * advantage
                    surr2 = torch.clamp(ratio, 1-self.eps, 1+self.eps) * advantage
                    policy_loss = -torch.min(surr1, surr2)
                    
                    # KL penalty
                    ref_log_prob = self.ref_policy.log_prob_token(
                        output[t], query, output[:t]
                    )
                    kl = self.kl_divergence(new_log_probs[t], ref_log_prob)
                    
                    # Accumulate
                    total_loss += policy_loss + self.beta * kl
                    total_kl += kl.item()
        
        # Normalize by batch size and group size
        total_loss /= (len(queries) * self.G)
        
        # Backprop
        self.optimizer.zero_grad()
        total_loss.backward()
        torch.nn.utils.clip_grad_norm_(self.policy.parameters(), 1.0)
        self.optimizer.step()
        
        return {
            'loss': total_loss.item(),
            'kl': total_kl / (len(queries) * self.G)
        }
```

### 10.2 Hyperparameter Recommendations

| Parameter | Recommended | Range | Notes |
|-----------|-------------|-------|-------|
| Group size G | 8 | 4-16 | Balance variance/compute |
| Clipping ε | 0.2 | 0.1-0.3 | PPO standard |
| KL coefficient β | 0.01 | 0.001-0.1 | Tune for drift |
| Learning rate | 1e-5 | 1e-6 to 5e-5 | Lower than SFT |
| Batch size | 4-8 queries | 1-16 | Per GPU |
| Gradient clipping | 1.0 | 0.5-2.0 | Prevent explosion |
| Temperature | 1.0 | 0.7-1.2 | Sampling diversity |

### 10.3 Training Schedule

```python
# Recommended schedule for GRPO
num_epochs = 3
steps_per_epoch = 1000
warmup_steps = 100

for epoch in range(num_epochs):
    for step in range(steps_per_epoch):
        queries = sample_queries(batch_size=8)
        metrics = trainer.training_step(queries)
        
        # Logging
        if step % 10 == 0:
            print(f"Epoch {epoch}, Step {step}: "
                  f"loss={metrics['loss']:.4f}, kl={metrics['kl']:.4f}")
        
        # LR scheduling
        if step < warmup_steps:
            lr = base_lr * (step / warmup_steps)
        else:
            lr = base_lr * 0.5 * (1 + cos(π * (step - warmup_steps) / 
                                          (steps_per_epoch - warmup_steps)))
        
        for param_group in optimizer.param_groups:
            param_group['lr'] = lr
```

---

## 11. Integration with Hakim Reward Function

### 11.1 Hakim Reward Components

The Hakim reward function (from ADR-003) integrates with GRPO:

```
R_hakim(solution) = α · R_rung + β · R_loc + γ · R_dep + δ · R_safety
```

Where:
- `R_rung` = Reward for ladder rung achieved
- `R_loc` = LOC penalty
- `R_dep` = Dependency penalty
- `R_safety` = Safety bonus

### 11.2 Mapping to GRPO

```python
def hakim_reward_fn(query, solution):
    """Compute Hakim reward for GRPO training."""
    
    # Component 1: Ladder rung reward
    rung_rewards = {1: 1.0, 2: 0.9, 3: 0.8, 4: 0.7, 5: 0.6, 6: 0.5, 7: 0.3}
    rung = detect_ladder_rung(solution)
    R_rung = rung_rewards.get(rung, 0.3)
    
    # Component 2: LOC penalty
    baseline_loc = estimate_baseline_loc(query)
    solution_loc = count_lines(solution)
    if solution_loc <= baseline_loc:
        R_loc = 0.0
    else:
        R_loc = -0.01 * (solution_loc - baseline_loc)
        R_loc = max(R_loc, -1.0)
    
    # Component 3: Dependency penalty
    new_deps = count_new_dependencies(solution)
    R_dep = -0.2 * new_deps
    R_dep = max(R_dep, -1.0)
    
    # Component 4: Safety bonus
    safety_passed = run_security_checks(solution)
    R_safety = 0.5 if safety_passed else 0.0
    
    # Weighted sum
    reward = 0.4 * R_rung + 0.3 * R_loc + 0.2 * R_dep + 0.1 * R_safety
    
    return reward
```

### 11.3 Training Hakim-Aligned Agents

```python
# GRPO training with Hakim rewards
trainer = GRPOTrainer(
    policy=model,
    ref_policy=reference_model,
    optimizer=optimizer,
    reward_fn=hakim_reward_fn,
    G=8,
    eps=0.2,
    beta=0.01
)

for epoch in range(num_epochs):
    for batch in dataloader:
        metrics = trainer.training_step(batch['queries'])
        # Metrics: loss, KL, mean reward, rung distribution
```

### 11.4 Expected Training Dynamics

| Epoch | Mean Reward | Rung Distribution | KL |
|-------|-------------|-------------------|-----|
| 1 | 0.3-0.4 | Mostly Rung 7 | Low |
| 2 | 0.5-0.6 | Mix of Rung 3-7 | Medium |
| 3 | 0.7-0.8 | Mostly Rung 1-3 | Medium |
| 4+ | 0.8+ | Dominated by Rung 1-2 | Stable |

---

## 12. Common Pitfalls and Corrections

### Pitfall 1: Group Size Too Small

**Symptom:** Unstable training, high variance  
**Cause:** G < 4 provides insufficient baseline estimate  
**Fix:** Increase G to ≥ 8

### Pitfall 2: All Identical Rewards

**Symptom:** Zero advantages, no learning  
**Cause:** Reward function too coarse  
**Fix:** Add reward shaping or increase G

### Pitfall 3: KL Divergence Explosion

**Symptom:** Policy drifts far from reference  
**Cause:** β too small  
**Fix:** Increase β to 0.05-0.1

### Pitfall 4: Advantage Outliers

**Symptom:** Single output dominates gradient  
**Cause:** One very different reward  
**Fix:** Clip advantages to [-3, +3] or increase G

### Pitfall 5: Numerical Instability

**Symptom:** NaN losses, gradient explosion  
**Cause:** log(0) or division by zero  
**Fix:** Add ε = 1e-8 to all denominators and logs

### Pitfall 6: Critic Leakage

**Symptom:** Implicitly learning value function  
**Cause:** Sharing layers between actor components  
**Fix:** Ensure single-network architecture

---

## Quick Reference Card

### Key Equations

```
Group Sampling:    {o₁,...,o_G} ~ π_θ(·|q)
Baseline:          b(q) = (1/G) Σᵢ rᵢ
Advantage:         Âᵢ = (rᵢ - μ_G) / (σ_G + ε)
Objective:         J = E[min(r·Â, clip(r,1-ε,1+ε)·Â) - β·KL]
KL Estimator:      D_KL = x - log(x) - 1, where x = π_ref/π_θ
```

### Hyperparameters

| Parameter | Default | Range |
|-----------|---------|-------|
| G | 8 | 4-16 |
| ε | 0.2 | 0.1-0.3 |
| β | 0.01 | 0.001-0.1 |
| LR | 1e-5 | 1e-6 to 5e-5 |

### Decision Tree

```
Training with GRPO?
    ↓
Binary rewards? ── YES ──→ Use G ≥ 8
    ↓ NO
Continuous rewards? ── YES ──→ Standard GRPO
    ↓ NO
Dense rewards? ── YES ──→ Consider PPO instead
```

---

## References

1. **DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models**  
   Shao et al., 2024  
   → Original GRPO algorithm

2. **Understanding GRPO: PPO without the Critic**  
   Aayush Garg, Hugging Face Blog, 2025  
   → Derivation and implementation guide

3. **Your Group-Relative Advantage Is Biased**  
   arXiv:2601.08521, 2026  
   → Bias correction for finite G

4. **Proximal Policy Optimization Algorithms**  
   Schulman et al., 2017  
   → PPO comparison baseline

5. **Direct Preference Optimization (DPO)**  
   Rafailov et al., 2023  
   → Alternative to RLHF

---

**END OF GRPO MATHEMATICS REFERENCE**

**Related Documents:**
- `SKILL.md` - Core Hakim skill (L2)
- `yagni_guidelines.md` - Stdlib replacements (L3)
- `workflow_patterns.md` - Evaluator-Optimizer loop (L3)
- `progressive_disclosure.md` - 3-level PD protocol (L3)
```

