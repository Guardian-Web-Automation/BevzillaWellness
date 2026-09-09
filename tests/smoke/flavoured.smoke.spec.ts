import { plpSmoke } from './plp.shared';
import { collections, expectedCounts } from '../../test-data/site';

plpSmoke({
  title: 'Flavoured Coffee PLP',
  handle: collections.flavoured,
  expectedCount: expectedCounts.flavoured,
  ids: {
    load: 'BEV-FCC-002', count: 'BEV-FCC-005', mandatory: 'BEV-FCC-007',
    saleCompare: 'BEV-FCC-012', savePct: 'BEV-FCC-013', priceParity: 'BEV-FCC-014',
    imageToPdp: 'BEV-FCC-017', titleToPdp: 'BEV-FCC-018', atcAdds: 'BEV-FCC-020',
    cartCount: 'BEV-FCC-021', health: 'BEV-FCC-032',
  },
});
