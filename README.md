# MABEC AI Matcher – Industrial Item Code Search Assistant

## Overview

MABEC AI Matcher is a web application developed to help users find the correct official MABEC / Article code from an industrial item catalog.

The project was developed during my Semester 8 internship at Stellantis Oran. The goal was to simplify item reference search by allowing users to search using article codes, official designations, partial descriptions, abbreviations, spelling mistakes, or natural language queries.

The application returns the most relevant catalog candidates with a confidence level and a verification recommendation when the result is uncertain.

## Project Result

This project was presented as part of my Semester 8 internship presentation and received a grade of 15/20.

## Problem

In industrial environments, item identification is important for maintenance, procurement, stock management, and daily operations.

However, manual search inside an Excel catalog can be difficult because:

* Users may not know the exact official designation.
* Item names may contain abbreviations.
* Some descriptions are technical or shortened.
* Users may search using French, English, or mixed terms.
* Users may make spelling mistakes.
* A wrong reference can cause delays or incorrect requests.

## Solution

MABEC AI Matcher provides an assisted search interface where the user enters a search query.

The system compares the query with the catalog and returns:

* The official Article code.
* The official Désignation article.
* The most relevant candidate matches.
* A confidence score.
* A confidence level.
* Extracted attributes such as color, voltage, dimension, material, or technical reference.
* A recommendation: validate automatically or verify manually.
* Clarification suggestions for vague queries.

The catalog remains the source of truth. The application does not invent item codes.

## Main Features

* Search by exact Article code.
* Search by exact designation.
* Search using partial descriptions.
* Search using abbreviations.
* Search with spelling mistakes.
* French / English term support through a glossary.
* Attribute extraction.
* Confidence scoring.
* Top candidate ranking.
* Clarification suggestions for vague queries.
* Excel catalog import.
* Catalog storage in browser localStorage.
* Search history.
* Clean React user interface.

## Technologies Used

* React
* TypeScript
* Vite
* Tailwind CSS
* XLSX library for Excel import
* localStorage for catalog and history persistence
* Custom TypeScript matching algorithm
* Google AI Studio project environment

## Project Structure

```text
mabec-ai-matcher/
│
├── metadata.json
├── tsconfig.json
├── package.json
├── package-lock.json
├── index.html
├── .env.example
├── vite.config.ts
├── .gitignore
├── README.md
│
└── src/
    ├── index.css
    ├── App.tsx
    ├── main.tsx
    │
    ├── data/
    │   └── mabec-database.ts
    │
    └── services/
        └── geminiService.ts
```

## Important Files

### `src/App.tsx`

This is the main application component.

It handles:

* User search input.
* Search result display.
* Excel file upload.
* Catalog import.
* Navigation between views.
* Search history.
* Saving catalog and history in localStorage.
* Displaying confidence levels and candidate matches.

Main views include:

* Matching interface.
* Catalog view.
* Import view.
* History view.

### `src/services/geminiService.ts`

This file contains the main matching logic.

It includes:

* Text normalization.
* Accent removal.
* Punctuation cleaning.
* Glossary-based synonym handling.
* Fuzzy matching using Levenshtein distance.
* Technical attribute extraction.
* Candidate scoring.
* Confidence level assignment.
* Clarification suggestions for vague queries.
* Batch matching.

Although the file name is `geminiService.ts`, the stable version uses explainable local TypeScript matching logic.

### `src/data/mabec-database.ts`

This file contains the default MABEC catalog used when no external Excel file is imported.

Each item contains:

* `article`
* `designation`

Example:

```ts
{
  article: "IM01533203",
  designation: "BP.LUM AFF BLEU REF XB4BW36B5"
}
```

### `src/main.tsx`

This file starts the React application and renders the main `App` component.

### `src/index.css`

This file contains the global styling, Tailwind CSS import, fonts, and custom Stellantis-inspired colors.

### `package.json`

This file defines the project dependencies and scripts.

Main scripts:

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## How the Matching Logic Works

The matching process follows several steps.

### 1. Query Normalization

The user query is cleaned by:

* Converting text to lowercase.
* Removing accents.
* Removing punctuation.
* Replacing special characters with spaces.
* Collapsing multiple spaces.

This helps compare terms like:

* `désignation` and `designation`
* `BP.LUM` and `bp lum`
* `bouton bleu` and `boutton blue`

### 2. Exact Matching

The system first checks for exact matches:

* Exact Article match.
* Exact Désignation article match.

Exact matches receive the highest confidence score.

### 3. Token Matching

If there is no exact match, the query is split into tokens.

Example:

```text
bouton bleu
```

becomes:

```text
bouton
bleu
```

The system compares these tokens with the article and designation tokens.

### 4. Glossary and Synonym Matching

The system uses a manual industrial glossary to connect equivalent terms.

Examples:

```text
button → bouton
blue → bleu
bp → bouton poussoir
lum → lumineux
aff → affleurant
ref → reference
```

This improves matching when users search with abbreviations or English/French mixed terms.

### 5. Fuzzy Matching

The system uses Levenshtein distance to tolerate small spelling mistakes.

Example:

```text
boutton
```

can still be matched with:

```text
bouton
```

### 6. Attribute Extraction

The system extracts useful technical attributes such as:

* Type
* Material
* Color
* Voltage
* Dimension
* Technical reference

Example:

```text
blue button 24v
```

may extract:

```text
Color: blue
Voltage: 24v
Type: button
```

### 7. Scoring and Ranking

Each catalog item receives a confidence score based on:

* Exact match.
* Number of matched tokens.
* Glossary matches.
* Fuzzy matches.
* Phrase match bonus.
* Article partial match bonus.
* Density penalty for weak matches.

The results are sorted from highest confidence to lowest confidence.

### 8. Confidence Levels

The system assigns confidence levels:

* High confidence: score >= 85
* Medium confidence: score >= 60
* Low confidence: score >= 35

### 9. Recommendation

The system gives a recommendation:

* `VALIDER_AUTO` when the match is strong.
* `VERIFIER` when the result needs manual checking.
* `DEMANDER_PRECISION` when the query is too vague.

## Example Queries

The system can handle queries such as:

```text
IM01533203
BP.LUM
bouton bleu
blue button
boutton blue
bouton tournant
joint viton
XB4BW36B5
```

## How to Run the Project Locally

### Prerequisites

Install Node.js.

### Installation

```bash
npm install
```

### Run the application

```bash
npm run dev
```

The application will run locally using Vite.

### Build the application

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Testing Scenarios

The project was tested with several types of searches:

1. Exact article code search.
2. Exact designation search.
3. Partial description search.
4. Abbreviation search.
5. Natural language search.
6. Spelling mistake search.
7. Vague query search.
8. Unknown item search.
9. French / English mixed query.
10. Technical reference search.

## Limitations

The current version is a stable prototype and has some limitations:

* The matching depends on the quality of the catalog.
* Some abbreviations must be manually added to the glossary.
* Very vague queries may require user clarification.
* The system does not yet use vector embeddings.
* The catalog is stored locally in the browser, not in a centralized database.
* The current version is not yet connected to a company ERP or inventory system.

## Future Improvements

Possible future improvements include:

* Add semantic search using embeddings.
* Add a vector database for better similarity matching.
* Expand the abbreviation and synonym glossary.
* Add user feedback to improve search quality.
* Add authentication for company users.
* Add role-based access.
* Connect the system to a real internal database.
* Add analytics for the most searched items.
* Improve multilingual support.
* Deploy the application internally.

## What I Learned

Through this project, I learned how to:

* Analyze a real industrial problem.
* Transform an Excel catalog into a searchable knowledge source.
* Design an assisted search workflow.
* Build a React and TypeScript web application.
* Import and process Excel files in the browser.
* Implement explainable matching logic.
* Use confidence scores to support decision-making.
* Prepare and defend a technical project.
* Identify future improvements such as semantic search and embeddings.

## Author

Developed by Fatima Dahamni
Computer Science / Artificial Intelligence Student
Semester 8 Internship Project
Stellantis Oran
