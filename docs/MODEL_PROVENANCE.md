# Model provenance and preparation

## Source and license

The runtime model uses meshes from **[Z-Anatomy](https://github.com/LluisV/Z-Anatomy)**, an open 3D anatomy atlas, retrieved **2026-10-16**. Z-Anatomy's models are licensed under **[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)** (see the [snapshot of its LICENSE file](model-source/z-anatomy-LICENSE.txt)). Z-Anatomy builds in part on **BodyParts3D / Anatomography, © The Database Center for Life Science (DBCLS)**, licensed under [CC BY-SA 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en) ([snapshot of that notice](model-source/original-license.html.txt)), whose share-alike terms allow adaptations under later versions of the licence such as 4.0. This is the same source and licence choice as [ear-3d](https://github.com/organui/ear-3d).

This licence governs `public/models/nose.glb` (including the illustrative maxillary sinus, which is derived from the source maxillae), the manifest's model data and the model screenshots, separately from the MIT application code.

Credit: **Z-Anatomy (Gauthier Kervyn, Lluís Vinent Juanico and contributors), based in part on BodyParts3D / Anatomography, © DBCLS.** Adapted by OrganUI. No endorsement is implied.

## Why not BodyParts3D directly

Most OrganUI explorers use BodyParts3D 4.3 from the [olivercase/body_parts_3d_api](https://github.com/olivercase/body_parts_3d_api) mirror. It has the nasal bones, cartilages and skull bones, but models the frontal, ethmoid, sphenoid and maxillary bones as solid volumes with no sinus meshes, and has no lining of the nasal cavity (checked by ray-parity tests at each sinus position). The 3.0 mirror (Kevin-Mattheus-Moerman/BodyParts3D) lacks the nasal cartilages too. Z-Anatomy adds frontal, ethmoid and sphenoid sinus meshes and the nasal mucosa, so this explorer uses it. A first draft built on BodyParts3D with all four sinuses carved was replaced before release.

## Retrieval and pinning

Geometry comes from the Z-Anatomy Unity project's FBX exports, pinned at commit `6c7f9016bd5899ac8edafd31b9900c151df42ed6` of `LluisV/Z-Anatomy`. Three files are used; each is checked by size and SHA-256 before parsing (values and Git blob IDs are in [model-inputs.json](../scripts/model-inputs.json)):

| File | Used for |
| --- | --- |
| `Resources/Models/FBX/SkeletalSystem100.fbx` | Bones, cartilages, frontal, ethmoid and sphenoid sinuses |
| `Resources/Models/FBX/VisceralSystem100.fbx` | Nasal mucosa, nasopharynx, pituitary gland |
| `Resources/Models/FBX/NervousSystem100.fbx` | Olfactory nerves |

`prepare-model.ts` looks up each source object by its exact Z-Anatomy name and refuses to run if a name matches zero or several meshes, or if an object is assigned to two structures.

## Selected structures

| Structure | Z-Anatomy objects |
| --- | --- |
| Nasal bones | `Nasal_boner`, `Nasal_bonel` |
| Lateral nasal cartilages | `Lateral_process_of_nasal_septal_cartilager`, `Lateral_process_of_nasal_septal_cartilagel` |
| Major alar cartilages | `Major_alar_cartilager`, `Major_alar_cartilagel` |
| Septal cartilage | `Nasal_septal_cartilage` |
| Vomer | `Vomer` |
| Nasal cavity lining | `Mucosa_of_nasal_cavity` |
| Inferior nasal conchae | `Inferior_nasal_concha_boner`, `Inferior_nasal_concha_bonel` |
| Palatine bones | `Palatine_boner`, `Palatine_bonel` |
| Lacrimal bones | `Lacrimal_boner`, `Lacrimal_bonel` |
| Olfactory nerves | `Olfactory_nerve_(I)r`, `Olfactory_nerve_(I)l` |
| Frontal sinuses | `Sinus_of_frontal_bone` |
| Anterior ethmoid cells | `Anterior_cells_of_ethmoid_boner`, `Anterior_cells_of_ethmoid_bonel` |
| Middle ethmoid cells | `Middle_cells_of_ethmoid_boner`, `Middle_cells_of_ethmoid_bonel` |
| Posterior ethmoid cells | `Posterior_cells_of_ethmoid_boner`, `Posterior_cells_of_ethmoid_bonel` |
| Maxillary sinuses | none: illustrative, carved from the maxillae (below) |
| Sphenoid sinus | `Sinus_of_sphenoid_bone` |
| Frontal bone | `Frontal_bone` (cut, below) |
| Ethmoid bone | `Ethmoid_bone` (largest connected piece only, below) |
| Maxillae | `Maxillar`, `Maxillal` |
| Sphenoid bone | `Sphenoid_bone` |
| Pituitary gland | `Adenohypophysis`, `Neurohypophysis` |
| Nasopharynx | `Nasopharynx` |

33 source objects, 112,774 source triangles. Per-object vertex and triangle counts are in the [manifest](../public/models/manifest.json).

Decisions and gaps:

- **Ethmoid cell copies.** `Ethmoid_bone` contains 13 connected pieces: the bone itself and twelve copies of the ethmoid cell meshes, which would overlap the cell structures. Only the largest piece (5,042 triangles) is kept.
- **Frontal bone cut.** The frontal bone is clipped with a horizontal plane at source y = 166 cm, just above the frontal sinuses and about 5 cm above the nasion, and only the part below is drawn so the nose fills the view. Triangles crossing the plane are split so the edge is straight.
- **Pairs are grouped.** Left and right bones, cartilages, cells and nerves are one selectable structure each.
- **Septum.** The perpendicular plate of the ethmoid is part of the `Ethmoid_bone` mesh, so it is not selectable on its own.
- **Olfactory nerves.** Each source mesh includes the bulb and the tract and is dense (26,956 triangles per side); it is used as is.
- **Sphenoid sinus.** The source mesh is low in detail (384 triangles).
- Omitted: skin and soft tissue of the external nose, the minor alar and accessory cartilages, nasal muscles, vessels, teeth, the zygomatic bones and the rest of the skull, and the label-pin helper meshes in the FBX files.

## Illustrative maxillary sinus

Z-Anatomy has no maxillary sinus mesh, and its maxilla is a solid volume around the sinus position (checked by voxelising it). So that the largest sinus can still be found and selected, `scripts/sinuses.ts` carves an **illustrative** shape from the maxillae's own volume:

1. Voxelise the maxillae at 0.6 mm (a majority vote of ray parity along x, y and z).
2. Erode by 1.5 mm so a bony wall remains.
3. Keep voxels in the body of each maxilla: lateral to the nasal cavity, above the tooth roots and below the orbit (an ellipsoid per side), and drop specks.
4. Extract a surface (surface nets) and smooth it (Taubin, 12 passes).

The result (9.9 mL for both sides; volume and triangle count in the manifest under `illustrative`) always sits inside the maxilla. It is an approximation for orientation, not measured or segmented anatomy, and it is smaller than a typical adult maxillary sinus because the source maxilla's body is narrow. The app labels it **Illustrative** and says so in its notes.

## Transformation and orientation

Source units are centimetres with Y up, +Z anterior and the patient's left at +X, which already match the display axes. Vertices are recentred on the drawn geometry's bounding box and uniformly scaled by `0.25`. The anterior view looks along −Z, the lateral view looks at the patient's left side from +X, and the oblique view sits between them, slightly above. The explorer opens in the oblique view because the nose's depth does not read from the front. No anatomical reshaping or decimation is performed on the source meshes.

## Reproduce

```sh
bun run prepare:model   # downloads missing FBX files into .asset-cache/fbx, verifies, carves the maxillary sinus, writes the GLB and manifest
bun run verify:model    # checks the GLB hash, structure IDs, source objects and geometry
```
