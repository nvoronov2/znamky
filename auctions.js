// Search links for historical auction sales and statistics over the user's own sale records.
const enc = encodeURIComponent;
const google = (q, site) => `https://www.google.com/search?q=${enc(site ? `${q} site:${site}` : q)}`;

export const SITES = [
  { name: 'eBay: prodané', url: (q) => `https://www.ebay.com/sch/i.html?_nkw=${enc(q)}&LH_Sold=1&LH_Complete=1` },
  { name: 'Burda Auction', url: (q) => google(q, 'burda-auction.com') },
  { name: 'StampAuctionNetwork', url: (q) => google(q, 'stampauctionnetwork.com') },
  { name: 'Philasearch', url: (q) => google(q, 'philasearch.com') },
  { name: 'Delcampe', url: (q) => google(q, 'delcampe.net') },
  { name: 'Heritage Auctions', url: (q) => google(q, 'ha.com') },
  { name: 'Google: aukce', url: (q) => google(`${q} aukce prodáno`) }
];

// Search string: the model's auctionQuery, else built from the item's fields.
export function queryOf(item) {
  if (item.auctionQuery) return item.auctionQuery;
  const c = item.catalog[0];
  return [c && `${c.name} ${c.number}`, item.country, item.denomination, item.yearFrom, item.subject].filter(Boolean).join(' ');
}

export function median(nums) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export const compsMedian = (comps) => median(comps.map((c) => c.price).filter((p) => Number.isFinite(p) && p > 0));
