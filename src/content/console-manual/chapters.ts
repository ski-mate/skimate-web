/**
 * GENERATED FILE — do not edit.
 *
 * Source: docs/CONSOLE-ANALYST-MANUAL.md (mirrored from alpline-admin).
 * Regenerate: node scripts/build-console-manual.mjs
 *
 * 13 chapters, 41 runbook steps.
 */

import type { ManualChapter } from "./types";

export const manualChapters: ManualChapter[] = [
  {
    "number": 0,
    "slug": "chapter-0-the-job-in-one-page",
    "title": "The job, in one page",
    "heading": "Chapter 0 — The job, in one page",
    "blocks": [
      {
        "kind": "p",
        "text": [
          "Alpline's atlas is ~200 ski resorts. Your job is to take each one from \"a name in a registry\" to \"published, measured, trustworthy data\" using the console at ",
          {
            "text": "getalpline.com/console",
            "code": true,
            "strong": true
          },
          " (dev: ",
          {
            "text": "localhost:3001/console",
            "code": true
          },
          ")."
        ]
      },
      {
        "kind": "p",
        "text": [
          "The one idea that explains every screen: ",
          {
            "text": "the pipeline generates, you review.",
            "strong": true
          },
          " Slopes — the benchmark we measure against — employs GIS analysts who hand-trace runs, lifts and buildings in ArcGIS over satellite imagery. We inverted that: an automated pipeline extracts everything from OpenStreetMap, Overture, and operator feeds, and your screen time goes to ",
          {
            "text": "queues of exceptions",
            "strong": true
          },
          " — conflicts, orphans, gate failures, gaps. You will never trace a geometry. You resolve, merge, reassign, verdict, waive-with-reason, and approve. One analyst with good queues covers what takes them a team."
        ]
      },
      {
        "kind": "p",
        "text": [
          "Three rules carry across every screen:"
        ]
      },
      {
        "kind": "steps",
        "items": [
          {
            "text": [
              {
                "text": "Nothing destructive happens without an audit row.",
                "strong": true
              },
              " Every merge, verdict, waiver, approval and publish records who, when, and why. The audit trail is your professional record — write reasons you'd be happy to re-read in six months."
            ]
          },
          {
            "text": [
              {
                "text": "A blocked stage is blocked for a reason.",
                "strong": true
              },
              " Gates and checks are enforced server-side; the console refusing is a courtesy copy of the API refusing. Waiving is always available and always logged — waive when you have ",
              {
                "text": "judged",
                "em": true
              },
              " the failure, never to make a number go away."
            ]
          },
          {
            "text": [
              {
                "text": "Money never moves without your explicit click.",
                "strong": true
              },
              " The only paid provider is Foursquare, and it runs solely behind the approval screen (Chapter 6)."
            ]
          }
        ]
      },
      {
        "kind": "heading",
        "text": "The stage pipeline",
        "id": "the-stage-pipeline"
      },
      {
        "kind": "p",
        "text": [
          "Every resort walks the same line, and the console's screens are its stations:"
        ]
      },
      {
        "kind": "code",
        "text": "identity → harvest → membership → enrichment → QA → publish\n                          └── routing coverage (parallel with enrichment)"
      },
      {
        "kind": "table",
        "head": [
          [
            "Stage"
          ],
          [
            "Screen"
          ],
          [
            "You are judging"
          ]
        ],
        "rows": [
          [
            [
              "Identity"
            ],
            [
              "Onboarding wizard"
            ],
            [
              "\"Which real-world resort is this, exactly?\""
            ]
          ],
          [
            [
              "Harvest"
            ],
            [
              "Harvest review"
            ],
            [
              "\"Which of these candidate places are duplicates or junk?\""
            ]
          ],
          [
            [
              "Membership"
            ],
            [
              "Membership & gates"
            ],
            [
              "\"Which member resort does each place belong to?\""
            ]
          ],
          [
            [
              "Enrichment"
            ],
            [
              "Enrichment cost gate"
            ],
            [
              "\"Is this Foursquare spend worth it, and did it work?\""
            ]
          ],
          [
            [
              "Routing coverage"
            ],
            [
              "Coverage (screen 8)"
            ],
            [
              "\"Did we really capture every run and lift?\""
            ]
          ],
          [
            [
              "QA / publish"
            ],
            [
              "QA workspace"
            ],
            [
              "\"Would I stake the app's reputation on this data?\""
            ]
          ]
        ]
      }
    ]
  },
  {
    "number": 1,
    "slug": "chapter-1-vocabulary-you-must-know",
    "title": "Vocabulary you must know",
    "heading": "Chapter 1 — Vocabulary you must know",
    "blocks": [
      {
        "kind": "p",
        "text": [
          "Learn these ten terms before touching anything; every screen assumes them."
        ]
      },
      {
        "kind": "bullets",
        "items": [
          [
            {
              "text": "Registry entry",
              "strong": true
            },
            " — one row in the atlas: either a ",
            {
              "text": "group",
              "strong": true
            },
            " (Les 3 Vallées) or a ",
            {
              "text": "leaf resort",
              "strong": true
            },
            " (Courchevel). Groups have ",
            {
              "text": "members",
              "strong": true
            },
            "; a member can carry ",
            {
              "text": "excludeFromGroupNaming",
              "code": true
            },
            " when it keeps its own identity."
          ],
          [
            {
              "text": "Evidence refs",
              "strong": true
            },
            " — a registry entry's external anchors: Skimap id, Wikidata QID, and ",
            {
              "text": "OSM ids (plural!)",
              "strong": true
            },
            ". Two overlapping OSM polygons are ",
            {
              "text": "two evidence refs on one entry",
              "em": true
            },
            ", never two entries. This single idea kills the duplicate-resort disease (\"Les 3 Vallées\" vs \"Les Trois Vallées\")."
          ],
          [
            {
              "text": "Place",
              "strong": true
            },
            " — one harvested point of interest (restaurant, lift station, rental shop…). Group-wide entities: one place can belong to several members."
          ],
          [
            {
              "text": "Provenance",
              "strong": true
            },
            " — every place field remembers its source (",
            {
              "text": "osm",
              "code": true
            },
            ", ",
            {
              "text": "overture",
              "code": true
            },
            ", ",
            {
              "text": "wikidata",
              "code": true
            },
            ", ",
            {
              "text": "fsq",
              "code": true
            },
            ", ",
            {
              "text": "override",
              "code": true
            },
            "). Rendered as chips. When two sources disagree, provenance is how you decide who to believe."
          ],
          [
            {
              "text": "Membership basis",
              "strong": true
            },
            " — ",
            {
              "text": "why",
              "em": true
            },
            " a place belongs to a member: ",
            {
              "text": "network",
              "code": true
            },
            " (graph reachability), ",
            {
              "text": "settlement",
              "code": true
            },
            " (it sits in the member's village), or ",
            {
              "text": "manual",
              "code": true
            },
            " (you said so)."
          ],
          [
            {
              "text": "Run",
              "strong": true
            },
            " — one recorded pipeline execution, with stages, dataset release versions, costs, gate outcomes and approvals. Screen 7 is this table rendered. Dataset versions matter: Overture hosts only its last two monthly releases, so a run without a recorded release is unreproducible."
          ],
          [
            {
              "text": "Gate",
              "strong": true
            },
            " — a blocking validation with evidence attached. Gates ",
            {
              "text": "fail",
              "em": true
            },
            ", and a failing gate stops advancement until resolved or ",
            {
              "text": "waived with a reason",
              "strong": true
            },
            "."
          ],
          [
            {
              "text": "Verdict",
              "strong": true
            },
            " — your recorded decision on one queue item. Verdicts are idempotent (re-sending the same one changes nothing) and each writes an audit row."
          ],
          [
            {
              "text": "Waiver",
              "strong": true
            },
            " — \"I have seen this failure, judged it acceptable, and here is why.\" Mandatory reason, permanent record."
          ],
          [
            {
              "text": "The graph",
              "strong": true
            },
            " — the routable ski network (pistes, lifts, connector edges) extracted from OSM into the ",
            {
              "text": "ski_routing",
              "code": true
            },
            " schema. Coverage (Chapter 7) measures it; routing runs on it."
          ]
        ]
      }
    ]
  },
  {
    "number": 2,
    "slug": "chapter-2-access-and-orientation",
    "title": "Access and orientation",
    "heading": "Chapter 2 — Access and orientation",
    "blocks": [
      {
        "kind": "steps",
        "items": [
          {
            "text": [
              "You need your email on the console allow-list (ops sets ",
              {
                "text": "CONSOLE_ALLOWED_EMAILS",
                "code": true
              },
              "). Sign in at ",
              {
                "text": "/console",
                "code": true
              },
              " with that account. No allow-list entry → no access; there is no self-signup."
            ]
          },
          {
            "text": [
              "Everything you do is attributed to that email in the audit trail. Never share a session."
            ]
          },
          {
            "text": [
              {
                "text": "Learn the keyboard on day one.",
                "strong": true
              },
              " Press ",
              {
                "text": "?",
                "code": true,
                "strong": true
              },
              " on any screen for the shortcut overlay — it is the authoritative reference and shows exactly what is available where you are. The invariants:"
            ],
            "sub": [
              [
                {
                  "text": "j",
                  "code": true
                },
                " / ",
                {
                  "text": "k",
                  "code": true
                },
                " (or arrow keys) — next / previous item in any queue"
              ],
              [
                "number keys or mnemonic letters — verdicts (e.g. harvest: ",
                {
                  "text": "1",
                  "code": true
                },
                "/",
                {
                  "text": "l",
                  "code": true
                },
                " keep left, ",
                {
                  "text": "2",
                  "code": true
                },
                "/",
                {
                  "text": "r",
                  "code": true
                },
                " keep right, ",
                {
                  "text": "3",
                  "code": true
                },
                "/",
                {
                  "text": "m",
                  "code": true
                },
                " merge, ",
                {
                  "text": "4",
                  "code": true
                },
                "/",
                {
                  "text": "s",
                  "code": true
                },
                " skip)"
              ],
              [
                {
                  "text": "u",
                  "code": true
                },
                " — undo the last verdict (before it syncs)"
              ],
              [
                {
                  "text": "m",
                  "code": true
                },
                " — toggle the map panel; ",
                {
                  "text": "/",
                  "code": true
                },
                " — search; ",
                {
                  "text": "Esc",
                  "code": true
                },
                " — close"
              ]
            ]
          },
          {
            "text": [
              "Screens autosave verdicts in small batches. A pending-sync indicator means \"keep going, it will land\"; if it persists, see Troubleshooting."
            ]
          }
        ]
      },
      {
        "kind": "heading",
        "text": "An honest note about empty screens",
        "id": "an-honest-note-about-empty-screens"
      },
      {
        "kind": "p",
        "text": [
          "A stage screen that says \"no run yet\" is not broken: stage screens render the output of pipeline runs, and until engineering has executed a run for that entry there is nothing to review. Same for coverage's \"no routing graph yet\". Queueing a run from the console (worklist → trigger) files a ",
          {
            "text": "work order",
            "strong": true
          },
          "; the pipeline itself is executed by engineering, not by the browser."
        ]
      }
    ]
  },
  {
    "number": 3,
    "slug": "chapter-3-the-morning-routine-atlas-worklist",
    "title": "The morning routine (Atlas worklist)",
    "heading": "Chapter 3 — The morning routine (Atlas worklist)",
    "blocks": [
      {
        "kind": "p",
        "text": [
          "The worklist (",
          {
            "text": "/console",
            "code": true
          },
          ") is your home screen: every registry entry as a work row with its stage badge, blocking counts, cost to date, and a server-computed ",
          {
            "text": "next action",
            "strong": true
          },
          ". The header shows global progress (x/200 published)."
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "Runbook — start of every session:",
            "strong": true
          }
        ]
      },
      {
        "kind": "steps",
        "items": [
          {
            "text": [
              "Open ",
              {
                "text": "/console",
                "code": true
              },
              ". Read the global header first: did anything regress overnight (a re-run flipping entries to ",
              {
                "text": "needs_rerun",
                "code": true
              },
              ")?"
            ]
          },
          {
            "text": [
              "Sort by ",
              {
                "text": "next action",
                "strong": true
              },
              " (the default). The ranking is deliberate: blocked work outranks available work, and a failing gate outranks an unapproved spend. Trust it — the top row is your morning."
            ]
          },
          {
            "text": [
              "Work top-down. Click a row → the entry workspace opens with tabs: ",
              {
                "text": "Harvest · Membership & gates · Coverage · Enrichment · QA · History",
                "strong": true
              },
              ". The tab badges are your todo counts for that entry."
            ]
          },
          {
            "text": [
              "Before leaving an entry, glance at History (its runs + audit) — confirm your session's actions are all recorded and attributed to you."
            ]
          }
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "needs_rerun",
            "code": true
          },
          " is orthogonal to progress: it means upstream data moved (new Overture release, OSM re-extract) and the entry's results are stale. Stale work still shows; finish judgements only where they'll survive the re-run (verdicts and waivers do — they're keyed to stable ids)."
        ]
      }
    ]
  },
  {
    "number": 4,
    "slug": "chapter-4-onboarding-a-new-resort-the-wizard",
    "title": "Onboarding a new resort (the wizard)",
    "heading": "Chapter 4 — Onboarding a new resort (the wizard)",
    "blocks": [
      {
        "kind": "p",
        "text": [
          "Identity is the foundation everything else stands on. A wrong identity decision here costs days downstream; take your time on this screen and speed up everywhere else."
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "Runbook — onboarding:",
            "strong": true
          }
        ]
      },
      {
        "kind": "steps",
        "items": [
          {
            "text": [
              "Open ",
              {
                "text": "Onboarding",
                "strong": true
              },
              " (or deep-link from a worklist row's \"onboard\" action — the wizard opens pre-seeded with that entry)."
            ]
          },
          {
            "text": [
              "Search the resort name. You get side-by-side candidates:"
            ],
            "sub": [
              [
                {
                  "text": "Skimap.org",
                  "strong": true
                },
                " — the editorial spine. A Skimap entry's parenthetical member list (\"Les 3 Vallées (Val Thorens, Les Menuires, …)\") pre-fills the group's members. This list is the single most valuable thing on the screen — verify it against the resort's own site, don't just accept it."
              ],
              [
                {
                  "text": "OSM polygons",
                  "strong": true
                },
                " — our extracted candidates with overlap analysis."
              ],
              [
                "Wikidata — currently serves no candidates (known gap; leave the QID blank rather than guessing)."
              ]
            ]
          },
          {
            "text": [
              {
                "text": "Duplicate prompts",
                "strong": true
              },
              ": pairs of OSM polygons with high mutual overlap surface as \"same resort?\". Overlap is shown ",
              {
                "text": "both directions",
                "strong": true
              },
              " (A covers 98% of B; B covers 81% of A) because containment is asymmetric — a village polygon inside a domain polygon is ",
              {
                "text": "not",
                "em": true
              },
              " a duplicate. Same name or ≥85% both ways → merge: both OSM ids become evidence refs on one entry."
            ]
          },
          {
            "text": [
              "Declare the group and members. The ",
              {
                "text": "marketing name",
                "strong": true
              },
              ", not the commune: \"Courchevel\", never \"Saint-Bon-Tarentaise\". Members keeping their own brand (an Orelle that markets separately) get ",
              {
                "text": "excludeFromGroupNaming",
                "code": true
              },
              "."
            ]
          },
          {
            "text": [
              "Adjust the ",
              {
                "text": "bbox",
                "strong": true
              },
              " to the domain plus its access villages — too tight starves the harvest, absurdly large (>1.5°) trips validation. Drop ",
              {
                "text": "village seed points",
                "strong": true
              },
              " on each member's village center; membership's settlement rule uses them."
            ]
          },
          {
            "text": [
              "Watch the manifest JSON panel — it ",
              {
                "text": "is",
                "em": true
              },
              " the pipeline's input contract, and validation runs on every edit. Fix errors (missing members, bad bbox, duplicate member, unknown Skimap id); read warnings (member without evidence, name mismatch vs Skimap) and decide consciously."
            ]
          },
          {
            "text": [
              {
                "text": "Save draft",
                "strong": true
              },
              " early and often. ",
              {
                "text": "Submit",
                "strong": true
              },
              " only when done: submit mints the registry entries, records identity, and queues the harvest run as a work order. Submitted manifests are immutable — corrections happen through the registry afterwards, not by resubmitting."
            ]
          }
        ]
      }
    ]
  },
  {
    "number": 5,
    "slug": "chapter-5-harvest-review",
    "title": "Harvest review",
    "heading": "Chapter 5 — Harvest review",
    "blocks": [
      {
        "kind": "p",
        "text": [
          "After a harvest run, the pipeline has conflated OSM and Overture into one place set and queued everything it wasn't sure about. This is your highest-volume screen; the keyboard exists for it."
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "Reading the screen:",
            "strong": true
          },
          " map on one side with switchable layers (OSM extraction / Overture, shaded by confidence / conflated result), conflict queue on the other. Each conflict shows both candidates with per-field provenance chips and a suggested verdict where the pipeline has a lean. The run summary pins the Overture release id — that's the reproducibility anchor."
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "The four verdicts:",
            "strong": true
          }
        ]
      },
      {
        "kind": "table",
        "head": [
          [
            "Verdict"
          ],
          [
            "Means"
          ],
          [
            "Reach for it when"
          ]
        ],
        "rows": [
          [
            [
              "Keep left / keep right"
            ],
            [
              "One candidate is right, the other is noise"
            ],
            [
              "Same venue, one source clearly better"
            ]
          ],
          [
            [
              {
                "text": "Merge",
                "strong": true
              }
            ],
            [
              "Same real-world venue, keep both refs"
            ],
            [
              "Both sources describe one place — merged provenance keeps the best of each field. Writes its own audit row."
            ]
          ],
          [
            [
              "Skip"
            ],
            [
              "Both are real, distinct places"
            ],
            [
              "Two same-named mountain huts 400 m apart are ",
              {
                "text": "not",
                "em": true
              },
              " duplicates"
            ]
          ]
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "Runbook — clearing a conflict queue:",
            "strong": true
          }
        ]
      },
      {
        "kind": "steps",
        "items": [
          {
            "text": [
              {
                "text": "j",
                "code": true
              },
              "/",
              {
                "text": "k",
                "code": true
              },
              " through the queue; the map follows your cursor. Judge with the map, not the list — distance and terrain context decide most cases."
            ]
          },
          {
            "text": [
              "Verdict with single keys (",
              {
                "text": "1",
                "code": true
              },
              "/",
              {
                "text": "l",
                "code": true
              },
              ", ",
              {
                "text": "2",
                "code": true
              },
              "/",
              {
                "text": "r",
                "code": true
              },
              ", ",
              {
                "text": "3",
                "code": true
              },
              "/",
              {
                "text": "m",
                "code": true
              },
              ", ",
              {
                "text": "4",
                "code": true
              },
              "/",
              {
                "text": "s",
                "code": true
              },
              "); ",
              {
                "text": "u",
                "code": true
              },
              " to undo a slip before it syncs."
            ]
          },
          {
            "text": [
              "Same name + same category + tens of meters apart → almost always ",
              {
                "text": "merge",
                "strong": true
              },
              ". Same name + hundreds of meters + terrain between them → almost always ",
              {
                "text": "skip",
                "strong": true
              },
              " (distinct). When in doubt, open the venue's website from the evidence panel."
            ]
          },
          {
            "text": [
              "After you've calibrated on a few dozen by hand, use ",
              {
                "text": "bulk accept",
                "strong": true
              },
              " with the confidence slider for the long tail of high-confidence suggestions. Bulk accept applies each conflict's ",
              {
                "text": "suggested",
                "em": true
              },
              " verdict at or above your threshold — spot-check a sample afterwards. Never bulk-accept a queue you haven't first sampled manually."
            ]
          },
          {
            "text": [
              {
                "text": "permanently_closed",
                "code": true
              },
              " exclusions and low-confidence Overture rows near the threshold sit in their own conflict types — they're asking \"should this place exist at all?\", not \"which copy wins?\"."
            ]
          }
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "A cautionary example that actually happened:",
            "strong": true
          },
          " \"Prends ta Luge et tire toi\" — a sledge-rental at a Val Thorens restaurant — appeared as two places, an OSM restaurant and an OSM rental, identical names, 14 m apart. The correct verdict was ",
          {
            "text": "merge",
            "strong": true
          },
          " (one venue, two functions, both refs kept). It sat unresolved in the queue and slipped through to QA, where the name-collision check caught it. The lesson: the queue's tail matters; the checks behind you are a net, not an excuse."
        ]
      }
    ]
  },
  {
    "number": 6,
    "slug": "chapter-6-membership-gates",
    "title": "Membership & gates",
    "heading": "Chapter 6 — Membership & gates",
    "blocks": [
      {
        "kind": "p",
        "text": [
          "Membership answers: which member does each place belong to? The pipeline flood-fills assignments over the routing graph (basis ",
          {
            "text": "network",
            "code": true
          },
          ") and the village seeds (basis ",
          {
            "text": "settlement",
            "code": true
          },
          "). Your queue is the ",
          {
            "text": "orphan belt",
            "strong": true
          },
          " — places inside the group extent that no member claimed."
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "Reading the screen:",
            "strong": true
          },
          " members render as colored territories; places carry their member's color; multi-membership places draw hatched (legitimate — a mid-station restaurant can belong to two members). Orphans render loud, with the nearest member and distance. Gates panel on the side."
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "Orphan actions",
            "strong": true
          },
          " (single-key, like harvest):"
        ]
      },
      {
        "kind": "table",
        "head": [
          [
            "Action"
          ],
          [
            "Means"
          ],
          [
            "Reach for it when"
          ]
        ],
        "rows": [
          [
            [
              "Assign to nearest"
            ],
            [
              "Manual membership to the named member"
            ],
            [
              "The place obviously belongs; the graph just couldn't reach it (a hut 100 m off-piste)"
            ]
          ],
          [
            [
              {
                "text": "Create member",
                "strong": true
              }
            ],
            [
              "A whole settlement is missing from the registry"
            ],
            [
              "Orphans ",
              {
                "text": "cluster",
                "em": true
              },
              ". Ten orphans around one village = the village is a missing member, not ten mistakes. The action mints the member and writes audit."
            ]
          ],
          [
            [
              "Flag boundary"
            ],
            [
              "The member exists but its extent is wrong"
            ],
            [
              "Orphans hug one member's edge"
            ]
          ],
          [
            [
              "Skip"
            ],
            [
              "Genuinely outside our scope"
            ],
            [
              "A valley-floor supermarket 8 km from the lifts"
            ]
          ]
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "The four gates:",
            "strong": true
          }
        ]
      },
      {
        "kind": "bullets",
        "items": [
          [
            {
              "text": "Orphan belt",
              "strong": true
            },
            " (blocking) — unresolved orphan clusters. Resolve the queue; the gate clears itself."
          ],
          [
            {
              "text": "Empty member",
              "strong": true
            },
            " (blocking) — a declared member claimed nothing. Either its anchor/seed is wrong (fix via wizard/flag) or it shouldn't be a member."
          ],
          [
            {
              "text": "Duplicate claim",
              "strong": true
            },
            " (blocking) — two members claim near-identical place sets; usually the twin-polygon disease arriving late. Escalate — this is an identity problem, not a membership one."
          ],
          [
            {
              "text": "Downhill without lift",
              "strong": true
            },
            " — deferred to routing coverage (Chapter 7), shows not-run here."
          ]
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "Waiving:",
            "strong": true
          },
          " any failing gate can be waived with a mandatory reason. A good waiver reads like a judgement: ",
          {
            "text": "\"7 orphans are the valley campsite cluster — outside ski scope, will not create a member.\"",
            "em": true
          },
          " A bad waiver reads like a shrug. When the last blocking failure is waived, the run advances exactly as if it had passed — members' status moves on and anchors persist."
        ]
      }
    ]
  },
  {
    "number": 7,
    "slug": "chapter-7-routing-coverage-screen-8",
    "title": "Routing coverage (screen 8)",
    "heading": "Chapter 7 — Routing coverage (screen 8)",
    "blocks": [
      {
        "kind": "p",
        "text": [
          "Everything before this measures the ",
          {
            "text": "POI",
            "em": true
          },
          " layer. Coverage measures the thing the app actually navigates: ",
          {
            "text": "did we capture every run, lift, and connection?",
            "strong": true
          },
          " The report is computed live from the routing graph, so it's always current — and it re-checks itself after every re-extract."
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "Reading the screen, top to bottom:",
            "strong": true
          }
        ]
      },
      {
        "kind": "steps",
        "items": [
          {
            "text": [
              {
                "text": "Graph header",
                "strong": true
              },
              " — your sanity strip. For a major domain expect: hundreds of routable km, a largest-component share near 100%, reachable-piste % near 100%, and a healthy connector count. (Les 3 Vallées reads ~770 km, 12 components, 98.7% largest, 98.5% reachable.) A largest-component share of 60% means the network is split — stop and escalate before judging findings one by one."
            ]
          },
          {
            "text": [
              {
                "text": "Per-member census",
                "strong": true
              },
              " — piste km, lifts by type, named runs by difficulty. Sanity-check against what you know: Courchevel at 115 km / 38 lifts is plausible; Courchevel at 4 lifts means attribution or extraction broke."
            ]
          },
          {
            "text": [
              {
                "text": "Reference cards",
                "strong": true
              },
              " — independent sources vs our extraction:"
            ],
            "sub": [
              [
                {
                  "text": "liftie",
                  "strong": true
                },
                " (operator feeds) is the star: it scrapes each resort's own status page, so its lift list is ",
                {
                  "text": "operator-authoritative",
                  "em": true
                },
                ". A liftie lift with no OSM counterpart is the strongest \"we missed one\" signal that exists. ",
                {
                  "text": "Seasonal caveat:",
                  "strong": true
                },
                " out of season, feeds are live but publish no lift list — the card says so and the comparison shows not-run. That is honest, not broken. Re-judge when the season starts."
              ],
              [
                "Skimap / declared counts — currently unavailable (no counts in the index; no declared counts recorded yet). The cards say why."
              ]
            ]
          },
          {
            "text": [
              {
                "text": "Gates",
                "strong": true
              },
              " — disconnected terminals (blocking), isolated components (blocking), reference disagreement (blocking when a reference exists), missing difficulty (warn)."
            ]
          },
          {
            "text": [
              {
                "text": "Findings queue",
                "strong": true
              },
              " — the review queue, unresolved first."
            ]
          }
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "The four verdicts, and how to choose:",
            "strong": true
          }
        ]
      },
      {
        "kind": "table",
        "head": [
          [
            "Verdict"
          ],
          [
            "Means"
          ],
          [
            "Reach for it when"
          ]
        ],
        "rows": [
          [
            [
              {
                "text": "fix_upstream",
                "strong": true
              }
            ],
            [
              "The gap is real and belongs in OpenStreetMap"
            ],
            [
              "A genuinely missing run or lift. Fix it ",
              {
                "text": "in OSM",
                "em": true
              },
              " (see below) — everyone benefits — then the finding re-checks after the next re-extract."
            ]
          ],
          [
            [
              {
                "text": "local_override",
                "strong": true
              }
            ],
            [
              "Record a graph repair as our own evidence layer"
            ],
            [
              "A connectivity defect OSM models fine but our extraction misjoins — a connector that should exist, a tag override. Never traced geometry."
            ]
          ],
          [
            [
              {
                "text": "accept_gap",
                "strong": true
              },
              " (reason mandatory)"
            ],
            [
              "The finding is correct ",
              {
                "text": "and",
                "em": true
              },
              " acceptable"
            ],
            [
              "A decommissioned lift the feed still lists; a deliberately liftless ski-touring sector. Your reason is the permanent record of why."
            ]
          ],
          [
            [
              "retry"
            ],
            [
              "Re-check after an upstream fix landed"
            ],
            [
              "You (or someone) fixed OSM and the extract has re-run"
            ]
          ]
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "Worked example:",
            "strong": true
          },
          " L3V's coverage flags a 5 km piste cluster with no lift around ",
          {
            "text": "Lac du Lou",
            "strong": true
          },
          " (Val Thorens's ski-route sector). That is real terrain, correctly extracted, deliberately liftless — the analyst verdict is ",
          {
            "text": "accept_gap",
            "code": true
          },
          " with exactly that reason. The 11 disconnected lift terminals next to it deserve individual eyes: each one is either a summer-only installation (accept), an OSM tagging gap (fix upstream), or an extraction misjoin (local_override + escalate)."
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "Fixing OSM upstream:",
            "strong": true
          },
          " create an OSM account attributed to you (never a shared account), make the edit with a clear changeset comment, and record the changeset link in your verdict reason. Alpline never edits OSM programmatically — upstream fixes are yours, made as a citizen mapper."
        ]
      },
      {
        "kind": "p",
        "text": [
          "Coverage feeds QA: the ",
          {
            "text": "coverage signed-off",
            "strong": true
          },
          " check (Chapter 8) warns while a resort is unmeasured and ",
          {
            "text": "blocks publish",
            "em": true
          },
          " while a blocking coverage gate fails unwaived. Publishing a resort now means having looked its graph in the eye."
        ]
      }
    ]
  },
  {
    "number": 8,
    "slug": "chapter-8-qa-and-publish",
    "title": "QA and publish",
    "heading": "Chapter 8 — QA and publish",
    "blocks": [
      {
        "kind": "p",
        "text": [
          "The last screen before the data reaches users. Everything here exists to answer one question: ",
          {
            "text": "would you stake the app's reputation on this resort?",
            "em": true
          }
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "The six automated checks",
            "strong": true
          },
          " (computed fresh every visit):"
        ]
      },
      {
        "kind": "table",
        "head": [
          [
            "Check"
          ],
          [
            "Blocking"
          ],
          [
            "It caught / catches"
          ]
        ],
        "rows": [
          [
            [
              "Name collisions"
            ],
            [
              "yes"
            ],
            [
              "Identical names within 150 m — duplicates the harvest missed (this is what caught the sledge-rental)"
            ]
          ],
          [
            [
              "Category outliers"
            ],
            [
              "warn"
            ],
            [
              "Places with no usable category — they'd render as generic pins"
            ]
          ],
          [
            [
              "Count delta"
            ],
            [
              "warn"
            ],
            [
              "±30% place-count swing vs the previous publish"
            ]
          ],
          [
            [
              "Dangling refs"
            ],
            [
              "warn"
            ],
            [
              "Foursquare refs with no fetched payload"
            ]
          ],
          [
            [
              "Missing geometry"
            ],
            [
              "yes"
            ],
            [
              "Members without a center point; lifts/trails without a path"
            ]
          ],
          [
            [
              "Coverage signed off"
            ],
            [
              "yes"
            ],
            [
              "A failing blocking coverage gate (warns if the resort is simply unmeasured)"
            ]
          ]
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "The human checklist",
            "strong": true
          },
          " — the judgements no check can make. Each item records who confirmed it and when:"
        ]
      },
      {
        "kind": "steps",
        "items": [
          {
            "text": [
              {
                "text": "Compared against the official piste map",
                "em": true
              },
              " — open the piste-map asset side-by-side (or pin it as an opacity overlay), confirm sectors, lifts and villages line up."
            ]
          },
          {
            "text": [
              {
                "text": "Member names match resort signage",
                "em": true
              },
              " — marketing names, not communes."
            ]
          },
          {
            "text": [
              {
                "text": "Top POIs spot-checked",
                "em": true
              },
              " — pick ~20 famous places; confirm name, category, position."
            ]
          },
          {
            "text": [
              {
                "text": "Live lift status mapped or confirmed N/A",
                "em": true
              },
              " — the lifts feed covers this resort, or you've recorded that no scraper exists."
            ]
          }
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "Runbook — publishing:",
            "strong": true
          }
        ]
      },
      {
        "kind": "steps",
        "items": [
          {
            "text": [
              "Clear or consciously waive every failing check. Waivers entered at publish are applied ",
              {
                "text": "atomically with the publish",
                "strong": true
              },
              " — if something still blocks, ",
              {
                "text": "nothing",
                "em": true
              },
              " persists and the response names the blockers. There is no waived-but-unpublished limbo."
            ]
          },
          {
            "text": [
              "Tick the checklist honestly — each tick is signed with your name."
            ]
          },
          {
            "text": [
              "Publish. The version increments, members flip to published, counts are snapshotted (they seed the next count-delta), and the audit row records the lot."
            ]
          },
          {
            "text": [
              "Re-publishing after changes is normal and cheap — the delta check exists precisely so iteration is safe."
            ]
          }
        ]
      }
    ]
  },
  {
    "number": 9,
    "slug": "chapter-9-enrichment-the-money-screen",
    "title": "Enrichment (the money screen)",
    "heading": "Chapter 9 — Enrichment (the money screen)",
    "blocks": [
      {
        "kind": "p",
        "text": [
          "Foursquare enrichment adds commercial metadata (hours, ratings, photos) to member places. It is the ",
          {
            "text": "only paid step in the entire pipeline",
            "strong": true
          },
          ", and it runs solely behind your approval."
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "The economics you are guarding:",
            "strong": true
          },
          " Pro calls cost $15 per 1,000 with the first 500 per calendar month free ",
          {
            "text": "account-wide",
            "strong": true
          },
          " (not per resort); premium fields are $18.75 per 1,000. A full Les 3 Vallées batch projects roughly $16. Small numbers — but only because this screen exists."
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "Reading the estimate:",
            "strong": true
          },
          " total POIs → minus already-covered-by-free-sources → minus low-confidence Overture rows → minus group-level dedupe → the billable remainder, with a sampled match rate and the projected cost split by free/pro/premium. The estimate ",
          {
            "text": "computes",
            "em": true
          },
          " these reductions from the data — it is a dry run, not a guess."
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "Runbook — approving a spend:",
            "strong": true
          }
        ]
      },
      {
        "kind": "steps",
        "items": [
          {
            "text": [
              "Read the estimate's reductions. If \"already covered free\" looks too low, the harvest may be under-merged — go back before paying to enrich duplicates."
            ]
          },
          {
            "text": [
              "Check the remaining free-tier calls this month (shown on screen)."
            ]
          },
          {
            "text": [
              {
                "text": "Policy: approvals above the owner's standing limit need the owner's explicit go-ahead first.",
                "strong": true
              },
              " (Current standing instruction: keep spend small; the full L3V batch is explicitly reserved for the owner to approve in this console personally.)"
            ]
          },
          {
            "text": [
              "Approve with a ",
              {
                "text": "ceiling",
                "strong": true
              },
              ". The batch aborts rather than exceeds it. Your name and ceiling go into the run record."
            ]
          },
          {
            "text": [
              "After the batch: read the report — match rate, credits, actual vs projected cost — then clear the ",
              {
                "text": "unmatched queue",
                "strong": true
              },
              ": ",
              {
                "text": "accept",
                "code": true
              },
              " (fine unenriched), ",
              {
                "text": "retry",
                "code": true
              },
              " (name/position was the problem and you've fixed it), ",
              {
                "text": "manual_ref",
                "code": true
              },
              " (you found the venue's Foursquare id yourself — paste it), or ",
              {
                "text": "flag",
                "code": true
              },
              "."
            ]
          }
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "Licensing red line:",
            "strong": true
          },
          " Tripadvisor data, if it ever appears anywhere, may only ever be stored as a ",
          {
            "text": "location_id",
            "code": true
          },
          ". Payload beyond that is a licensing bug — report it, don't work around it."
        ]
      }
    ]
  },
  {
    "number": 10,
    "slug": "chapter-10-runs-audit-and-your-paper-trail",
    "title": "Runs, audit, and your paper trail",
    "heading": "Chapter 10 — Runs, audit, and your paper trail",
    "blocks": [
      {
        "kind": "p",
        "text": [
          "The ",
          {
            "text": "History",
            "strong": true
          },
          " tab (per entry) and ",
          {
            "text": "Runs",
            "strong": true
          },
          " screen (global) render the run ledger: stages, statuses, dataset releases, durations, costs, gate outcomes, approvals, waivers. The ",
          {
            "text": "audit log",
            "strong": true
          },
          " is the flat record of every human action — filterable by entry, run, and actor."
        ]
      },
      {
        "kind": "p",
        "text": [
          "Use them to:"
        ]
      },
      {
        "kind": "bullets",
        "items": [
          [
            "Reconstruct \"why is this entry in this state?\" — read its runs newest-first, then its audit rows."
          ],
          [
            "Verify your own session before signing off — every verdict you made should be attributed to your email."
          ],
          [
            "Answer provenance questions months later — \"who merged these two restaurants, and why?\" has an answer with a name and a reason on it."
          ]
        ]
      },
      {
        "kind": "p",
        "text": [
          "Runs queued from the console sit as work orders until engineering executes the pipeline. A run in ",
          {
            "text": "awaiting_approval",
            "code": true
          },
          " on the enrichment stage is waiting on Chapter 9, not on engineering."
        ]
      }
    ]
  },
  {
    "number": 11,
    "slug": "chapter-11-troubleshooting",
    "title": "Troubleshooting",
    "heading": "Chapter 11 — Troubleshooting",
    "blocks": [
      {
        "kind": "table",
        "head": [
          [
            "Symptom"
          ],
          [
            "Meaning"
          ],
          [
            "Do"
          ]
        ],
        "rows": [
          [
            [
              "Stage tab says \"no run yet\""
            ],
            [
              "The pipeline hasn't executed this stage for this entry"
            ],
            [
              "Queue a run (worklist) or ask engineering; nothing is broken"
            ]
          ],
          [
            [
              "Coverage says \"no routing graph yet\""
            ],
            [
              "The routing pipeline hasn't imported this database/region"
            ],
            [
              "Expected on a fresh environment; ask engineering for the import"
            ]
          ],
          [
            [
              "Liftie card \"unavailable — out of season\""
            ],
            [
              "Operator feed is live but publishes no lift list"
            ],
            [
              "Normal in summer; re-judge coverage when lifts spin"
            ]
          ],
          [
            [
              "Verdict didn't stick"
            ],
            [
              "You may have re-sent an identical verdict (idempotent no-op), or the finding id changed after a re-extract"
            ],
            [
              "Reload; if the finding is gone, the graph moved — good"
            ]
          ],
          [
            [
              "\"Only a failing gate can be waived\""
            ],
            [
              "The gate is passing or not-run"
            ],
            [
              "Nothing to waive; if you expected a failure, reload"
            ]
          ],
          [
            [
              "Screen shows stale counts after your actions"
            ],
            [
              "The batch hasn't synced"
            ],
            [
              "Wait for the sync indicator; ",
              {
                "text": "w",
                "code": true
              },
              " forces a save on queue screens"
            ]
          ],
          [
            [
              "401 / bounced to login"
            ],
            [
              "Session expired or email not on the allow-list"
            ],
            [
              "Re-login; if persistent, ask ops to check the allow-list"
            ]
          ],
          [
            [
              "A publish returns ",
              {
                "text": "blockedBy",
                "code": true
              }
            ],
            [
              "A check still fails unwaived"
            ],
            [
              "Read the named checks; resolve or waive consciously"
            ]
          ]
        ]
      },
      {
        "kind": "p",
        "text": [
          {
            "text": "Escalate to engineering",
            "strong": true
          },
          " (don't grind): identity-level duplicates surfacing after onboarding, duplicate-claim gate failures, a largest-component share far below 100%, anything that looks like the pipeline mis-extracted rather than the mountain being weird, and any licensing concern."
        ]
      }
    ]
  },
  {
    "number": 12,
    "slug": "chapter-12-the-analyst-s-creed",
    "title": "The analyst's creed",
    "heading": "Chapter 12 — The analyst's creed",
    "blocks": [
      {
        "kind": "bullets",
        "items": [
          [
            "Judge with the map, not the list."
          ],
          [
            "Merge venues, skip neighbours, and when unsure — open their website."
          ],
          [
            "Orphans cluster; ten orphans are usually one missing village."
          ],
          [
            "A waiver is a judgement with your name on it, not an escape hatch."
          ],
          [
            "The operator's own lift list outranks everyone, including us."
          ],
          [
            "Fix the world in OSM; fix our reading of it with overrides; accept the mountain as it is with a reason."
          ],
          [
            "Nothing paid without your click; nothing destroyed without a record."
          ],
          [
            "Publish means you looked. All of it."
          ]
        ]
      }
    ]
  }
];
