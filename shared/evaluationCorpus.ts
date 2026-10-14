export type EvaluationCase = { id: string; age: number; category: string; confirmedToys: string[]; expectedLabels: string[]; generationAllowed: boolean; licenseVerified: boolean; privacyReviewed: boolean; imageSha256: string | null; asset: string | null };
export const EVALUATION_DATASET_VERSION = 'toy-only-24-2026-10-14';
// Static allowlist of reduced public toy-only fixtures; full provenance is in tests/fixtures/ai-evaluation/manifest.json.
// Licensing and recognition are not manufacturer safety certification.
export const evaluationCases: EvaluationCase[] = [
  {
    "id": "case-01",
    "age": 2,
    "category": "plush bear",
    "confirmedToys": [
      "brown stuffed animal"
    ],
    "expectedLabels": [
      "teddy bear",
      "stuffed animal"
    ],
    "generationAllowed": true,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "dd095e0de6caceb3a6e64bb42920bf0d61926625b801e85989f4556cd96181b6",
    "asset": "tests/fixtures/ai-evaluation/case-01.jpg"
  },
  {
    "id": "case-02",
    "age": 3,
    "category": "plush bear",
    "confirmedToys": [
      "stuffed animal"
    ],
    "expectedLabels": [
      "stuffed animal",
      "teddy bear"
    ],
    "generationAllowed": true,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "e440273af8e7b7619d2d34fb2b2f850295446a24e73b98a5aa925c3621ed595e",
    "asset": "tests/fixtures/ai-evaluation/case-02.jpg"
  },
  {
    "id": "case-03",
    "age": 4,
    "category": "alphabet blocks",
    "confirmedToys": [
      "wooden blocks"
    ],
    "expectedLabels": [
      "wooden blocks",
      "alphabet blocks"
    ],
    "generationAllowed": true,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "a39667aa497c67042a17b22e0ce7e94772604fff511de0d73b869d5f10c1914e",
    "asset": "tests/fixtures/ai-evaluation/case-03.jpg"
  },
  {
    "id": "case-04",
    "age": 5,
    "category": "wooden toy castle",
    "confirmedToys": [
      "wooden castle"
    ],
    "expectedLabels": [
      "wooden castle",
      "building blocks"
    ],
    "generationAllowed": true,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "a6b585c49a432b5beb9588044e85dbe36196bae53eebea01c735ca734757c82d",
    "asset": "tests/fixtures/ai-evaluation/case-04.jpg"
  },
  {
    "id": "case-05",
    "age": 6,
    "category": "grey ride-on car",
    "confirmedToys": [
      "ride-on toy car"
    ],
    "expectedLabels": [
      "ride-on toy car",
      "toy car"
    ],
    "generationAllowed": false,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "47f7ed9c2c6430cba121df51adceb16d3d66f4c991c23a016b013ed7de49dbaf",
    "asset": "tests/fixtures/ai-evaluation/case-05.jpg"
  },
  {
    "id": "case-06",
    "age": 7,
    "category": "yellow ride-on car",
    "confirmedToys": [
      "ride-on toy car"
    ],
    "expectedLabels": [
      "ride-on toy car",
      "toy car"
    ],
    "generationAllowed": false,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "30388a6a14ce38904c62c73a8ff81551be7c7eea307a0a309b6e5cb4e5a4605b",
    "asset": "tests/fixtures/ai-evaluation/case-06.jpg"
  },
  {
    "id": "case-07",
    "age": 8,
    "category": "wooden train",
    "confirmedToys": [
      "wooden toy train"
    ],
    "expectedLabels": [
      "wooden toy train",
      "toy train"
    ],
    "generationAllowed": true,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "01951f902f869c795958ae62c12d0781fa2c080eb5f5579b6b2ca2c4b1e8e730",
    "asset": "tests/fixtures/ai-evaluation/case-07.jpg"
  },
  {
    "id": "case-08",
    "age": 2,
    "category": "wooden train display",
    "confirmedToys": [
      "wooden toy train"
    ],
    "expectedLabels": [
      "wooden toy train",
      "toy train"
    ],
    "generationAllowed": true,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "a510281f9987690ac2afba7bc0ad78215279da4bdb4570e13490911fabdaa315",
    "asset": "tests/fixtures/ai-evaluation/case-08.jpg"
  },
  {
    "id": "case-09",
    "age": 3,
    "category": "mixed baby toys",
    "confirmedToys": [
      "toy mirror"
    ],
    "expectedLabels": [
      "toy mirror",
      "rattle",
      "stacking toy",
      "toy phone"
    ],
    "generationAllowed": false,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "e9a5b8f56bd22879bf658b58850a513909c288d9a3a333d6dc35f436dc7834e6",
    "asset": "tests/fixtures/ai-evaluation/case-09.jpg"
  },
  {
    "id": "case-10",
    "age": 4,
    "category": "jigsaw puzzle",
    "confirmedToys": [
      "jigsaw puzzle"
    ],
    "expectedLabels": [
      "jigsaw puzzle",
      "puzzle pieces"
    ],
    "generationAllowed": false,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "240730f1f643ead7111b7325458a89c90c7ac158645df09d0e841157a6b2ce3b",
    "asset": "tests/fixtures/ai-evaluation/case-10.jpg"
  },
  {
    "id": "case-11",
    "age": 5,
    "category": "red and green puzzle pieces",
    "confirmedToys": [
      "jigsaw puzzle pieces"
    ],
    "expectedLabels": [
      "jigsaw puzzle pieces",
      "puzzle"
    ],
    "generationAllowed": false,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "9349cc02fe91f5d729e632183c401ef12cb7e6c021b21762afa755ee20b5a172",
    "asset": "tests/fixtures/ai-evaluation/case-11.jpg"
  },
  {
    "id": "case-12",
    "age": 6,
    "category": "scattered puzzle pieces",
    "confirmedToys": [
      "jigsaw puzzle pieces"
    ],
    "expectedLabels": [
      "jigsaw puzzle pieces",
      "puzzle"
    ],
    "generationAllowed": false,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "eeb3957cb2c595a7ae1395d0ef0127a9189949a5fcba3a0f5e34805514f08b95",
    "asset": "tests/fixtures/ai-evaluation/case-12.jpg"
  },
  {
    "id": "case-13",
    "age": 7,
    "category": "historic textile doll",
    "confirmedToys": [
      "doll"
    ],
    "expectedLabels": [
      "doll",
      "toy doll"
    ],
    "generationAllowed": false,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "a68c4df9b2ab5ed044e3a59c060d2abcc56adf53b5a4980ecb5b78c967a74ff2",
    "asset": "tests/fixtures/ai-evaluation/case-13.jpg"
  },
  {
    "id": "case-14",
    "age": 8,
    "category": "small toy balls",
    "confirmedToys": [
      "toy balls"
    ],
    "expectedLabels": [
      "toy balls",
      "bouncing balls"
    ],
    "generationAllowed": false,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "3e22f31e8b48cec8e5186e346429969e3b516fd5ffba2b51b1b815751d0e2574",
    "asset": "tests/fixtures/ai-evaluation/case-14.jpg"
  },
  {
    "id": "case-15",
    "age": 2,
    "category": "toy ball",
    "confirmedToys": [
      "toy ball"
    ],
    "expectedLabels": [
      "toy ball",
      "ball"
    ],
    "generationAllowed": true,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "b52942199caae68670733b42e22929377e46c22674b3cfac511edc08475ef3b5",
    "asset": "tests/fixtures/ai-evaluation/case-15.jpg"
  },
  {
    "id": "case-16",
    "age": 3,
    "category": "historic lead buffalo figurine",
    "confirmedToys": [
      "toy animal figurine"
    ],
    "expectedLabels": [
      "toy animal figurine",
      "buffalo figurine"
    ],
    "generationAllowed": false,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "72f84168ad8ac44e26b0f7b0b3ada33934cf9414424b0e1c6a881cb6d7e7f2a3",
    "asset": "tests/fixtures/ai-evaluation/case-16.jpg"
  },
  {
    "id": "case-17",
    "age": 4,
    "category": "historic toy kitchen",
    "confirmedToys": [
      "toy kitchen"
    ],
    "expectedLabels": [
      "toy kitchen",
      "miniature kitchen"
    ],
    "generationAllowed": false,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "423b932ebabbe57ab3732b674f5859dab7c7edd86af7247001dc9be7ce10e8df",
    "asset": "tests/fixtures/ai-evaluation/case-17.jpg"
  },
  {
    "id": "case-18",
    "age": 5,
    "category": "magnetic toy sphere",
    "confirmedToys": [
      "magnetic construction toy"
    ],
    "expectedLabels": [
      "magnetic construction toy",
      "construction toy"
    ],
    "generationAllowed": false,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "eb8338d49f68c00dc26c50f96069cd0ed7624bd5937d4b2075fd189abc47865a",
    "asset": "tests/fixtures/ai-evaluation/case-18.jpg"
  },
  {
    "id": "case-19",
    "age": 6,
    "category": "magnetic toy cube",
    "confirmedToys": [
      "magnetic construction toy"
    ],
    "expectedLabels": [
      "magnetic construction toy",
      "construction cube"
    ],
    "generationAllowed": false,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "55eb2c73fc479cf38609a75b0ead23c480b81b6bba1f03d8cead4cd131ba549f",
    "asset": "tests/fixtures/ai-evaluation/case-19.jpg"
  },
  {
    "id": "case-20",
    "age": 7,
    "category": "toy cups and animal figures",
    "confirmedToys": [
      "toy cups"
    ],
    "expectedLabels": [
      "toy cups",
      "toy animal figures"
    ],
    "generationAllowed": false,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "b33a16de15970869c6b92988c42e18f6a59693c0cda413583669911167686442",
    "asset": "tests/fixtures/ai-evaluation/case-20.jpg"
  },
  {
    "id": "case-21",
    "age": 8,
    "category": "magnetic toy frames",
    "confirmedToys": [
      "magnetic construction toy"
    ],
    "expectedLabels": [
      "magnetic construction toy",
      "construction frames"
    ],
    "generationAllowed": false,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "7f3d618a3821a779242ae7802273d02c835c9208ed4225c2757b94561bfbc549",
    "asset": "tests/fixtures/ai-evaluation/case-21.jpg"
  },
  {
    "id": "case-22",
    "age": 2,
    "category": "model trains",
    "confirmedToys": [
      "toy trains"
    ],
    "expectedLabels": [
      "toy trains",
      "model trains"
    ],
    "generationAllowed": false,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "c0a8530234400b2d4165f68fdbb1a2a519f091009abc7f8b383c480afab27ebc",
    "asset": "tests/fixtures/ai-evaluation/case-22.jpg"
  },
  {
    "id": "case-23",
    "age": 3,
    "category": "mixed train shelf",
    "confirmedToys": [
      "toy trains"
    ],
    "expectedLabels": [
      "toy trains",
      "model trains"
    ],
    "generationAllowed": false,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "977b2a9ce1147d57b2b99419478e73d599323d49071bf837e6f7c4a20155237c",
    "asset": "tests/fixtures/ai-evaluation/case-23.jpg"
  },
  {
    "id": "case-24",
    "age": 4,
    "category": "plastic dinosaur figurine",
    "confirmedToys": [
      "toy dinosaur"
    ],
    "expectedLabels": [
      "toy dinosaur",
      "dinosaur figurine",
      "toy animal figurine"
    ],
    "generationAllowed": true,
    "licenseVerified": true,
    "privacyReviewed": true,
    "imageSha256": "1bccb8ce5adb6019c8efe07fea0042c0f44edf2f4371353ca5105c8d1394fc6c",
    "asset": "tests/fixtures/ai-evaluation/case-24.jpg"
  }
];

export const evaluationPilotIds = ['case-01', 'case-03', 'case-07'];
export const evaluationAlternativeIds = ['case-01', 'case-02', 'case-03', 'case-07', 'case-15', 'case-24'];
