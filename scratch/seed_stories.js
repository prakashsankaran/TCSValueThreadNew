import { dbService } from '../db.js';

const stories = [
  {
    id: 'vec-story-101',
    artefactId: 'art-story-101',
    title: 'US-101: Initiate Merchandise Return Request',
    artefactType: 'User Story',
    content: 'As an E-commerce Customer, I want to submit a return request within 30 days of item delivery so that I can receive a replacement or full refund. Criteria: Return button visible within 30-day window, Dropdown menu for return reason, Instant confirmation screen.'
  },
  {
    id: 'vec-story-102',
    artefactId: 'art-story-102',
    title: 'US-102: Automated Refund Approval & Trigger',
    artefactType: 'User Story',
    content: 'As a Warehouse Auditor, I want to scan incoming return packages to trigger automatic refunds so that customer refund processing time is minimized. Criteria: Barcode scanner input validates RMA code, Refunds under $500 processed automatically within 2 minutes.'
  },
  {
    id: 'vec-story-103',
    artefactId: 'art-story-103',
    title: 'US-103: Real-time SMS & Email Notification Dispatch',
    artefactType: 'User Story',
    content: 'As a Customer Service Lead, I want to automatically notify customers when return status changes so that support ticket volume is reduced. Criteria: SMS sent via Twilio when scanned at warehouse, Email sent with detailed refund receipt.'
  }
];

for (const s of stories) {
  dbService.storeArtefactVector(s);
  console.log(`✅ Seeded ${s.title}`);
}
