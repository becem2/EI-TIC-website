import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Publication from './Backend/models/Publication.js';

dotenv.config();

const detailKeys = [
  'conferenceTitle', 'conferenceLocation', 'country', 'pages', 'dates', 'conferenceSite',
  'volume', 'firstPublicationDate', 'journalTitle', 'journalIssn', 'journalQuartile2025',
  'publicationQuartile', 'impactFactor2025', 'publicationImpactFactor', 'indexation',
  'journalSite', 'paperLink', 'publisher', 'publisherLink', 'edition', 'isbnIssn',
  'publicationDate',
];

await mongoose.connect(process.env.MONGO_URI);

let matched = 0;
let modified = 0;
const publications = await Publication.find({ details: { $exists: true } }).select('_id details').lean();

for (const publication of publications) {
  const updates = Object.fromEntries(
    detailKeys
      .filter((key) => publication.details?.[key] !== undefined)
      .map((key) => [key, publication.details[key]])
  );

  if (Object.keys(updates).length === 0) continue;
  matched += 1;
  const result = await Publication.updateOne({ _id: publication._id }, { $set: updates });
  modified += result.modifiedCount;
}

console.log(JSON.stringify({ matched, modified }, null, 2));
await mongoose.disconnect();
