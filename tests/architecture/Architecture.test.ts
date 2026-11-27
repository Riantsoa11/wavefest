import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Équivalent d'ArchUnit : vérifie l'architecture hexagonale de chaque bounded context
 * et les frontières entre contextes.
 */
const RACINE = resolve(__dirname, "../../src/fr/wavefest");
const CONTEXTES = ["billetterie", "programmation", "revente", "controle-acces", "cashless", "remboursements"];

function fichiersDe(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    return statSync(chemin).isDirectory() ? fichiersDe(chemin) : chemin.endsWith(".ts") ? [chemin] : [];
  });
}

const TOUS = fichiersDe(RACINE);
const source = (fichier: string) => readFileSync(fichier, "utf8");
const chemin = (fichier: string) => relative(RACINE, fichier).split(sep).join("/");

/** Les imports d'un fichier, résolus en chemins relatifs à src/fr/wavefest (ou « paquet: »). */
function importsDe(fichier: string): string[] {
  return [...source(fichier).matchAll(/from\s+["']([^"']+)["']/g)].map((m) => {
    const cible = m[1] ?? "";
    return cible.startsWith(".") ? chemin(resolve(dirname(fichier), cible)) : `paquet:${cible}`;
  });
}

const contexteDe = (cheminRelatif: string) => cheminRelatif.split("/")[0] ?? "";
const coucheDe = (cheminRelatif: string) => cheminRelatif.split("/")[1] ?? "";

function violations(filtre: (fichier: string) => boolean, interdit: (fichier: string, cible: string) => boolean): string[] {
  return TOUS.filter(filtre).flatMap((f) =>
    importsDe(f)
      .filter((cible) => interdit(chemin(f), cible))
      .map((cible) => `${chemin(f)} → ${cible}`),
  );
}

describe("Architecture hexagonale de chaque contexte", () => {
  it.each(CONTEXTES)("%s : le domaine n'importe que son propre domaine (aucune bibliothèque)", (contexte) => {
    expect(
      violations(
        (f) => chemin(f).startsWith(`${contexte}/domaine/`),
        (_, cible) => !cible.startsWith(`${contexte}/domaine/`),
      ),
    ).toEqual([]);
  });

  it.each(CONTEXTES)("%s : l'application n'importe ni l'infrastructure ni les systèmes externes", (contexte) => {
    expect(
      violations(
        (f) => chemin(f).startsWith(`${contexte}/application/`),
        (_, cible) => cible.startsWith(`${contexte}/infrastructure/`) || cible.startsWith("externe/"),
      ),
    ).toEqual([]);
  });
});

describe("Frontières entre bounded contexts", () => {
  it("aucun contexte n'importe le code d'un autre contexte (seulement le langage publié)", () => {
    expect(
      violations(
        (f) => CONTEXTES.includes(contexteDe(chemin(f))),
        (fichier, cible) => CONTEXTES.includes(contexteDe(cible)) && contexteDe(cible) !== contexteDe(fichier),
      ),
    ).toEqual([]);
  });

  it("le langage publié ne dépend d'aucun contexte", () => {
    expect(violations((f) => chemin(f).startsWith("integration/"), (_, cible) => !cible.startsWith("integration/"))).toEqual([]);
  });

  it("les systèmes externes ne sont utilisés que depuis l'infrastructure (ACL ou Conformist)", () => {
    expect(
      violations(
        (f) => CONTEXTES.includes(contexteDe(chemin(f))),
        (fichier, cible) => cible.startsWith("externe/") && coucheDe(fichier) !== "infrastructure",
      ),
    ).toEqual([]);
  });

  it("ACL étanche : le vocabulaire du PSP reste dans externe/psp et les dossiers infrastructure/psp", () => {
    const fautifs = TOUS.map(chemin)
      .filter((f) => !f.startsWith("externe/psp/") && !f.includes("/infrastructure/psp/"))
      .filter((f) => /succeeded|payment_?intent|amount_cents|createRefund/i.test(source(join(RACINE, f))));
    expect(fautifs).toEqual([]);
  });
});

describe("Règles du domaine", () => {
  const domaines = TOUS.filter((f) => coucheDe(chemin(f)) === "domaine");

  it("aucun domaine ne lit l'horloge du système (pas de new Date() ni Date.now())", () => {
    expect(domaines.filter((f) => /new Date\(\)|Date\.now\(\)/.test(source(f))).map(chemin)).toEqual([]);
  });

  it("aucun setter public dans les domaines", () => {
    expect(
      domaines.filter((f) => /^\s*(public\s+)?set\s+\w+\s*\(|^\s*(public\s+)?set[A-Z]\w*\s*\(/m.test(source(f))).map(chemin),
    ).toEqual([]);
  });

  it("dans la Billetterie, pas de nombre pour l'argent hors du Value Object Montant", () => {
    const fautifs = domaines
      .filter((f) => chemin(f).startsWith("billetterie/") && !f.endsWith("Montant.ts"))
      .filter((f) => /prix\w*\s*:\s*number|montant\w*\s*:\s*number/i.test(source(f)));
    expect(fautifs.map(chemin)).toEqual([]);
  });
});
