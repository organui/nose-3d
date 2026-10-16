# Anatomy model attribution

Z-Anatomy (Gauthier Kervyn, Lluís Vinent Juanico and contributors), https://github.com/LluisV/Z-Anatomy, based in part on BodyParts3D / Anatomography, © The Database Center for Life Science (DBCLS), https://lifesciencedb.jp/bp3d/.

- Model/data license: [Creative Commons Attribution-ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Z-Anatomy's BodyParts3D-derived content was originally licensed under [CC BY-SA 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en).
- Source files: `SkeletalSystem100.fbx`, `VisceralSystem100.fbx` and `NervousSystem100.fbx` from commit `6c7f9016bd5899ac8edafd31b9900c151df42ed6`, each checked by size and SHA-256.
- Retrieved: 2026-10-16.
- Full hashes and source-to-runtime mapping: [manifest.json](manifest.json).
- BodyParts3D original work: Mitsuhashi et al., “BodyParts3D: 3D structure database for anatomical concepts”, Nucleic Acids Research 37 (2009), D782–D785. [DOI](https://doi.org/10.1093/nar/gkn613).

Changes by OrganUI (2026): selected 33 source objects and grouped them into 21 structures, kept only the largest connected piece of the ethmoid bone, cut the frontal bone with a horizontal plane about 5 cm above the nasion, recentred and uniformly scaled coordinates, welded vertices and recomputed smooth normals, assigned illustrative colors, and converted FBX to GLB. No decimation.

Added by OrganUI: an **illustrative** maxillary sinus shape, carved from the maxillae's volume by `scripts/sinuses.ts`, because the source has none. It is an approximation for orientation, not a Z-Anatomy structure, and as a derivative of the maxillae it is distributed under the same license.

`public/models/nose.glb` and screenshots of it are adaptations distributed under CC BY-SA 4.0. The MIT license for original application code does not relicense them. Preserve this attribution, the license link, and the modification notice when redistributing. Neither Z-Anatomy nor DBCLS endorses this demonstration.
