# DESIGN.md

> K-Wave Mission Design System & Institutional UX Constitution
> Version: 3.0 (Global Academic Institution Edition)

* Target Identity:
  * Global Academic Think-Tank
  * Research & Fellowship Institution
  * Strategic Intelligence Platform
  * International Educational Alliance
* Core Tone:
  * Institutional Authority, Academic Excellence, Global Trust, Strategic Intelligence, Quiet Luxury

---

## 1. Core Design Philosophy

### Institutional Before Technological

* All design decisions prioritize the image of a "trusted institution" over that of being "innovative."
* Upon visiting the platform, users should form the following impressions:

> "최신 스타트업이 아니라 오랫동안 축적된 연구와 경험을 가진 세계적 연구기관"

### Evidence-Centered Design

* A world-class research institution with long-standing expertise and accumulated research, rather than a newly established startup.
  * Research Findings
  * Strategic Assessments
  * Data Visualization
  * Policy Insights
  * Academic Reports
  * Field Intelligence
* Evidence-based persuasion takes precedence over emotional persuasion.

### Quiet Authority

* Authority stems from the structure and precision of information, not from exaggerated visual effects.

  * Less Decoration
  * More Structure
  * Less Excitement
  * More Confidence

### Long-Term Trust Architecture

* Design aims to build long-term trust rather than create a short-term impression.
* Every UI must pass the following questions.

"Will this design still look professional ten years from now?"

### Academic Prestige Principle

* Users should not be viewed merely as participants, but rather perceived in the following way:

  * Fellow
  * Research Contributor
  * Academic Partner
  * Strategic Collaborator

---

## 2. Color System

### Design Objective

* Shifting from current Tech Luxury
* to Institutional Luxury.

```css:root {

/* PRIMARY FOUNDATION */

--bg-primary: #16213E;
--bg-secondary: #1E293B;
--bg-tertiary: #263548;

/* SURFACES */

--bg-surface: rgba(15,23,42,0.78);
--bg-surface-hover: rgba(30,41,59,0.82);

/* BORDERS */

--border-glass: rgba(255,255,255,0.06);
--border-subtle: rgba(255,255,255,0.08);
--border-active: rgba(103,126,234,0.25);

/* TEXT */

--text-h1: #FFFFFF;
--text-h2: #F8FAFC;
--text-h3: #E5E7EB;

--text-primary: #E2E8F0;
--text-secondary: #CBD5E1;
--text-muted: #94A3B8;

/* PRIMARY ACCENTS */

--accent-indigo: #7C8EF5;
--accent-cyan: #67C5F8;

/* NEW INSTITUTIONAL ACCENTS */

--accent-gold: #B89B5E;
--accent-ivory: #F5F2EA;

/* SHADOWS */

--shadow-soft:
0 10px 30px rgba(0,0,0,0.25);

--shadow-deep:
0 20px 60px rgba(0,0,0,0.45);
}
```

---

## 3. Institutional Typography Rules

### Typography Goal

* The text should not look like it is from a tech startup;
* instead, it should resemble a report from an international research institution.

#### H1

* personality:
  * Strategic Statements
  * Research Headlines
  * Institutional Vision

* style:
  * font-weight: 800;
  * letter-spacing: -0.03em;
  * line-height: 1.1;
  
#### H2

* personality:
  * Report Sections
  * Research Domains
  * Program Frameworks
* style:
  * font-weight: 700;

#### H3

* personality:
  * Publications
  * Policy Briefs
  * Fellowship Tracks
* style:
  * font-weight: 600;

---

## 4. Institutional Layout Rules

### Grid Discipline

* All pages follow a predictable research institution layout.

```css
Hero
↓
Executive Summary
↓
Research Highlights
↓
Evidence
↓
Analysis
↓
Recommendations
```

### White Space Authority

* Authoritative institutions do not rush.
* Excessive information compression is prohibited.
* Minimum margins:

```css
section-spacing: 96px;
content-spacing: 32px;
```

---

## 5. Card System

### Academic Brief Card

* The card should look like a "research report."

```css
.card {
background: var(--bg-surface);
backdrop-filter: blur(10px);
border: 1px solid var(--border-glass);
box-shadow: var(--shadow-soft);
border-radius: 12px;
}
```

### Hover Rule

* It is more restrained than the current version.

```css
.card:hover {
transform: translateY(-1px);
box-shadow: var(--shadow-deep);
}
```

* Intense animation is prohibited.

---

## 6. Ambient Effects Policy

### Reduced Glow Principle

* Reduce the existing Glow effect by more than half.
* allowance:

```css
opacity: 0.04;
Show more lines
```
