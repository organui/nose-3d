export type SourceFile = 'SkeletalSystem100' | 'VisceralSystem100' | 'NervousSystem100'
export type Group =
  | 'External nose'
  | 'Nasal septum'
  | 'Nasal cavity'
  | 'Paranasal sinuses'
  | 'Sinus bones'
  | 'Neighbours'

export type Structure = {
  id: string
  name: string
  group: Group
  // Z-Anatomy FBX file and object names this structure is built from. Each
  // source object belongs to exactly one structure. Empty for carved shapes.
  sources: { file: SourceFile; objects: string[] }[]
  // Illustrative air space carved from this structure's volume instead of a
  // source mesh (see scripts/sinuses.ts).
  carvedFrom?: string
  color: string
  description: string
  note: string
}

export const anatomySource = 'https://training.seer.cancer.gov/head-neck/anatomy/sinuses.html'
const skeletal = (...objects: string[]) => [{ file: 'SkeletalSystem100' as const, objects }]
const visceral = (...objects: string[]) => [{ file: 'VisceralSystem100' as const, objects }]

export const structures: Structure[] = [
  {
    id: 'nasal-bones',
    name: 'Nasal bones',
    group: 'External nose',
    sources: skeletal('Nasal_boner', 'Nasal_bonel'),
    color: '#f0d29c',
    description: 'Two small bones that meet in the midline and form the bony bridge of the nose.',
    note: 'Right and left bones are grouped as one selectable pair.',
  },
  {
    id: 'lateral-cartilages',
    name: 'Lateral nasal cartilages',
    group: 'External nose',
    sources: skeletal(
      'Lateral_process_of_nasal_septal_cartilager',
      'Lateral_process_of_nasal_septal_cartilagel',
    ),
    color: '#a9c7d4',
    description:
      'Triangular plates of cartilage below the nasal bones that shape the middle of the nose. They are wings of the septal cartilage.',
    note: 'Right and left are grouped. Skin, fat and the small accessory cartilages are not modelled.',
  },
  {
    id: 'alar-cartilages',
    name: 'Major alar cartilages',
    group: 'External nose',
    sources: skeletal('Major_alar_cartilager', 'Major_alar_cartilagel'),
    color: '#8fb3c7',
    description: 'Curved cartilages that form the tip of the nose and hold the nostrils open.',
    note: 'Right and left are grouped. The nostrils themselves are soft tissue and are not modelled.',
  },
  {
    id: 'septal-cartilage',
    name: 'Septal cartilage',
    group: 'Nasal septum',
    sources: skeletal('Nasal_septal_cartilage'),
    color: '#7fa6bd',
    description:
      'The front of the wall between the two nasal passages. It joins the nasal bones above and the vomer and ethmoid behind.',
    note: 'It sits between the lateral cartilages. Select it or hide them to see it.',
  },
  {
    id: 'vomer',
    name: 'Vomer',
    group: 'Nasal septum',
    sources: skeletal('Vomer'),
    color: '#cdb48d',
    description:
      'A flat bone that forms the lower back part of the septum, reaching back to the openings into the throat.',
    note: 'The upper back part of the septum, the perpendicular plate, is part of the ethmoid bone here.',
  },
  {
    id: 'nasal-cavity',
    name: 'Nasal cavity lining',
    group: 'Nasal cavity',
    sources: visceral('Mucosa_of_nasal_cavity'),
    color: '#d98a8a',
    description:
      'The mucous membrane that lines both nasal passages. It warms, moistens and filters the air, and its outline shows the extent of the nasal passages.',
    note: 'Shown as one surface for both sides. Select it to see it through the bones.',
  },
  {
    id: 'inferior-conchae',
    name: 'Inferior nasal conchae',
    group: 'Nasal cavity',
    sources: skeletal('Inferior_nasal_concha_boner', 'Inferior_nasal_concha_bonel'),
    color: '#c99b7a',
    description:
      'Scroll-shaped bones on the side walls of the nasal cavity. With their lining they slow the air so it can be warmed and moistened.',
    note: 'The middle and superior conchae belong to the ethmoid bone and are part of that mesh.',
  },
  {
    id: 'palatine-bones',
    name: 'Palatine bones',
    group: 'Nasal cavity',
    sources: skeletal('Palatine_boner', 'Palatine_bonel'),
    color: '#bfa98a',
    description:
      'L-shaped bones at the back of the nasal cavity. They form the back of the hard palate, which is the floor of the nose.',
    note: 'Right and left bones are grouped.',
  },
  {
    id: 'lacrimal-bones',
    name: 'Lacrimal bones',
    group: 'Nasal cavity',
    sources: skeletal('Lacrimal_boner', 'Lacrimal_bonel'),
    color: '#d8bf99',
    description:
      'Small, thin bones in the inner wall of each orbit. The tear duct runs past them into the nose.',
    note: 'Right and left bones are grouped. The tear ducts are not included.',
  },
  {
    id: 'olfactory-nerves',
    name: 'Olfactory nerves',
    group: 'Nasal cavity',
    sources: [
      { file: 'NervousSystem100', objects: ['Olfactory_nerve_(I)r', 'Olfactory_nerve_(I)l'] },
    ],
    color: '#e3c25a',
    description:
      'Carry smell from the roof of the nasal cavity, through the ethmoid bone, to the olfactory bulbs and tracts under the brain.',
    note: 'Each side is one mesh that includes the bulb and tract. The smell-sensing lining is not separate.',
  },
  {
    id: 'frontal-sinuses',
    name: 'Frontal sinuses',
    group: 'Paranasal sinuses',
    sources: skeletal('Sinus_of_frontal_bone'),
    color: '#5fb3c9',
    description:
      'Air spaces in the forehead, above the root of the nose, split by a septum. They drain down into the nose under the middle concha.',
    note: 'Real frontal sinuses vary greatly and are often unequal.',
  },
  {
    id: 'anterior-ethmoid-cells',
    name: 'Anterior ethmoid cells',
    group: 'Paranasal sinuses',
    sources: skeletal('Anterior_cells_of_ethmoid_boner', 'Anterior_cells_of_ethmoid_bonel'),
    color: '#6cc0d0',
    description:
      'The front group of small air cells between the nose and the orbits. They drain under the middle concha.',
    note: 'Right and left are grouped.',
  },
  {
    id: 'middle-ethmoid-cells',
    name: 'Middle ethmoid cells',
    group: 'Paranasal sinuses',
    sources: skeletal('Middle_cells_of_ethmoid_boner', 'Middle_cells_of_ethmoid_bonel'),
    color: '#4fa3b8',
    description:
      'The middle group of ethmoid air cells. They open onto the side wall of the nose under the middle concha.',
    note: 'Right and left are grouped.',
  },
  {
    id: 'posterior-ethmoid-cells',
    name: 'Posterior ethmoid cells',
    group: 'Paranasal sinuses',
    sources: skeletal('Posterior_cells_of_ethmoid_boner', 'Posterior_cells_of_ethmoid_bonel'),
    color: '#3d8ea5',
    description:
      'The back group of ethmoid air cells, next to the sphenoid sinus. They drain under the superior concha.',
    note: 'Right and left are grouped.',
  },
  {
    id: 'maxillary-sinuses',
    name: 'Maxillary sinuses',
    group: 'Paranasal sinuses',
    sources: [],
    carvedFrom: 'maxillae',
    color: '#72c0cf',
    description:
      'The largest sinuses, in the cheekbones beside the nose and under the eyes. Their opening is high on the inner wall, under the middle concha.',
    note: 'Illustrative. Z-Anatomy has no maxillary sinus mesh and models the maxilla as solid, so this shape was carved from inside it by OrganUI.',
  },
  {
    id: 'sphenoid-sinus',
    name: 'Sphenoid sinus',
    group: 'Paranasal sinuses',
    sources: skeletal('Sinus_of_sphenoid_bone'),
    color: '#2f7f99',
    description:
      'Air spaces deep in the skull behind the nose, just under the pituitary gland, divided by a septum.',
    note: 'The source mesh is simple and low in detail.',
  },
  {
    id: 'frontal-bone',
    name: 'Frontal bone',
    group: 'Sinus bones',
    sources: skeletal('Frontal_bone'),
    color: '#ece4d2',
    description:
      'The bone of the forehead and the roofs of the orbits. It holds the frontal sinuses.',
    note: 'Cut about 5 cm above the root of the nose so the nose fills the view. The rest of the skull is omitted.',
  },
  {
    id: 'ethmoid',
    name: 'Ethmoid bone',
    group: 'Sinus bones',
    sources: skeletal('Ethmoid_bone'),
    color: '#d9bd8c',
    description:
      'A light bone between the orbits. It forms the roof and upper side walls of the nasal cavity, the middle and superior conchae, the back of the septum, and holds the ethmoid cells.',
    note: 'Copies of the ethmoid cells inside the source mesh are left out; the cells are their own structures.',
  },
  {
    id: 'maxillae',
    name: 'Maxillae',
    group: 'Sinus bones',
    sources: skeletal('Maxillar', 'Maxillal'),
    color: '#e6d3b0',
    description:
      'The upper jaw bones. They form the cheeks, the side walls and most of the floor of the nasal cavity, and hold the maxillary sinuses.',
    note: 'Right and left bones are grouped. Teeth are not included.',
  },
  {
    id: 'sphenoid-bone',
    name: 'Sphenoid bone',
    group: 'Sinus bones',
    sources: skeletal('Sphenoid_bone'),
    color: '#c8b089',
    description:
      'A bone at the centre of the skull base, behind the nasal cavity. Its body holds the sphenoid sinus.',
    note: 'Shown whole, including its wings, which reach out to the sides of the skull.',
  },
  {
    id: 'pituitary',
    name: 'Pituitary gland',
    group: 'Neighbours',
    sources: visceral('Adenohypophysis', 'Neurohypophysis'),
    color: '#b27fb0',
    description:
      'A hormone gland that sits in a hollow on top of the sphenoid bone, directly above the sphenoid sinus.',
    note: 'Its front and back lobes are grouped. Surgeons often reach it through the nose and the sphenoid sinus.',
  },
  {
    id: 'nasopharynx',
    name: 'Nasopharynx',
    group: 'Neighbours',
    sources: visceral('Nasopharynx'),
    color: '#d7a0a0',
    description:
      'The top of the throat, behind the nasal cavity. Air passes into it through the two openings at the back of the nose.',
    note: 'Included to show where the nasal passages lead.',
  },
]
export const groups = [
  'External nose',
  'Nasal septum',
  'Nasal cavity',
  'Paranasal sinuses',
  'Sinus bones',
  'Neighbours',
] as const satisfies readonly Group[]
export const byId = Object.fromEntries(structures.map((s) => [s.id, s]))
export const sourceObjects = (s: Structure) =>
  s.sources.flatMap(({ file, objects }) => objects.map((o) => `${file}/${o}`))
export type View = 'Anterior' | 'Oblique' | 'Left lateral'
// The nose's depth only reads from an angle, so the explorer opens obliquely.
export const defaultView: View = 'Oblique'
export const tour: { id: string; title: string; text: string; view: View; isolate?: boolean }[] = [
  {
    id: 'nasal-bones',
    title: 'Bone above, cartilage below',
    text: 'Only the top of the nose is bone. The two nasal bones form the bridge, and cartilage shapes everything below them.',
    view: 'Oblique',
  },
  {
    id: 'septal-cartilage',
    title: 'The wall down the middle',
    text: 'The septum divides the nose into two passages. Cartilage forms its front; the vomer and the ethmoid bone form the back.',
    view: 'Left lateral',
  },
  {
    id: 'nasal-cavity',
    title: 'The airway',
    text: 'The lining of the nasal cavity is isolated here. It shows how far the nasal passages reach, from just inside the nostrils back to the throat. Restore all to see the bones around it.',
    view: 'Left lateral',
    isolate: true,
  },
  {
    id: 'frontal-sinuses',
    title: 'Air inside the bones',
    text: 'Four groups of sinuses surround the nose. The frontal sinuses sit in the forehead, the ethmoid cells between the eyes, and the maxillary sinuses in the cheeks.',
    view: 'Anterior',
  },
  {
    id: 'sphenoid-sinus',
    title: 'Deep behind the nose',
    text: 'The sphenoid sinus lies at the centre of the skull, right behind the nasal cavity and just under the pituitary gland.',
    view: 'Left lateral',
  },
]

export type Emphasis = 'normal' | 'selected' | 'ghosted'
// With nothing selected every structure keeps its own color. A selection
// keeps its structure solid and ghosts the rest so it stays visible even
// when it sits behind or inside other geometry (sinuses, septum, airway).
export function emphasis(id: string, selected: string | null): Emphasis {
  if (!selected) return 'normal'
  return id === selected ? 'selected' : 'ghosted'
}
