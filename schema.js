// Prompt and response schema for the model.
export const SYSTEM = `You are a veteran philatelic appraiser with 30 years of experience, working with Michel, Scott and Yvert catalogues.
OUTPUT LANGUAGE: Czech for every free-text field. Keep enum tokens in English. CURRENCY: always CZK.
Never invent catalogue numbers; if unsure give the most likely and confidence below 0.5.
Price is always a RANGE in CZK per condition: mnh, mh, used, on_cover, damaged.
If it is a sheet or block, appraise the whole item and set quantity. If it is not a stamp, set isStamp=false.
Fill caveats and 2-4 questionsForUser. Do not inflate. Say plainly when unsure.`;

export const DEFAULT_HINT = 'Urči tento objekt a ohodnoť ho.';

const str = { type: 'string' };
const num = { type: 'number' };
const strs = { type: 'array', items: str };
const range = {
  type: 'object',
  properties: { min: num, max: num, confidence: num },
  required: ['min', 'max', 'confidence']
};
const CONDS = ['mnh', 'mh', 'used', 'on_cover', 'damaged'];

export const SCHEMA = {
  type: 'object',
  properties: {
    isStamp: { type: 'boolean' },
    itemType: { type: 'string', enum: ['single', 'pair', 'block', 'sheet', 'cover', 'other'] },
    quantity: { type: 'integer' },
    country: str,
    countryConfidence: num,
    yearFrom: { type: 'integer', nullable: true },
    yearTo: { type: 'integer', nullable: true },
    denomination: str,
    subject: str,
    catalog: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string', enum: ['Michel', 'Scott', 'Yvert'] }, number: str, confidence: num },
        required: ['name', 'number', 'confidence']
      }
    },
    features: strs,
    redFlags: strs,
    visibleCondition: { type: 'string', enum: [...CONDS, 'unknown'] },
    estimates: {
      type: 'object',
      properties: { currency: { type: 'string', enum: ['CZK'] }, ...Object.fromEntries(CONDS.map((c) => [c, range])) },
      required: ['currency', ...CONDS]
    },
    descriptionShort: str,
    descriptionListing: str,
    caveats: strs,
    questionsForUser: strs
  },
  required: ['isStamp', 'itemType', 'quantity', 'country', 'subject', 'estimates', 'descriptionShort', 'caveats', 'questionsForUser']
};
