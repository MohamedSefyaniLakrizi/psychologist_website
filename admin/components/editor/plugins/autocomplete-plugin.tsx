"use client";

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { JSX } from "react";
import { useCallback, useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelectionStyleValueForProperty,
  $isAtNodeEnd,
} from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import type { BaseSelection, NodeKey, TextNode } from "lexical";
import {
  $addUpdateTag,
  $createTextNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  COMMAND_PRIORITY_LOW,
  HISTORY_MERGE_TAG,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_TAB_COMMAND,
} from "lexical";

import {
  $createAutocompleteNode,
  AutocompleteNode,
} from "@/components/editor/nodes/autocomplete-node";
import { addSwipeRightListener } from "@/components/editor/utils/swipe";

const HISTORY_MERGE = { tag: HISTORY_MERGE_TAG };

declare global {
  interface Navigator {
    userAgentData?: {
      mobile: boolean;
    };
  }
}

type SearchPromise = {
  dismiss: () => void;
  promise: Promise<null | string>;
};

export const uuid = Math.random()
  .toString(36)
  .replace(/[^a-z]+/g, "")
  .substring(0, 5);

// TODO lookup should be custom
function $search(selection: null | BaseSelection): [boolean, string] {
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return [false, ""];
  }
  const node = selection.getNodes()[0];
  const anchor = selection.anchor;
  // Check siblings?
  if (!$isTextNode(node) || !node.isSimpleText() || !$isAtNodeEnd(anchor)) {
    return [false, ""];
  }
  const word = [];
  const text = node.getTextContent();
  let i = node.getTextContentSize();
  let c;
  while (i-- && i >= 0 && (c = text[i]) !== " ") {
    word.push(c);
  }
  if (word.length === 0) {
    return [false, ""];
  }
  return [true, word.reverse().join("")];
}

// TODO query should be custom
function useQuery(): (searchText: string) => SearchPromise {
  return useCallback((searchText: string) => {
    const server = new AutocompleteServer();
    const response = server.query(searchText);
    return response;
  }, []);
}

function formatSuggestionText(suggestion: string): string {
  const userAgentData = window.navigator.userAgentData;
  const isMobile =
    userAgentData !== undefined
      ? userAgentData.mobile
      : window.innerWidth <= 800 && window.innerHeight <= 600;

  // French localization: show instruction in French for mobile (glisser) and keyboard (TAB)
  return `${suggestion} ${isMobile ? "(GLISSER \u2B95)" : "\u0009"}`;
}

export function AutocompletePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const query = useQuery();
  // const {toolbarState} = useToolbarState();

  useEffect(() => {
    let autocompleteNodeKey: null | NodeKey = null;
    let lastMatch: null | string = null;
    let lastSuggestion: null | string = null;
    let searchPromise: null | SearchPromise = null;
    let prevNodeFormat: number = 0;
    function $clearSuggestion() {
      const autocompleteNode =
        autocompleteNodeKey !== null
          ? $getNodeByKey(autocompleteNodeKey)
          : null;
      if (autocompleteNode !== null && autocompleteNode.isAttached()) {
        autocompleteNode.remove();
        autocompleteNodeKey = null;
      }
      if (searchPromise !== null) {
        searchPromise.dismiss();
        searchPromise = null;
      }
      lastMatch = null;
      lastSuggestion = null;
      prevNodeFormat = 0;
    }
    function updateAsyncSuggestion(
      refSearchPromise: SearchPromise,
      newSuggestion: null | string
    ) {
      if (searchPromise !== refSearchPromise || newSuggestion === null) {
        // Outdated or no suggestion
        return;
      }
      editor.update(() => {
        const selection = $getSelection();
        const [hasMatch, match] = $search(selection);
        if (!hasMatch || match !== lastMatch || !$isRangeSelection(selection)) {
          // Outdated
          return;
        }
        const fontSize = $getSelectionStyleValueForProperty(
          selection,
          "font-size",
          "16px"
        );

        const selectionCopy = selection.clone();
        const prevNode = selection.getNodes()[0] as TextNode;
        prevNodeFormat = prevNode.getFormat();
        const node = $createAutocompleteNode(
          formatSuggestionText(newSuggestion),
          uuid
        )
          .setFormat(prevNodeFormat)
          .setStyle(`font-size: ${fontSize}`);
        autocompleteNodeKey = node.getKey();
        selection.insertNodes([node]);
        $setSelection(selectionCopy);
        lastSuggestion = newSuggestion;
      }, HISTORY_MERGE);
    }

    function $handleAutocompleteNodeTransform(node: AutocompleteNode) {
      const key = node.getKey();
      if (node.__uuid === uuid && key !== autocompleteNodeKey) {
        // Max one Autocomplete node per session
        $clearSuggestion();
      }
    }
    function handleUpdate() {
      editor.update(() => {
        const selection = $getSelection();
        const [hasMatch, match] = $search(selection);
        if (!hasMatch) {
          $clearSuggestion();
          return;
        }
        if (match === lastMatch) {
          return;
        }
        $clearSuggestion();
        searchPromise = query(match);
        searchPromise.promise
          .then((newSuggestion) => {
            if (searchPromise !== null) {
              updateAsyncSuggestion(searchPromise, newSuggestion);
            }
          })
          .catch((e) => {
            if (e !== "Dismissed") {
              console.error(e);
            }
          });
        lastMatch = match;
      }, HISTORY_MERGE);
    }
    function $handleAutocompleteIntent(): boolean {
      if (lastSuggestion === null || autocompleteNodeKey === null) {
        return false;
      }
      const autocompleteNode = $getNodeByKey(autocompleteNodeKey);
      if (autocompleteNode === null) {
        return false;
      }

      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        // Outdated
        return false;
      }
      const fontSize = $getSelectionStyleValueForProperty(
        selection,
        "font-size",
        "16px"
      );

      const textNode = $createTextNode(lastSuggestion)
        .setFormat(prevNodeFormat)
        .setStyle(`font-size: ${fontSize}`);
      autocompleteNode.replace(textNode);
      textNode.selectNext();
      $clearSuggestion();
      return true;
    }
    function $handleKeypressCommand(e: Event) {
      if ($handleAutocompleteIntent()) {
        e.preventDefault();
        return true;
      }
      return false;
    }
    function handleSwipeRight(_force: number, e: TouchEvent) {
      editor.update(() => {
        if ($handleAutocompleteIntent()) {
          e.preventDefault();
        } else {
          $addUpdateTag(HISTORY_MERGE.tag);
        }
      });
    }
    function unmountSuggestion() {
      editor.update(() => {
        $clearSuggestion();
      }, HISTORY_MERGE);
    }

    const rootElem = editor.getRootElement();

    return mergeRegister(
      editor.registerNodeTransform(
        AutocompleteNode,
        $handleAutocompleteNodeTransform
      ),
      editor.registerUpdateListener(handleUpdate),
      editor.registerCommand(
        KEY_TAB_COMMAND,
        $handleKeypressCommand,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ARROW_RIGHT_COMMAND,
        $handleKeypressCommand,
        COMMAND_PRIORITY_LOW
      ),
      ...(rootElem !== null
        ? [addSwipeRightListener(rootElem, handleSwipeRight)]
        : []),
      unmountSuggestion
    );
  }, [editor, query]);

  return null;
}

/*
 * Simulate an asynchronous autocomplete server (typical in more common use cases like GMail where
 * the data is not static).
 */
class AutocompleteServer {
  DATABASE = DICTIONARY;
  LATENCY = 200;

  query = (searchText: string): SearchPromise => {
    let isDismissed = false;

    const dismiss = () => {
      isDismissed = true;
    };
    const promise: Promise<null | string> = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (isDismissed) {
          // TODO cache result
          return reject("Dismissed");
        }
        const searchTextLength = searchText.length;
        if (searchText === "" || searchTextLength < 4) {
          return resolve(null);
        }
        const char0 = searchText.charCodeAt(0);
        const isCapitalized = char0 >= 65 && char0 <= 90;
        const caseInsensitiveSearchText = isCapitalized
          ? String.fromCharCode(char0 + 32) + searchText.substring(1)
          : searchText;
        const match = this.DATABASE.find(
          (dictionaryWord) =>
            dictionaryWord.startsWith(caseInsensitiveSearchText) ?? null
        );
        if (match === undefined) {
          return resolve(null);
        }
        const matchCapitalized = isCapitalized
          ? String.fromCharCode(match.charCodeAt(0) - 32) + match.substring(1)
          : match;
        const autocompleteChunk = matchCapitalized.substring(searchTextLength);
        if (autocompleteChunk === "") {
          return resolve(null);
        }
        return resolve(autocompleteChunk);
      }, this.LATENCY);
    });

    return {
      dismiss,
      promise,
    };
  };
}

// Common French words used by psychologists in clinical practice and documentation
const DICTIONARY = [
  "patient",
  "psychothérapie",
  "dépression",
  "anxiété",
  "trouble",
  "symptôme",
  "diagnostic",
  "traitement",
  "thérapie",
  "consultation",
  "séance",
  "entretien",
  "anamnèse",
  "histoire",
  "comportement",
  "émotion",
  "stress",
  "traumatisme",
  "phobie",
  "panic",
  "obsession",
  "compulsion",
  "déliire",
  "hallucination",
  "schizophrénie",
  "bipolaire",
  "personnalité",
  "narcissique",
  "borderline",
  "psychopathe",
  "sociopathe",
  "névrose",
  "psychose",
  "rémission",
  "rechute",
  "médication",
  "antidépresseur",
  "anxiolytique",
  "neuroleptique",
  "lithium",
  "psychopharmacologie",
  "cognition",
  "pensée",
  "mémoire",
  "concentration",
  "perception",
  "attention",
  "apprentissage",
  "intelligence",
  "personnalité",
  "tempérament",
  "caractère",
  "défense",
  "mécanisme",
  "refoulement",
  "projection",
  "rationalisation",
  "sublimation",
  "transfert",
  "contre-transfert",
  "résistance",
  "régression",
  "analyse",
  "inconscient",
  "préconscient",
  "conscient",
  "libido",
  "pulsion",
  "désir",
  "conflit",
  "complexe",
  "œdipe",
  "électre",
  "complexe",
  "culpabilité",
  "honte",
  "humiliation",
  "rejet",
  "abandon",
  "dépendance",
  "autonomie",
  "indépendance",
  "sécurité",
  "confiance",
  "méfiance",
  "estime",
  "identité",
  "estime de soi",
  "image",
  "schéma",
  "croyance",
  "pensée automatique",
  "distorsion",
  "catastrophe",
  "rumination",
  "obsession",
  "compulsion",
  "rituel",
  "peur",
  "terreur",
  "panique",
  "vécu",
  "ressenti",
  "éprouvé",
  "aisance",
  "malaise",
  "inconfort",
  "bien-être",
  "mal-être",
  "euphorie",
  "apathie",
  "anhedonie",
  "culpabilité",
  "hopelessness",
  "suicidalité",
  "automutilation",
  "risque",
  "protection",
  "facteur",
  "prédisposant",
  "précipitant",
  "maintenant",
  "résilience",
  "vulnérabilité",
  "coping",
  "adaptation",
  "stratégie",
  "ressource",
  "support",
  "soutien",
  "famille",
  "relation",
  "lien",
  "attachement",
  "séparation",
  "perte",
  "deuil",
  "endeuillé",
  "chagrin",
  "nostalgie",
  "regret",
  "remord",
  "ressentiment",
  "colère",
  "rage",
  "irritabilité",
  "frustration",
  "limitation",
  "frustration",
  "privation",
  "carence",
  "manque",
  "besoin",
  "désir",
  "frustration",
  "satisfaction",
  "récompense",
  "punition",
  "renforcement",
  "conditionnement",
  "stimulus",
  "réponse",
  "réflexe",
  "comportement",
  "action",
  "acte",
  "habitude",
  "rituel",
  "compulsion",
  "impulsion",
  "contrôle",
  "impulsivité",
  "impulsif",
  "impétueux",
  "réflexion",
  "méditation",
  "rumination",
  "préoccupation",
  "inquiétude",
  "souci",
  "tracas",
  "problème",
  "difficulté",
  "défi",
  "obstacle",
  "barrière",
  "limite",
  "frontière",
  "intimité",
  "confidentialité",
  "secret",
  "tabou",
  "interdit",
  "violation",
  "abus",
  "maltraitance",
  "négligence",
  "abandon",
  "exploitation",
  "victimisation",
  "victimité",
  "agressivité",
  "violence",
  "cruauté",
  "sadisme",
  "masochisme",
  "perversion",
  "sexualité",
  "identité sexuelle",
  "orientationsexuelle",
  "préférence",
  "pratique",
  "déviance",
  "paraphilie",
  "exhibitionnisme",
  "voyeurisme",
  "pédophilie",
  "sadomasochisme",
  "fétichisme",
  "transgression",
  "normé",
  "normatif",
  "social",
  "sociétal",
  "culture",
  "tradition",
  "norme",
  "valeur",
  "éthique",
  "morale",
  "culpabilité",
  "responsabilité",
  "imputabilité",
  "libre arbitre",
  "déterminisme",
  "génétique",
  "hérédité",
  "environnement",
  "nature",
  "nurture",
  "développement",
  "croissance",
  "maturation",
  "régression",
  "évolution",
  "progrès",
  "stade",
  "phase",
  "période",
  "crise",
  "transition",
  "changement",
  "transformation",
  "adaptation",
  "ajustement",
  "équilibre",
  "homéostasie",
  "déséquilibre",
  "perturbation",
  "dérangement",
  "trouble",
  "pathologie",
  "maladie",
  "affection",
  "condition",
  "état",
  "syndrome",
  "complexe",
  "tableau",
  "présentation",
  "manifestation",
  "expression",
  "symptomatologie",
  "clinique",
  "signe",
  "indication",
  "profil",
  "prototype",
  "archétype",
  "modèle",
  "exemple",
  "cas",
  "histoire",
  "récit",
  "narration",
  "discours",
  "parole",
  "silence",
  "absence",
  "présence",
  "écoute",
  "attention",
  "regard",
  "observation",
  "notation",
  "documentation",
  "dossier",
  "rapport",
  "conclusion",
  "diagnostic",
  "pronostic",
  "évolution",
  "perspective",
  "horizon",
  "avenir",
  "espoir",
  "pessimisme",
  "optimisme",
  "réalisme",
  "rêve",
  "fantaisie",
  "fantasme",
  "réalité",
  "illusion",
  "délire",
  "hallucination",
  "percept",
  "interprétation",
  "signification",
  "sens",
  "symbolique",
  "allégorie",
  "métaphore",
  "langage",
  "communication",
  "expression",
  "verbale",
  "non-verbale",
  "gestuelle",
  "expression faciale",
  "ton",
  "intonation",
  "prosodie",
  "débit",
  "flux",
  "logorrhée",
  "mutisme",
  "agressif",
  "passif",
  "assertif",
  "dépendant",
  "indépendant",
  "dominance",
  "soumission",
  "rébellion",
  "conformité",
  "contre-conformité",
  "nonchalance",
  "apathie",
  "hyperactivité",
  "agitation",
  "mouvement",
  "repos",
  "sommeil",
  "insomnie",
  "hypersomnie",
  "cauchemar",
  "rêve",
  "énurésie",
  "éncoprésie",
  "somnambalisme",
  "parasomnie",
  "appétit",
  "faim",
  "saturation",
  "nausée",
  "vomissement",
  "diarrhée",
  "constipation",
  "boulimie",
  "anorexie",
  "orthorexie",
  "pica",
  "alimentation",
  "nutrition",
  "régime",
  "jeûne",
  "purge",
  "abus",
  "dépendance",
  "addiction",
  "alcoolisme",
  "toxicomanie",
  "tabagisme",
  "caféine",
  "substance",
  "drogue",
  "narcotique",
  "stimulant",
  "dépresseur",
  "hallucinogène",
  "psychotomimétique",
  "euphorisant",
  "intoxication",
  "sevrage",
  "abstinence",
  "rechute",
  "rémission",
  "sobriété",
  "lucidité",
  "clarté",
  "confusion",
  "désorientation",
  "délirium",
  "démence",
  "déclin",
  "dégénérescence",
  "détérioration",
  "amélioration",
  "guérison",
  "rétablissement",
  "convalescence",
  "réhabilitation",
  "réinsertion",
  "réadaptation",
  "pendant",
  "après",
  "avant",
  "depuis",
  "jusqu'à",
  "durant",
  "ainsi",
  "donc",
  "car",
  "mais",
  "cependant",
  "toutefois",
  "néanmoins",
  "d'ailleurs",
  "enfin",
  "bref",
  "parce que",
  "pour",
  "puisque",
  "afin",
  "dans",
  "sur",
  "sous",
  "avec",
  "sans",
  "entre",
  "parmi",
  "selon",
  "malgré",
  "face",
  "vis-à-vis",
  "rapport",
  "concernant",
  "quant",
  "au sujet",
  "à propos",
  "notamment",
  "particulièrement",
  "spécialement",
  "notamment",
  "notamment",
  "également",
  "aussi",
  "de plus",
  "en plus",
  "davantage",
  "moindre",
  "moins",
  "plus",
  "très",
  "beaucoup",
  "peu",
  "assez",
  "plutôt",
  "surtout",
  "principalement",
  "essentiellement",
  "fondamentalement",
  "véritablement",
  "réellement",
  "effectivement",
  "actuellement",
  "actuellement",
  "désormais",
  "désormais",
  "auparavant",
  "antérieurement",
  "récemment",
  "jadis",
  "naguère",
  "actuellement",
  "actuellement",
  "aujourd'hui",
  "maintenant",
  "jours",
  "semaines",
  "mois",
  "années",
  "instant",
  "moment",
  "période",
  "époque",
  "fois",
  "occasion",
  "circonstance",
  "situation",
  "contexte",
  "cadre",
  "milieu",
  "environnement",
  "entourage",
  "proche",
  "loin",
  "distance",
  "proximité",
  "intimité",
  "espace",
  "territoire",
  "domaine",
  "champ",
  "sphère",
  "zone",
  "région",
  "lieu",
  "place",
  "endroit",
  "site",
  "localité",
  "monde",
  "univers",
  "réalité",
  "vérité",
  "fait",
  "réalité",
  "existence",
  "présence",
  "absence",
  "manque",
  "vide",
  "plénitude",
  "totalité",
  "entité",
  "essence",
  "nature",
  "caractère",
  "qualité",
  "propriété",
  "attribut",
  "trait",
  "aspect",
  "côté",
  "angle",
  "perspective",
  "point",
  "vue",
  "regard",
  "vision",
  "perception",
  "sensation",
  "impression",
  "sentiment",
  "émotion",
  "affect",
  "état",
  "disposition",
  "humeur",
  "ton",
  "ambiance",
  "atmosphère",
  "climat",
  "aura",
  "essence",
  "esprit",
  "âme",
  "cœur",
  "conscience",
  "mental",
  "psyché",
  "psych",
  "psychisme",
  "personnalité",
  "moi",
  "ego",
  "soi",
  "identité",
  "image",
  "représentation",
  "concept",
  "notion",
  "idée",
  "pensée",
  "réflexion",
  "méditation",
  "contemplation",
  "introspection",
  "auto-réflexion",
  "conscience",
  "prise de conscience",
  "lucidité",
  "clairvoyance",
  "compréhension",
  "intelligence",
  "raison",
  "logique",
  "sens",
  "signification",
  "interprétation",
  "analyse",
  "synthèse",
  "évaluation",
  "jugement",
  "critique",
  "appréciation",
  "considération",
  "examen",
  "inspection",
  "investigation",
  "exploration",
  "recherche",
  "enquête",
  "étude",
  "observation",
  "surveillance",
  "monitoring",
  "suivi",
  "continuité",
  "progression",
  "évolution",
  "développement",
  "croissance",
  "expansion",
  "amélioration",
  "progrès",
  "avancement",
  "régression",
  "déclin",
  "détérioration",
  "dégénérescence",
  "problématique",
  "problème",
  "difficulté",
  "défi",
  "obstacle",
  "entrave",
  "blocage",
  "résistance",
  "friction",
  "conflit",
  "tension",
  "crispation",
  "rigidité",
  "flexibilité",
  "adaptabilité",
  "plasticité",
  "élasticité",
  "résilience",
  "robustesse",
  "fragilité",
  "vulnérabilité",
  "faiblesse",
  "force",
  "puissance",
  "énergie",
  "vitalité",
  "vigueur",
  "dynamique",
  "stagnation",
  "paralysie",
  "inertie",
  "apathie",
  "indifférence",
  "détachement",
  "distanciation",
  "engagement",
  "implication",
  "investissement",
  "intérêt",
  "curiosité",
  "motivation",
  "désir",
  "volonté",
  "intention",
  "but",
  "objectif",
  "finalité",
  "horizon",
  "perspective",
  "avenir",
  "espoir",
  "crainte",
  "appréhension",
  "angoisse",
  "inquiétude",
  "peur",
  "terreur",
  "panique",
  "affolement",
  "hystérie",
  "crise",
  "urgence",
  "priorité",
  "importance",
  "gravité",
  "sérieux",
  "légèreté",
  "frivolité",
  "superficialité",
  "profondeur",
  "intensité",
  "magnitude",
  "amplitude",
  "degré",
  "niveau",
  "échelle",
  "mesure",
  "quantité",
  "qualité",
  "valeur",
  "prix",
  "coût",
  "profit",
  "bénéfice",
  "avantage",
  "inconvénient",
  "désavantage",
  "handicap",
  "limitation",
  "restriction",
  "interdiction",
  "prohibition",
  "autorisation",
  "permission",
  "consentement",
  "accord",
  "approbation",
  "validation",
  "légitimité",
  "légalité",
  "droit",
  "justice",
  "équité",
  "égalité",
  "inégalité",
  "discrimination",
  "stigmatisation",
  "étiquetage",
  "catégorisation",
  "classification",
  "typologie",
  "diagnostic",
  "formulation",
  "conceptualisation",
  "théorisation",
  "hypothèse",
  "supposition",
  "conjecture",
  "spéculation",
  "déduction",
  "induction",
  "conclusion",
  "résultat",
  "conséquence",
  "effet",
  "impact",
  "influence",
  "répercussion",
  "implication",
  "aboutissement",
  "finalité",
  "terme",
  "fin",
  "conclusion",
  "clôture",
  "fermeture",
  "rupture",
  "séparation",
  "détachement",
  "lâcher-prise",
  "acceptation",
  "résignation",
  "soumission",
  "défaite",
  "victoire",
  "triomphe",
  "succès",
  "réussite",
  "accomplissement",
  "réalisation",
  "concrétisation",
  "manifestation",
  "expression",
  "assertion",
  "affirmation",
  "conviction",
  "certitude",
  "doute",
  "hésitation",
  "ambiguïté",
  "équivoque",
  "clarté",
  "confusion",
  "obscurité",
  "transparence",
  "opacité",
  "sincérité",
  "honnêteté",
  "authenticité",
  "véracité",
  "mensonge",
  "tromperie",
  "duperie",
  "supercherie",
  "fraude",
  "manipulation",
  "influence",
  "persuasion",
  "coercition",
  "contrainte",
  "coaction",
  "liberté",
  "autonomie",
  "indépendance",
  "autodétermination",
  "choix",
  "décision",
  "sélection",
  "discernement",
  "discrimination",
  "préférence",
  "inclinaison",
  "penchant",
  "tendance",
  "prédisposition",
  "disposition",
  "tempérament",
  "nature",
  "essence",
  "quiddité",
  "substance",
  "accidentel",
  "contingent",
  "nécessaire",
  "inévitable",
  "fatal",
  "certain",
  "possible",
  "probable",
  "improbable",
  "vraisemblable",
  "invraisemblable",
  "plausible",
  "implausible",
  "crédible",
  "incrédible",
  "admissible",
  "inadmissible",
  "acceptable",
  "inacceptable",
  "supportable",
  "insupportable",
  "tolérable",
  "intolérable",
  "compréhensible",
  "incompréhensible",
  "intelligible",
  "inintelligible",
  "sensé",
  "insensé",
  "logique",
  "illogique",
  "rationnel",
  "irrationnel",
  "raisonnable",
  "déraisonnable",
  "judicieux",
  "injudicieux",
];
