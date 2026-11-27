import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Équivalent d'ArchUnit : vérifie le sens des dépendances de l'architecture hexagonale.
 * domaine ← application ← infrastructure (les flèches pointent vers le centre).
 */
const RACINE = join(__dirname, "../../src/fr/wavefest/billetterie");

function fichiersDe(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    return statSync(chemin).isDirectory() ? fichiersDe(chemin) : chemin.endsWith(".ts") ? [chemin] : [];
  });
}

function importsDe(fichier: string): string[] {
  const source = readFileSync(fichier, "utf8");
  return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1] ?? "");
}

const fichiers = (couche: string) => fichiersDe(join(RACINE, couche));

describe("Architecture hexagonale", () => {
  it("le domaine n'importe ni l'application, ni l'infrastructure, ni aucune bibliothèque", () => {
    const fautifs = fichiers("domaine").flatMap((f) =>
      importsDe(f)
        .filter((i) => !i.startsWith(".") || i.includes("application") || i.includes("infrastructure"))
        .map((i) => `${relative(RACINE, f)} → ${i}`),
    );
    expect(fautifs).toEqual([]);
  });

  it("l'application n'importe pas l'infrastructure", () => {
    const fautifs = fichiers("application").flatMap((f) =>
      importsDe(f)
        .filter((i) => i.includes("infrastructure"))
        .map((i) => `${relative(RACINE, f)} → ${i}`),
    );
    expect(fautifs).toEqual([]);
  });

  it("le domaine ne lit jamais l'horloge du système (pas de new Date() sans argument ni Date.now())", () => {
    const fautifs = fichiers("domaine").filter((f) => /new Date\(\)|Date\.now\(\)/.test(readFileSync(f, "utf8")));
    expect(fautifs.map((f) => relative(RACINE, f))).toEqual([]);
  });

  it("ACL étanche : le vocabulaire du PSP (succeeded, payment_intent…) ne sort pas de infrastructure/psp", () => {
    const horsAcl = fichiersDe(RACINE).filter((f) => !f.includes(join("infrastructure", "psp")));
    const fautifs = horsAcl.filter((f) => /succeeded|payment_?intent|amount_cents/i.test(readFileSync(f, "utf8")));
    expect(fautifs.map((f) => relative(RACINE, f))).toEqual([]);
  });

  it("aucun setter public dans le domaine", () => {
    const fautifs = fichiers("domaine").filter((f) => /^\s*(public\s+)?set\s*\w*\s*\(|^\s*(public\s+)?set[A-Z]\w*\s*\(/m.test(readFileSync(f, "utf8")));
    expect(fautifs.map((f) => relative(RACINE, f))).toEqual([]);
  });

  it("aucun nombre à virgule pour l'argent hors du Value Object Montant", () => {
    const fautifs = fichiers("domaine")
      .filter((f) => !f.endsWith("Montant.ts"))
      .filter((f) => /prix\w*\s*:\s*number|montant\w*\s*:\s*number/i.test(readFileSync(f, "utf8")));
    expect(fautifs.map((f) => relative(RACINE, f))).toEqual([]);
  });
});
