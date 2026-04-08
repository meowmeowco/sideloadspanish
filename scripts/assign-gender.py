#!/usr/bin/env python3
"""
Assign Spanish grammatical gender to nouns in vocabulary.json.

Strategy:
1. Known non-nouns (verbs, adjectives, pronouns, etc.) get gender: null
2. Spanish gender rules for clear cases
3. Exception lists for irregular gender
4. Outputs stats and flagged ambiguous cases for manual review
"""

import json
import sys

# ── Non-noun English words (no gender assignment) ──

FUNCTION_WORDS = {
    # articles, prepositions, conjunctions, pronouns, determiners
    'the','a','an','to','of','and','in','that','for','not','on','with','as','at',
    'but','by','from','or','will','my','one','all','would','there','their','what',
    'so','up','out','if','about','who','which','when','can','like','no','just',
    'than','how','other','very','much','where','most','some','more','into','over',
    'such','through','down','between','each','under','since','every','too','any',
    'both','few','own','its','his','her','our','your','them','they','we','he','she',
    'it','I','me','him','us','you','this','these','those','that','here','there',
    'now','then','again','also','still','already','yet','soon','quite','rather',
    'never','always','often','sometimes','perhaps','maybe','however','therefore',
    'although','though','because','while','until','unless','whether','whom','whose',
    'whoever','whatever','wherever','whenever','themselves','himself','herself',
    'itself','myself','yourself','ourselves','nobody','nothing','anything',
    'everything','everyone','someone','anyone','somehow','somewhat','somewhere',
    'anywhere','everywhere','meanwhile','nevertheless','otherwise','furthermore',
    'moreover','nonetheless','whereas','despite','during','among','across','along',
    'above','below','behind','beside','within','without','before','after','around',
    'near','off','away','ago','upon','toward','towards','beyond','per','via',
    # Extended
    'today','tomorrow','yesterday','tonight','together','far','less','yes','well',
    'why','else','instead','overall','regardless','afterward','afterwards',
    'nowhere','something','inside','outside','except','half','double','zero',
    # Pronouns/determiners that get Spanish -o/-a endings
    'I','another','many','even','only',
}

VERBS = {
    'be','have','do','go','get','make','take','come','see','know','think','say',
    'give','find','tell','ask','work','seem','feel','try','leave','call','need',
    'become','keep','let','begin','show','hear','play','run','move','live','believe',
    'bring','happen','write','provide','sit','stand','lose','pay','meet','include',
    'continue','set','learn','change','lead','understand','watch','follow','stop',
    'create','speak','read','allow','add','spend','grow','open','close','walk',
    'win','offer','remember','love','consider','appear','buy','wait','serve','die',
    'send','expect','build','stay','fall','cut','reach','kill','remain','suggest',
    'raise','pass','sell','require','report','decide','pull','develop','eat','drink',
    'sleep','sing','fight','hold','carry','drive','break','produce','agree',
    'complete','pick','suppose','share','support','wish','accept','receive','hope',
    'prove','join','cause','form','turn','help','start','put','look','use',
    'want','mean','hold','could','should','would','might','must','may','shall',
}

ADJECTIVES = {
    'good','new','first','last','long','great','little','own','old','right','big',
    'high','different','small','large','next','early','young','important','few',
    'public','bad','same','able','free','sure','real','full','special','easy',
    'clear','recent','certain','personal','strong','possible','whole','deep',
    'dark','hard','simple','past','political','natural','happy','serious','ready',
    'human','social','local','single','short','white','black','red','blue','green',
    'cold','hot','wide','low','late','general','common','poor','open','close',
    'similar','final','main','private','major','true','false','modern','popular',
    'military','foreign','legal','medical','economic','financial','cultural',
    'beautiful','dangerous','safe','clean','dirty','dry','wet','rich','poor',
    'thick','thin','soft','loud','quiet','quick','slow','fast','strange','usual','wrong','left',
    'empty','obvious','necessary','likely','impossible','available','basic',
    # Extended from coherence analysis
    'nice','pleasant','several','brave','bright','crucial','cruel','digital',
    'dominant','double','efficient','elegant','enormous','essential','evident',
    'federal','fierce','flexible','formal','fragile','frequent','fundamental',
    'global','gradual','guilty','hostile','huge','humble','illegal','immune',
    'impressive','incredible','independent','inevitable','informal','innocent',
    'integral','intelligent','invisible','liberal','literal','marginal','mental',
    'miserable','moral','neutral','noble','nominal','normal','original','partial',
    'patient','permanent','persistent','pivotal','plausible','pleasant','potent',
    'potential','predominant','present','prevalent','prominent','proportional',
    'prudent','radical','rational','reasonable','redundant','relevant','reliable',
    'remarkable','residential','resilient','royal','rural','sensitive','slight',
    'solemn','spiritual','stable','steady','sterile','strange','strident','strong',
    'subsequent','substantial','subtle','sufficient','superficial','temporary',
    'tenacious','tentative','terminal','terrible','tolerable','total','trivial',
    'tropical','unanimous','universal','unprecedented','unpredictable','urgent',
    'variable','venerable','versatile','vertical','viable','vigilant','virtual',
    'visceral','visible','visual','vital','volatile','vulnerable',
    # Participles/compound adjectives
    'aberrant','accessible','adamant','ardent','audacious','blatant','callous',
    'cogent','cognizant','commensurate','compelling','complacient','compatible',
    'conceivable','concomitant','congenial','considerable','consistent',
    'constitutional','contingent','conventional','convivial','cordial','craven',
    'credible','culpable','daunting','decadent','defiant','deft','dependent',
    'destitute','detrimental','dire','divergent','docile','doleful','dormant',
    'ebullient','effervescent','egregious','eligible','eloquent','eminent',
    'emotional','environmental','equivalent','expedient','extravagant','fallible',
    'fascinating','favorable','feasible','feckless','feeble','fervent','flamboyant',
    'flagrant','formidable','fractious','frugal','futile','garrulous','germane',
    'glib','gloomy','heinous','hideous','ignorant','impartial','impeccable',
    'impertinent','impervious','implacable','impregnable','inaccessible','inane',
    'incandescent','incidental','incipient','inclement','incompatible',
    'incontrovertible','incorrigible','indispensable','indolent','ineffable',
    'inert','inexorable','infallible','infamous','inherent','inimical',
    'inscrutable','insolvent','insurmountable','intangible','intellectual',
    'intransigent','invaluable','inviolable','irascible','irrational','irrelevant',
    'irresistible','irreverent','irreversible','itinerant','jocund','latent',
    'lenient','lethal','liable','loquacious','malleable','maudlin','mediocre',
    'menial','mercurial','munificent','nascent','negligible','omnipotent',
    'omniscient','operational','ornamental','palatable','palpable','paramount',
    'parochial','pedantic','penitent','perfunctory','perspicacious','pertinent',
    'precocious','primordial','proficient','prospective','rapacious','raucous',
    'reckless','recalcitrant','relentless','remiss','reprehensible','repugnant',
    'resurgent','reticent','sagacious','salutary','seminal','servile','squalid',
    'steadfast','sublime','subliminal','susceptible','tangible','tenuous',
    'tractable','unbiased','unconventional','undeniable','unfettered','ungainly',
    'unilateral','unparalleled','untenable','unrelenting','vehement','venal',
    'verdant','vociferous','voracious',
    # Words that are adjective in this vocab context
    'initial','inaugural','central','colonial','commercial','electoral',
    'continental',
}

ADVERBS = {
    'not','also','very','often','however','too','usually','really','already',
    'always','sometimes','still','never','quickly','slowly','probably','actually',
    'certainly','clearly','finally','suddenly','simply','especially','generally',
    'recently','particularly','merely','thus','indeed','apparently','literally',
    'exactly','directly','entirely','obviously','eventually','slightly','gradually',
    'increasingly','relatively','absolutely','completely','perfectly','seriously',
    'nearly','almost','enough','hardly','mostly','merely','roughly','somewhat',
    # Extended
    'basically','briefly','constantly','currently','deliberately','desperately',
    'dramatically','effectively','efficiently','equally','essentially','evidently',
    'exclusively','explicitly','extremely','fairly','firmly','formerly','frankly',
    'freely','frequently','fully','fundamentally','greatly','heavily','highly',
    'honestly','hopefully','ideally','immediately','importantly','implicitly',
    'independently','inevitably','initially','instantly','largely','lately',
    'mainly','naturally','necessarily','normally','notably','occasionally',
    'officially','originally','partially','permanently','personally','physically',
    'potentially','practically','precisely','presumably','previously','primarily',
    'privately','professionally','purely','rapidly','rarely','remarkably',
    'repeatedly','respectively','severely','sharply','significantly','similarly',
    'simultaneously','sincerely','solely','specifically','steadily','strictly',
    'strongly','subsequently','substantially','successfully','supposedly','surely',
    'temporarily','thoroughly','tightly','totally','traditionally','tremendously',
    'truly','typically','ultimately','unfortunately','universally','utterly',
    'vastly','violently','virtually','widely',
}

NUMBERS = {
    'one','two','three','four','five','six','seven','eight','nine','ten',
    'hundred','thousand','million','billion','first','second','third',
    'half','double','zero',
}

NON_NOUNS = FUNCTION_WORDS | VERBS | ADJECTIVES | ADVERBS | NUMBERS

# ── Spanish gender exceptions ──

# Masculine words ending in -a (Greek origin, etc.)
MASCULINE_A = {
    'problema','sistema','tema','programa','drama','clima','idioma','mapa',
    'planeta','poema','esquema','fantasma','panorama','dilema','dogma',
    'enigma','diploma','aroma','trauma','carisma','magma','plasma','prisma',
    'síntoma','lema','axioma','paradigma','sofá','papá','día','tranvía',
    'mediodía','yoga',
}

# Feminine words ending in -o
FEMININE_O = {
    'mano','radio','foto','moto',
}

# Feminine words ending in consonant (not covered by rules)
FEMININE_CONSONANT = {
    'ciudad','verdad','realidad','sociedad','universidad','comunidad','actividad',
    'capacidad','oportunidad','seguridad','calidad','autoridad','cantidad',
    'propiedad','libertad','responsabilidad','necesidad','identidad','publicidad',
    'voluntad','humanidad','mitad','dificultad','curiosidad','oscuridad','lealtad',
    'nación','acción','situación','relación','información','educación','dirección',
    'posición','condición','atención','población','producción','elección','opinión',
    'conversación','operación','decisión','religión','tradición','organización',
    'comunicación','investigación','imaginación','protección','celebración',
    'estación','generación','expresión','intención','conexión','explicación',
    'solución','revolución','construcción','destrucción','contribución',
    'región','pasión','sesión','presión','televisión','visión','misión',
    'dimensión','pensión','ilusión','confusión','profesión','impresión',
    'mujer','flor','luz','cruz','paz','voz','vez','piel','miel','sal','señal',
    'capital','cárcel','imagen','orden','clase','base','parte','mente','muerte',
    'noche','sangre','calle','llave','nube','leche','carne','fiebre','hambre',
    'costumbre','cumbre','torre','fe','ley','red','pared','sed','juventud',
    'salud','virtud','actitud','multitud','gratitud','solicitud','inquietud',
    'esclavitud','aptitud','magnitud',
    'madre','nieve','suerte','fuente','gente','mente','frente','serpiente',
    'corriente','simiente',
    # From vocabulary review
    'nariz','raíz','validez','escasez','catástrofe','debacle',
    'masacre','higiene','hipótesis','antítesis','sinopsis',
    'síntesis','tesis','sede','serie','especie',
    'credenciales','ganancias','vacaciones','tijeras','matemáticas',
}

# Masculine words with non-standard endings
MASCULINE_SPECIAL = {
    'hombre','nombre','padre','tigre','aire','arte','viaje','paisaje',
    'lenguaje','mensaje','equipaje','personaje','porcentaje','aterrizaje',
    'color','amor','dolor','valor','favor','error','terror','horror','honor',
    'humor','calor','olor','motor','sector','factor','interior','exterior',
    'autor','director','doctor','profesor','actor','emperador','lector',
    'traductor','conductor','constructor',
}


def is_spanish_verb(es: str) -> bool:
    """Detect Spanish verbs by infinitive endings and reflexive forms."""
    es = es.lower()
    # Reflexive: sentarse, quedarse, etc.
    if es.endswith('se'):
        stem = es[:-2]
        if stem.endswith(('ar', 'er', 'ir')):
            return True
    # Standard infinitives
    if es.endswith(('ar', 'er', 'ir')) and len(es) > 3:
        return True
    return False


def is_spanish_adjective(en: str, es: str) -> bool:
    """Detect likely Spanish adjectives — uses English word as primary signal."""
    # Only flag as adjective if the English word is in our adjective list
    # Spanish endings are too ambiguous (vida/comida/lado all match adj patterns)
    return en.lower() in ADJECTIVES


# ── Consonant-ending masculine nouns (common ones) ──

MASCULINE_CONSONANT = {
    'lugar', 'hogar', 'país', 'fin', 'sol', 'pan', 'mar', 'rey', 'pez',
    'mes', 'tren', 'bar', 'sur', 'plan', 'dios', 'club', 'bus',
    'árbol', 'ángel', 'túnel', 'papel', 'hotel', 'nivel', 'jardín',
    'volcán', 'huracán', 'cojín', 'calcetín', 'violín', 'delfín',
    'coche', 'bosque', 'parque', 'café', 'bebé', 'pie',
    'hambre', 'hombre', 'nombre', 'timbre', 'alambre',
    'tigre', 'aire', 'viaje', 'paisaje', 'lenguaje', 'mensaje',
    'equipaje', 'personaje', 'porcentaje', 'aterrizaje', 'traje',
    'color', 'amor', 'dolor', 'valor', 'favor', 'error', 'terror',
    'horror', 'honor', 'humor', 'calor', 'olor', 'motor', 'sector',
    'factor', 'interior', 'exterior', 'autor', 'director', 'doctor',
    'profesor', 'actor', 'emperador', 'lector', 'traductor', 'conductor',
    'constructor', 'temor', 'rencor', 'sudor', 'esplendor', 'vigor',
    'poder', 'placer', 'deber', 'ser', 'saber', 'haber', 'carácter',
    'líder', 'cáncer', 'taller', 'póster',
    # From vocabulary review
    'azúcar', 'príncipe', 'interés', 'control', 'ambiente', 'material',
    'estándar', 'análisis', 'enfoque', 'animal', 'deporte', 'detalle',
    'accidente', 'incidente', 'componente', 'presidente', 'restaurante',
    'elefante', 'horizonte', 'chocolate', 'desfile', 'pastel', 'balde',
    'calibre', 'gabinete', 'perfil', 'índice', 'examen', 'crimen',
    'margen', 'origen', 'espécimen', 'referéndum', 'espíritu', 'ímpetu',
    'déficit', 'hábitat', 'boicot', 'tabú', 'pedigrí', 'cénit',
    'umbral', 'ritual', 'rival', 'tribunal', 'hospital', 'folclore', 'paraguas',
    'autobús', 'pantalones', 'cumpleaños', 'par', 'té',
    'síndrome', 'puente', 'diente', 'aceite', 'borde', 'toque',
    'alcance', 'desgaste', 'ajuste', 'desdén', 'rehén', 'capitán',
    'charlatán', 'millón', 'reloj', 'arroz', 'matiz', 'glamur',
    'embalse', 'satélite', 'epítome',
}


def assign_gender(en_word: str, es_word: str) -> str | None:
    """Return 'm', 'f', or None for a vocabulary entry."""
    en = en_word.lower()
    es = es_word.lower()

    # Skip non-nouns by English word
    if en in NON_NOUNS:
        return None

    # Check exception lists BEFORE verb/adjective detection
    # (lugar, hogar, mujer etc. end in -ar/-er but are nouns)
    if es in MASCULINE_A or es in MASCULINE_SPECIAL or es in MASCULINE_CONSONANT:
        return 'm'
    if es in FEMININE_O or es in FEMININE_CONSONANT:
        return 'f'

    # Skip Spanish verbs (after exception check)
    if is_spanish_verb(es):
        return None

    # Skip likely adjectives
    if is_spanish_adjective(en, es):
        return None

    # ── Spanish gender rules for remaining words ──

    # -o → masculine
    if es.endswith('o'):
        return 'm'
    # -a → feminine (but not verb infinitives, already filtered)
    if es.endswith('a'):
        return 'f'
    # -ción, -sión → feminine
    if es.endswith(('ción', 'sión')):
        return 'f'
    # -dad, -tad, -tud → feminine
    if es.endswith(('dad', 'tad', 'tud')):
        return 'f'
    # -aje → masculine
    if es.endswith('aje'):
        return 'm'
    # -or → masculine
    if es.endswith('or'):
        return 'm'
    # -ón → masculine (but not -ción/-sión, already handled)
    if es.endswith('ón'):
        return 'm'
    # -ismo → masculine
    if es.endswith('ismo'):
        return 'm'
    # -umbre → feminine (costumbre, cumbre, muchedumbre)
    if es.endswith('umbre'):
        return 'f'
    # -ie → feminine (serie, especie, superficie)
    if es.endswith('ie'):
        return 'f'

    # Ambiguous — return None (won't be treated as noun for compound replacement)
    return None


def main():
    with open('sideload/data/vocabulary.json') as f:
        vocab = json.load(f)

    stats = {'m': 0, 'f': 0, 'null': 0, 'ambiguous_nouns': []}

    for entry in vocab:
        gender = assign_gender(entry['en'], entry['es'])
        entry['gender'] = gender

        if gender == 'm':
            stats['m'] += 1
        elif gender == 'f':
            stats['f'] += 1
        elif entry['en'].lower() not in NON_NOUNS:
            # Potential noun without assigned gender
            stats['ambiguous_nouns'].append(f"{entry['en']:20} -> {entry['es']}")
        else:
            stats['null'] += 1

    # Write updated vocabulary
    with open('sideload/data/vocabulary.json', 'w') as f:
        json.dump(vocab, f, indent=2, ensure_ascii=False)

    print(f"Assigned: {stats['m']} masculine, {stats['f']} feminine, {stats['null']} non-nouns")
    print(f"Ambiguous (potential nouns without gender): {len(stats['ambiguous_nouns'])}")
    if stats['ambiguous_nouns'][:20]:
        print("\nFirst 20 ambiguous:")
        for a in stats['ambiguous_nouns'][:20]:
            print(f"  {a}")


if __name__ == '__main__':
    main()
