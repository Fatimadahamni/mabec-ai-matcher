import { GoogleGenAI, Type } from "@google/genai";
import { MABEC_CATALOG, MabecItem } from "../data/mabec-database.ts";

export interface MabecMatch {
  code: string;
  description: string;
  confiance: number;
  justification: string;
  niveau: string;
}

export interface MatchResult {
  supplierDescription: string;
  descriptionAnalysee: string;
  attributsExtraits: Record<string, string>;
  matches: MabecMatch[];
  actionRecommandee: string;
  remarque: string;
}

// Initialize AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function matchSupplierDescription(description: string, catalog: MabecItem[]): Promise<MatchResult> {
  if (!description.trim()) {
    throw new Error("La description du fournisseur est vide.");
  }

  // Use the provided catalog for context
  const catalogContext = catalog.map(item => 
    `${item.article} | ${item.designation}`
  ).join("\n");

  const prompt = `
Tu es un expert en quincaillerie, visserie et fournitures industrielles.
Ta mission : identifier le code MABEC correspondant à une description fournisseur.

## CATALOGUE MABEC DISPONIBLE
${catalogContext.slice(0, 20000)}
(format : CODE | DESCRIPTION)

## DESCRIPTION FOURNISSEUR À ANALYSER
"${description}"

## RÈGLES D'ANALYSE
1. Identifie les attributs clés : type de fixation, matière, traitement de surface, 
   dimensions (diamètre, longueur, pas), norme, classe de résistance, couleur.
2. Tolère les fautes d'orthographe, abréviations et variations linguistiques :
   - BP = Bouton Poussoir = Push Button
   - LUM = Lumineux / AFF = Affleurant
   - CHC = Cylindrique Hexagone Creux = Socket Head Cap
   - BHC = Boulon Hexagonal = Hex Bolt
   - M8 = Métrique 8mm de diamètre
   - Zingué = Zn = électrozingué = galvanisé à froid
   - Inox = Inoxydable = SS = A2 = A4
   - cl.8.8 / 8.8 / classe 8.8 = même chose
3. Priorise les correspondances dans cet ordre :
   a. Type de pièce (vis, bouton, boulon, écrou...)
   b. Dimensions / Caractéristiques spécifiques (Couleur pour un bouton)
   c. Matière / traitement de surface
   d. Classe de résistance / norme
4. Si plusieurs codes sont plausibles, fournis-en jusqu'à 10, classés par pertinence décroissante.
5. Ne jamais inventer un code absent du catalogue.

## FORMAT DE RÉPONSE (JSON strict, aucun texte autour)
{
  "description_analysee": "...",
  "attributs_extraits": {
    "type": "...",
    "diametre": "...",
    "longueur": "...",
    "materiau": "...",
    "traitement": "...",
    "classe": "...",
    "norme": "...",
    "couleur": "..."
  },
  "resultats": [
    {
      "rang": 1,
      "code_mabec": "...",
      "description_interne": "...",
      "score_confiance": 92,
      "niveau": "CERTAIN",
      "justification": "...",
      "differences_notees": "..."
    }
  ],
  "action_recommandee": "VALIDER_AUTO",
  "remarque": "..."
}

## NIVEAUX DE CONFIANCE
- CERTAIN (85-100) : correspondance directe, tous attributs concordants
- PROBABLE (65-84) : correspondance forte, 1-2 attributs incertains
- POSSIBLE (40-64) : correspondance partielle, vérification recommandée  
- INCERTAIN (0-39) : trop d'ambiguïté, intervention humaine requise

## ACTION RECOMMANDÉE
- VALIDER_AUTO : score ≥ 85, utiliser directement
- VERIFIER : score 60-84, soumettre à validation magasinier
- DEMANDER_PRECISION : description trop incomplète pour matcher
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    
    // Map all results and verify against catalog
    const matches: MabecMatch[] = (result.resultats || []).map((r: any) => {
      const catalogItem = catalog.find(item => item.article === r.code_mabec);
      return {
        code: catalogItem ? catalogItem.article : r.code_mabec,
        description: catalogItem ? catalogItem.designation : r.description_interne,
        confiance: r.score_confiance || 0,
        justification: r.justification || "",
        niveau: r.niveau || "INCERTAIN"
      };
    });

    return {
      supplierDescription: description,
      descriptionAnalysee: result.description_analysee || "",
      attributsExtraits: result.attributs_extraits || {},
      matches: matches,
      actionRecommandee: result.action_recommandee || "DEMANDER_PRECISION",
      remarque: result.remarque || ""
    };
  } catch (error: any) {
    console.error("Match Error:", error);
    return {
      supplierDescription: description,
      descriptionAnalysee: "",
      attributsExtraits: {},
      matches: [],
      actionRecommandee: "VERIFIER",
      remarque: `Erreur technique: ${error.message}`
    };
  }
}

export async function matchBatchDescriptions(descriptions: string[], catalog: MabecItem[]): Promise<MatchResult[]> {
  // We can process them sequentially or in parallel depending on quota.
  // For simplicity and to avoid rate limits, we'll do them sequentially in this helper.
  const results: MatchResult[] = [];
  for (const desc of descriptions) {
    if (desc.trim()) {
      results.push(await matchSupplierDescription(desc, catalog));
    }
  }
  return results;
}
