import { plpSmoke } from './plp.shared';
import { collections, expectedCounts } from '../../test-data/site';

plpSmoke({
  title: 'Protein Coffee PLP',
  handle: collections.protein,
  expectedCount: expectedCounts.protein,
  ids: {
    load: 'BEV-PCC-002', count: 'BEV-PCC-005', mandatory: 'BEV-PCC-006',
    saleCompare: 'BEV-PCC-012', savePct: 'BEV-PCC-013', priceParity: 'BEV-PCC-014',
    imageToPdp: 'BEV-PCC-017', titleToPdp: 'BEV-PCC-018', atcAdds: 'BEV-PCC-020',
    cartCount: 'BEV-PCC-021', health: 'BEV-PCC-031',
  },
});
