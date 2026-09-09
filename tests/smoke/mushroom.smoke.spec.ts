import { plpSmoke } from './plp.shared';
import { collections, expectedCounts } from '../../test-data/site';

plpSmoke({
  title: 'Mushroom Coffee PLP',
  handle: collections.mushroom,
  expectedCount: expectedCounts.mushroom,
  ids: {
    load: 'BEV-MCC-002', count: 'BEV-MCC-008', mandatory: 'BEV-MCC-009',
    saleCompare: 'BEV-MCC-015', savePct: 'BEV-MCC-016', priceParity: 'BEV-MCC-017',
    imageToPdp: 'BEV-MCC-020', titleToPdp: 'BEV-MCC-021', atcAdds: 'BEV-MCC-024',
    cartCount: 'BEV-MCC-025', atcTwice: 'BEV-MCC-026', atcMultiple: 'BEV-MCC-027',
    health: 'BEV-MCC-051',
  },
});
