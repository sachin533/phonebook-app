// Fake data generator — seeds N contacts via sp_InsertContact.
// Usage: node scripts/seed-fake.js [count] [--clear]
//   count   number of contacts to add (default 1000)
//   --clear delete all existing contacts first
require('dotenv').config();

const { sql, getPool } = require('../server/config/db');

const FIRST = ['Aarav','Aisha','Rohan','Priya','Vikram','Neha','Arjun','Kavya','Rahul','Sneha','Amit','Pooja','Karan','Divya','Suresh','Meera','Rajesh','Anita','Vikas','Lakshmi','John','Emma','Michael','Sophia','David','Olivia','James','Ava','Robert','Mia','William','Zoe','Thomas','Nina','Kiran','Farhan','Gauri','Harish','Ishaan','Jaya'];
const LAST = ['Sharma','Patel','Reddy','Gupta','Mehta','Khan','Iyer','Nair','Singh','Yadav','Joshi','Chopra','Verma','Malhotra','Rao','Kulkarni','Desai','Pillai','Menon','Agarwal','Smith','Johnson','Brown','Taylor','Miller','Davis','Wilson','Moore','Clark','Lee'];
const DOMAINS = ['example.com', 'mail.com', 'test.org', 'demo.net', 'sample.io'];
const CITIES = ['Pune', 'Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow'];
const STREETS = ['MG Road', 'Park Street', 'Gandhi Nagar', 'Lake View', 'Station Road', 'Hill Crest', 'Rose Lane', 'Market Yard'];

// Deterministic PRNG (mulberry32) so reseeds are reproducible.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  const args = process.argv.slice(2);
  const count = Math.max(1, parseInt(args.find(a => /^\d+$/.test(a)) || '1000', 10));
  const clear = args.includes('--clear');

  const pool = await getPool();

  if (clear) {
    await pool.request().query('DELETE FROM dbo.Contacts; DBCC CHECKIDENT (\'dbo.Contacts\', RESEED, 0);');
    console.log('Cleared dbo.Contacts.');
  }

  const existing = new Set(
    (await pool.request().query('SELECT PhoneNumber FROM dbo.Contacts')).recordset
      .map(r => r.PhoneNumber)
  );

  const rand = mulberry32(42);
  const pick = arr => arr[Math.floor(rand() * arr.length)];
  let inserted = 0, skipped = 0;
  let seq = 0;

  while (inserted < count) {
    const first = pick(FIRST);
    const last = pick(LAST);
    const name = `${first} ${last}`;
    // Unique phone: random-looking exchange + sequence-derived line number.
    const area = String(200 + Math.floor(rand() * 800));
    const exch = String(200 + Math.floor(rand() * 800));
    const line = String(1000 + ((seq * 37) % 9000));
    const phoneNumber = `+1 (${area}) ${exch}-${line}`;
    seq += 1;

    if (existing.has(phoneNumber)) { skipped += 1; continue; }

    const email = rand() < 0.2 ? null
      : `${first.toLowerCase()}.${last.toLowerCase()}${Math.floor(rand() * 900) + 100}@${pick(DOMAINS)}`;
    const address = rand() < 0.3 ? null
      : `${Math.floor(rand() * 900) + 100} ${pick(STREETS)}, ${pick(CITIES)}`;

    try {
      await pool.request()
        .input('Name', sql.NVarChar(255), name)
        .input('PhoneNumber', sql.NVarChar(50), phoneNumber)
        .input('Email', sql.NVarChar(255), email)
        .input('Address', sql.NVarChar(sql.MAX), address)
        .execute('sp_InsertContact');
      existing.add(phoneNumber);
      inserted += 1;
      if (inserted % 100 === 0) console.log(`Inserted ${inserted}/${count}...`);
    } catch (err) {
      if (err.number === 2627 || err.number === 2601) { skipped += 1; continue; }
      throw err;
    }
  }

  const total = (await pool.request().query('SELECT COUNT(*) AS c FROM dbo.Contacts')).recordset[0].c;
  console.log(`Done. Inserted ${inserted}, skipped ${skipped}. Total contacts: ${total}.`);
  process.exit(0);
}

main().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
