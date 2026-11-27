# Workflow

1. Créer une branche `feature/…` ou `fix/…` (une par règle : `feature/r1-limite-billets`…). Jamais de commit direct sur `main`.
2. Un seul sujet par branche ; les bugs passent avant les nouveautés.
3. Boucle : écrire le test Given / When / Then → rouge → coder dans le domaine → vert → commit.
4. `npm test` et `npm run typecheck` verts avant chaque commit.
5. Pull request relue par un autre membre ; le gardien du langage relit les noms.
6. Commits en français : `type(portée): description` (ex. `feat(commande): R1 limite de 6 billets`).
7. Mettre à jour la doc (glossaire, CHANGELOG, DONE) en fin de session.
