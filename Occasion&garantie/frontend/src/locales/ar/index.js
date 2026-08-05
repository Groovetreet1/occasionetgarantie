import { arCommon } from './common';
import { arNav } from './nav';
import { arFooter } from './footer';
import { arHome } from './home';
import { arProducts } from './products';
import { arAuth } from './auth';
import { arAbout } from './about';
import { arSeller } from './seller';
import { arAdmin } from './admin';
import { arMessenger } from './messenger';
import { arReprise } from './reprise';
import { arProfile } from './profile';
import { arShop } from './shop';

export const ar = {
  ...arCommon,
  ...arNav,
  ...arFooter,
  ...arHome,
  ...arProducts,
  ...arAuth,
  ...arAbout,
  ...arSeller,
  ...arAdmin,
  ...arMessenger,
  ...arReprise,
  ...arProfile,
  ...arShop,
};