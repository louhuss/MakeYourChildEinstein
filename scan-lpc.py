#!/usr/bin/env python3
"""
Parcourt assets/lpc/ et fabrique assets/lpc/manifest.json.
À relancer après chaque nouvel export du générateur LPC.
Chaque export « ZIP: Split by item » donne un dossier items/ dont les noms
de fichiers indiquent la catégorie par leur numéro de préfixe.
"""
import json, os, re, glob

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'lpc')

# Le générateur préfixe chaque calque d'un numéro qui donne l'ordre d'empilement.
# On s'en sert pour deviner la catégorie.
def categorie(nom, prefixe):
    """Classe un calque. On se fie d'abord au nom, puis au numero de
    prefixe : le generateur LPC s'en sert comme ordre d'empilement, ce qui
    donne une plage fiable par type de vetement."""
    n = nom.lower()
    if re.search(r'body_color|body color', n): return 'corps'
    if re.search(r'neutral|angry|happy|sad|surprise|face|expression', n): return 'visage'
    if re.search(r'human_|heads?_|skeleton|orc|elf|zombie|goblin', n) and prefixe < 130: return 'tete'
    if re.search(r'hair|bangs|braid|afro|ponytail|bob|curly|pixie|bun|dreads|mohawk|shoulderl', n): return 'cheveux'
    if re.search(r'shirt|tunic|blouse|jacket|coat|dress|robe|vest|torso|chest|armour|armor'
                 r'|cardigan|sweater|pullover|sleeve|corset|apron|overall|chainmail|top', n): return 'haut'
    if re.search(r'pants|trousers|skirt|shorts|legs|leggings|kilt|pantaloons', n): return 'bas'
    if re.search(r'shoe|boot|sandal|feet|slipper', n): return 'chaussures'
    if re.search(r'hat|cap\b|helmet|crown|bandana|hood|tiara|headband', n): return 'chapeau'
    if re.search(r'glasses|eyewear|goggles|visor', n): return 'lunettes'
    if re.search(r'cape|cloak|backpack|bag|quiver|wings', n): return 'dos'
    # repli sur la plage de numeros d'empilement du generateur
    if 10 <= prefixe <= 14: return 'corps'
    if 15 <= prefixe <= 19: return 'chaussures'
    if 20 <= prefixe <= 29: return 'bas'
    if 30 <= prefixe <= 79: return 'haut'
    if 100 <= prefixe <= 104: return 'tete'
    if 105 <= prefixe <= 119: return 'visage'
    if 120 <= prefixe <= 199: return 'cheveux'
    if 200 <= prefixe <= 299: return 'chapeau'
    return None

ORDRE = ['corps', 'tete', 'visage', 'bas', 'haut', 'chaussures', 'cheveux', 'chapeau', 'lunettes', 'dos']

calques = {c: [] for c in ORDRE}
vus = set()

for chemin in sorted(glob.glob(os.path.join(BASE, '**', 'items', '*.png'), recursive=True)):
    fichier = os.path.basename(chemin)
    m = re.match(r'^(\d+)\s+(.*)\.png$', fichier)
    prefixe = int(m.group(1)) if m else 999
    brut = m.group(2) if m else fichier[:-4]
    cat = categorie(brut, prefixe)
    if not cat:
        continue
    joli = brut.replace('__', ' (').replace('_', ' ').strip()
    if '(' in joli and not joli.endswith(')'): joli = joli.rstrip(' ') + ')'
    joli = re.sub(r'\s+', ' ', joli).strip().capitalize()
    rel = os.path.relpath(chemin, BASE).replace(os.sep, '/')
    cle = cat + '|' + joli
    if cle in vus:
        continue
    vus.add(cle)
    calques[cat].append({'id': re.sub(r'[^a-z0-9]+', '-', brut.lower()).strip('-'),
                         'nom': joli, 'fichier': rel, 'ordre': prefixe})

for c in calques:
    calques[c].sort(key=lambda x: x['ordre'])

manifest = {
    'cadre': 64,
    'marche': {'ligneDepart': 8, 'nbLignes': 4, 'nbImages': 9, 'colonnes': 13},
    'directions': ['up', 'left', 'down', 'right'],
    'ordreCalques': ORDRE,
    'calques': calques
}
with open(os.path.join(BASE, 'manifest.json'), 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=1)

print('manifest.json écrit')
for c in ORDRE:
    print('  %-12s %d calque(s)' % (c, len(calques[c])))
habillable = len(calques['haut']) > 0 and len(calques['bas']) > 0
print('\nHabillage possible :', 'OUI' if habillable else 'NON — il manque des hauts et/ou des bas')
