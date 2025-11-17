
import { faker } from '@faker-js/faker/locale/id_ID';
import { ReportCategory, ReportStatus } from '../types.js';

// Centered in Jakarta, Indonesia
const EVENT_CENTER = {
    latitude: -6.2088,
    longitude: 106.8456,
};

const USER_COUNT = 50;
const REPORT_COUNT = 50;
const PARTICIPANT_COUNT = 500;

// Sample descriptions in English and Indonesian
const sampleDescriptions = [
  'Suspicious individual spotted near the main stage.',
  'Orang mencurigakan terlihat di dekat panggung utama.',
  'Medical assistance needed at the west entrance.',
  'Bantuan medis dibutuhkan di pintu barat.',
  'Overcrowding reported near the food court area.',
  'Kerumunan berlebihan dilaporkan di area food court.',
  'Lost wallet, contains ID and credit cards.',
  'Dompet hilang, berisi KTP dan kartu kredit.',
  'Restroom facilities require immediate cleaning.',
  'Fasilitas toilet perlu segera dibersihkan.',
  'A child is separated from their parents near the ferris wheel.',
  'Seorang anak terpisah dari orang tuanya di dekat bianglala.',
  'Sound system malfunction on the second stage.',
  'Kerusakan sistem suara di panggung kedua.',
  'Found a smartphone near the merchandise booth.',
  'Menemukan smartphone di dekat stand merchandise.',
];


// Generate Mock Users with Indonesian names
const users = Array.from({ length: USER_COUNT }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
}));

// Generate Mock Reports with Indonesian context
const reports = Array.from({ length: REPORT_COUNT }, () => ({
    id: faker.string.uuid(),
    category: faker.helpers.enumValue(ReportCategory),
    description: faker.helpers.arrayElement(sampleDescriptions),
    latitude: faker.location.latitude({ min: EVENT_CENTER.latitude - 0.05, max: EVENT_CENTER.latitude + 0.05 }),
    longitude: faker.location.longitude({ min: EVENT_CENTER.longitude - 0.05, max: EVENT_CENTER.longitude + 0.05 }),
    status: faker.helpers.enumValue(ReportStatus),
    reporterId: faker.helpers.arrayElement(users).id,
    createdAt: faker.date.recent({ days: 1 }),
}));

// Generate Mock Participant Locations, ensuring each participant is a known user
const participantLocations = Array.from({ length: PARTICIPANT_COUNT }, () => {
    const user = faker.helpers.arrayElement(users);
    return {
        userId: user.id,
        name: user.name, // Add name for easier joining later
        latitude: faker.location.latitude({ min: EVENT_CENTER.latitude - 0.05, max: EVENT_CENTER.latitude + 0.05 }),
        longitude: faker.location.longitude({ min: EVENT_CENTER.longitude - 0.05, max: EVENT_CENTER.longitude + 0.05 }),
    };
});


// --- API Functions ---

export const getEvents = () => {
     return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                {
                    id: 'event-jakarta-456',
                    name: 'Jakarta Music Fest 2024 (Mock Data)',
                    description: 'A mock music festival event in the heart of Jakarta.',
                    startDate: new Date().toISOString(),
                    location: 'Jakarta, Indonesia',
                },
                {
                    id: 'event-bali-789',
                    name: 'Bali Arts & Crafts Fair (Mock Data)',
                    description: 'A mock cultural event showcasing Balinese arts.',
                    startDate: new Date(Date.now() + 86400000 * 7).toISOString(),
                    location: 'Ubud, Bali',
                }
            ]);
        }, 300);
    });
};

export const getEventDetails = () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                id: 'event-jakarta-456',
                name: 'Jakarta Music Fest 2024 (Mock Data)',
                ...EVENT_CENTER,
            });
        }, 300);
    });
};

export const getReports = () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const reportsWithReporters = reports
                .map(report => {
                    const reporter = users.find(user => user.id === report.reporterId);
                    return {
                        ...report,
                        reporterName: reporter ? reporter.name : 'Reporter Tidak Dikenal',
                    };
                })
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            resolve(reportsWithReporters);
        }, 500);
    });
};

export const getParticipantLocations = () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(participantLocations);
        }, 800);
    });
};

export const getParticipants = () => {
     return new Promise((resolve) => {
        setTimeout(() => {
            // In a real app, this might be a separate endpoint. Here, we'll derive it from users.
            const participantDetails = users.map(user => ({
                id: user.id,
                name: user.name,
                status: faker.helpers.arrayElement(['Active', 'Idle', 'Disconnected']),
                entryTime: faker.date.recent({ days: 1 }),
            }));
            resolve(participantDetails);
        }, 400);
    });
};
