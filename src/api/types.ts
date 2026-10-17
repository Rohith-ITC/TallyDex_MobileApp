/** Shapes from TallyDex-FE/src/types and the v3 Postman collection. */

export type Role = 'SUPEROWNER' | 'OWNER' | 'USER';

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paged<T> {
  items: T[];
  pagination: Pagination;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  role: Role;
  phone?: string;
  isFirstLogin?: boolean;
}

export interface Organization {
  id: number;
  name: string;
  dbSchema: string;
}

export interface LoginData {
  accessToken: string;
  refreshToken: string;
  user: User;
  organizations?: Organization[];
}

export interface OrganizationModule {
  id?: number;
  name?: string;
  code: string;
  status: string;
}

export interface DashboardStats {
  role: Role;
  totalUsers: number;
  newUsersLast30Days: number;
  totalOrganizations: number;
  newOrganizationsLast30Days: number;
  totalModules: number;
  activeTallyConnections: number;
  activeUsersLast24Hours: number;
  lastLoginAt: string | null;
}

export interface FilterDropdowns {
  companies: Array<{ id: number; name: string; guid: string }>;
  dealers: Array<{ id: number; delcode: string; delname: string }>;
  hoStockitems: Array<{ id: number; itemcode: string; itemdesc: string }>;
  stockgroups: string[];
  stockcategories: string[];
  states: string[];
  regions: string[];
  divisions: string[];
}

/** Numbers can arrive as strings from MySQL decimals; read them with toNum(). */
type Num = number | string | null;

export interface SalesItem {
  id: number;
  cotablid: number;
  ledname: string;
  itemname: string;
  rate: Num;
  disc: Num;
  amt: Num;
  actlqty: Num;
  bildqty: Num;
  unitsybl: string;
  vchid: number;
  vchno: string;
  vchdt: string;
  vchtype: string;
  vchtyperesname: string;
  partyled: string;
  company_name: string;
  stockitem_name?: string | null;
  ho_itemcode?: string | null;
  ho_itemdesc?: string | null;
  ho_stockgroup?: string | null;
  ho_stockcategory?: string | null;
  ho_dealer_delcode?: string | null;
  ho_dealer_delname?: string | null;
  ho_dealer_state?: string | null;
  ho_dealer_region?: string | null;
  ho_dealer_division?: string | null;
}

export interface ClosingItem {
  received_on?: string;
  company_name: string;
  dealer_code: string;
  dealer_name: string;
  dealer_state?: string | null;
  dealer_region?: string | null;
  dealer_division?: string | null;
  stock_item_name: string;
  ho_item_code: string;
  ho_item_description: string;
  ho_item_group?: string | null;
  ho_item_category?: string | null;
  yearobqty: Num;
  yearobamt: Num;
  monthobqty: Num;
  monthobamt: Num;
  yearinqty: Num;
  yearinamt: Num;
  monthinqty: Num;
  monthinamt: Num;
  yearoutqty: Num;
  yearoutamt: Num;
  monthoutqty: Num;
  monthoutamt: Num;
  cbqty: Num;
  cbrate: Num;
  cbamt: Num;
}

export interface SalesQuery {
  dateFrom: string;
  dateTo: string;
  cotablid?: number[];
}

export interface MappedSalesQuery {
  dateFrom: string;
  dateTo: string;
  dealerIds?: number[];
  hoStockItemIds?: number[];
  regions?: string[];
  divisions?: string[];
}

export interface ClosingQuery {
  cotablid?: number[];
}

export interface MappedClosingQuery {
  dealer_id?: number[];
  stockgroup?: string[];
  stockcategory?: string[];
  state?: string[];
  region?: string[];
  division?: string[];
}
