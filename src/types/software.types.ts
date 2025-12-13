
export interface Software {
  name: string;
  licenses: {
    name: string;
    count: number;
    lockedTo?: string;
  }[];
}

export const SOFTWARE_CATALOG: Software[] = [
  {
    name: 'Ansys',
    licenses: [
      { name: 'Mechanical Enterprise', count: 1 },
      { name: 'Mechanical Premium', count: 1 },
      { name: 'CFD Enterprise', count: 1 },
      { name: 'Discovery License', count: 2 },
      { name: 'HPC', count: 1 },
    ],
  },
  {
    name: 'Solidworks',
    licenses: [
      { name: 'Standard', count: 2 },
      { name: 'Premium 2020 (n-locked)', count: 1, lockedTo: 'PC5' },
      { name: '2016 (locked)', count: 1, lockedTo: 'PC9' },
    ],
  },
  {
    name: 'BIMHVAC Tool',
    licenses: [
      { name: 'Reseller Demo', count: 1 },
      { name: 'Standard', count: 1 },
    ],
  },
];
