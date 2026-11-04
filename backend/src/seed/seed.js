// Fills the database with DEMO data (fictional people). Run with: npm run seed
// It only removes data created by an earlier seed run (emails ending in @bloodconnect.demo, except admins).
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User, { BLOOD_GROUPS } from '../models/User.js';
import BloodRequest from '../models/BloodRequest.js';
import Notification from '../models/Notification.js';

const DEMO_PASSWORD = 'Demo@1234';
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const between = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const phone = () => '9' + String(between(100000000, 999999999));
const jitter = (n) => Math.round((n + (Math.random() - 0.5) * 0.08) * 10000) / 10000;

const CITIES = [
  { city: 'Coimbatore', lat: 11.0168, lng: 76.9558, areas: ['RS Puram', 'Gandhipuram', 'Peelamedu', 'Saibaba Colony', 'Singanallur'], hospitals: ['KMCH Hospital', 'PSG Hospitals', 'Ganga Hospital'] },
  { city: 'Chennai', lat: 13.0827, lng: 80.2707, areas: ['T Nagar', 'Adyar', 'Anna Nagar', 'Velachery'], hospitals: ['Apollo Greams Road', 'MIOT International', 'Stanley Medical College'] },
  { city: 'Bengaluru', lat: 12.9716, lng: 77.5946, areas: ['Indiranagar', 'Koramangala', 'Jayanagar', 'Whitefield'], hospitals: ['Manipal Hospital', 'Narayana Health', 'Fortis Bannerghatta'] },
  { city: 'Madurai', lat: 9.9252, lng: 78.1198, areas: ['Anna Nagar', 'KK Nagar', 'Tallakulam'], hospitals: ['Meenakshi Mission Hospital', 'Apollo Specialty Madurai'] },
  { city: 'Kochi', lat: 9.9312, lng: 76.2673, areas: ['Edappally', 'Kakkanad', 'Fort Kochi'], hospitals: ['Aster Medcity', 'Amrita Hospital', 'Lakeshore Hospital'] },
];
const FIRST = ['Arjun', 'Priya', 'Karthik', 'Divya', 'Rahul', 'Meena', 'Suresh', 'Anitha', 'Vignesh', 'Kavya', 'Naveen', 'Lakshmi', 'Hari', 'Swathi', 'Dinesh', 'Pooja', 'Manoj', 'Revathi', 'Sanjay', 'Nisha', 'Gokul', 'Harini', 'Prakash', 'Deepa'];
const LAST = ['Kumar', 'Raj', 'Nair', 'Iyer', 'Menon', 'Pillai', 'Reddy', 'Natarajan', 'Subramanian', 'Krishnan', 'Das', 'Gupta'];
const GROUP_WEIGHTS = ['O+', 'O+', 'O+', 'B+', 'B+', 'A+', 'A+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];
const NOTES = ['Surgery scheduled, donor needed urgently.', 'Platelets required for dengue treatment.', 'Accident case, ICU admitted.', 'Planned delivery, blood on standby.', 'Thalassemia patient, regular transfusion.', ''];

let counter = 0;
const makeUser = (role, hash, extra = {}) => {
  const c = pick(CITIES);
  const first = pick(FIRST), last = pick(LAST);
  counter += 1;
  return {
    _id: new mongoose.Types.ObjectId(),
    name: `${first} ${last}`,
    email: `${first}.${last}${counter}@bloodconnect.demo`.toLowerCase(),
    password: hash, phone: phone(), role, city: c.city, area: pick(c.areas),
    coordinates: { lat: jitter(c.lat), lng: jitter(c.lng) },
    available: Math.random() > 0.25, isActive: true,
    createdAt: new Date(Date.now() - between(1, 90) * 86400000),
    ...extra,
  };
};

async function run() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing in .env');
  await mongoose.connect(process.env.MONGO_URI);

  // Remove old demo data only
  const old = await User.find({ email: /@bloodconnect\.demo$/, role: { $ne: 'admin' } }).select('_id');
  const oldIds = old.map((u) => u._id);
  await Notification.deleteMany({ recipient: { $in: oldIds } });
  await BloodRequest.deleteMany({ requester: { $in: oldIds } });
  await User.deleteMany({ _id: { $in: oldIds } });

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const donors = Array.from({ length: 70 }, () => makeUser('donor', hash, { bloodGroup: pick(GROUP_WEIGHTS), lastDonationDate: Math.random() > 0.5 ? new Date(Date.now() - between(20, 300) * 86400000) : undefined }));
  const requesters = Array.from({ length: 12 }, () => makeUser('requester', hash));
  const hospitals = CITIES.flatMap((c) => c.hospitals.slice(0, 2).map((h) => makeUser('hospital', hash, { name: `${h} Blood Desk`, hospitalName: h, city: c.city, coordinates: { lat: jitter(c.lat), lng: jitter(c.lng) } })));
  const people = [...donors, ...requesters, ...hospitals];
  people.forEach((p, i) => { if (p.role === 'hospital') p.email = `desk${i}@bloodconnect.demo`; });
  await User.insertMany(people);

  // Requests: every request is created around an existing donor so there are real matches
  const requestDocs = [];
  const notifDocs = [];
  const owners = [...requesters, ...hospitals];
  for (let i = 0; i < 60; i++) {
    const seed = pick(donors);
    const cityInfo = CITIES.find((c) => c.city === seed.city);
    const owner = pick(owners);
    const matched = donors.filter((d) => d.city === seed.city && d.bloodGroup === seed.bloodGroup && d.available).slice(0, 8);
    const createdAt = new Date(Date.now() - between(0, 30 * 24 * 60) * 60000);
    const r = Math.random();
    const urgency = r < 0.6 ? 'normal' : r < 0.88 ? 'emergency' : 'critical';
    const _id = new mongoose.Types.ObjectId();
    let status = pick(['pending', 'pending', 'accepted', 'completed', 'completed', 'cancelled']);
    const responses = [];
    let acceptedDonor, firstResponseMinutes = null, acceptedAt, completedAt;

    if (!matched.length) status = status === 'completed' || status === 'accepted' ? 'pending' : status;
    if (matched.length && ['accepted', 'completed'].includes(status)) {
      acceptedDonor = pick(matched)._id;
      firstResponseMinutes = Math.round((Math.random() * 170 + 5) * 10) / 10;
      acceptedAt = new Date(createdAt.getTime() + firstResponseMinutes * 60000);
      responses.push({ donor: acceptedDonor, response: 'accepted', respondedAt: acceptedAt });
      if (status === 'completed') completedAt = new Date(acceptedAt.getTime() + between(2, 24) * 3600000);
      notifDocs.push({ recipient: owner._id, request: _id, type: 'accepted', message: `A donor accepted your request for ${seed.bloodGroup} blood.`, read: Math.random() > 0.5, createdAt: acceptedAt });
    } else if (matched.length > 1 && status === 'pending' && Math.random() > 0.6) {
      firstResponseMinutes = Math.round((Math.random() * 120 + 5) * 10) / 10;
      responses.push({ donor: matched[0]._id, response: 'declined', respondedAt: new Date(createdAt.getTime() + firstResponseMinutes * 60000) });
    }

    requestDocs.push({
      _id, requester: owner._id, patientName: `${pick(FIRST)} ${pick(LAST)}`, bloodGroup: seed.bloodGroup,
      units: between(1, 4), hospitalName: pick(cityInfo.hospitals), city: seed.city, area: pick(cityInfo.areas),
      coordinates: { lat: jitter(cityInfo.lat), lng: jitter(cityInfo.lng) }, contactNumber: phone(),
      requiredDate: new Date(createdAt.getTime() + between(0, 6) * 86400000), urgency, notes: pick(NOTES), status,
      matchedDonors: matched.map((d) => d._id), responses, acceptedDonor, acceptedAt, completedAt, firstResponseMinutes,
      createdAt, updatedAt: acceptedAt || createdAt,
    });
    matched.forEach((d) => notifDocs.push({ recipient: d._id, request: _id, type: 'new_request', message: `Blood needed: ${seed.bloodGroup} at ${requestDocs[requestDocs.length - 1].hospitalName}, ${seed.city}.`, read: Math.random() > 0.6, createdAt }));
  }
  await BloodRequest.insertMany(requestDocs);
  await Notification.insertMany(notifDocs);

  const total = people.length + requestDocs.length + notifDocs.length;
  console.log(`Seeded ${donors.length} donors, ${requesters.length} requesters, ${hospitals.length} hospitals, ${requestDocs.length} requests, ${notifDocs.length} notifications (${total} records).`);
  console.log(`All demo users share the password: ${DEMO_PASSWORD}`);
  console.log(`Try a donor login: ${donors[0].email}`);
  console.log(`Try a requester login: ${requesters[0].email}`);
  await mongoose.disconnect();
}

run().catch((e) => { console.error('Seed failed:', e.message); process.exit(1); });
