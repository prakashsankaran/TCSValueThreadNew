/**
 * Layer 0 Evidence Ledger & Provenance Manager
 * Manages evidence items, facts, assumptions, constraints, and unknowns with unique stable IDs (EV-XXXX).
 */

export class EvidenceLedger {
  constructor(initialItems = []) {
    this.items = Array.isArray(initialItems) ? [...initialItems] : [];
  }

  addEvidence({
    statement,
    type = 'STAKEHOLDER_STATEMENT',
    source = 'User Intake',
    confidence = 'HIGH',
    sourceUrl,
    sourceDocumentId,
    verificationStatus = 'UNVERIFIED',
    contradictsEvidenceId
  }) {
    if (!statement || !statement.trim()) return null;

    // Generate unique stable ID that avoids index collisions
    const counter = (this.items.length + 1).toString().padStart(3, '0');
    const evidenceId = `EV-${counter}`;

    const newItem = {
      evidenceId,
      type, // ORIGINAL_INPUT | CONFIRMED_FACT | STAKEHOLDER_STATEMENT | EXTERNAL_SOURCE | INTERNAL_SOURCE | ASSUMPTION | INFERENCE | CONSTRAINT | DECISION | OPEN_QUESTION
      statement: statement.trim(),
      source,
      sourceUrl,
      sourceDocumentId,
      capturedAt: new Date().toISOString(),
      confidence, // HIGH | MEDIUM | LOW | UNKNOWN
      verificationStatus: type === 'ORIGINAL_INPUT' ? 'UNVERIFIED' : (verificationStatus || 'CONFIRMED'),
      contradictsEvidenceId
    };

    // Check if statement already exists to prevent duplicate injection
    const existing = this.items.find(i => i.statement === newItem.statement && i.type === newItem.type);
    if (existing) return existing;

    this.items.push(newItem);
    return newItem;
  }

  updateEvidenceStatus(evidenceId, verificationStatus, reason) {
    const item = this.items.find(i => i.evidenceId === evidenceId);
    if (item) {
      item.verificationStatus = verificationStatus; // CONFIRMED | REJECTED | SUPERSEDED
      item.updatedAt = new Date().toISOString();
      if (reason) item.statusReason = reason;
    }
    return item;
  }

  addDiscoveryResponse({ question, answer, capturedBy = 'Stakeholder' }) {
    if (!answer || !answer.trim()) return null;
    return this.addEvidence({
      statement: `[Q: ${question}] A: ${answer.trim()}`,
      type: 'STAKEHOLDER_STATEMENT',
      source: capturedBy,
      confidence: 'HIGH',
      verificationStatus: 'CONFIRMED'
    });
  }

  getFacts() {
    return this.items.filter(i => (i.type === 'CONFIRMED_FACT' || i.type === 'STAKEHOLDER_STATEMENT' || i.type === 'ORIGINAL_INPUT') && i.verificationStatus !== 'REJECTED' && i.verificationStatus !== 'SUPERSEDED');
  }

  getAssumptions() {
    return this.items.filter(i => (i.type === 'ASSUMPTION' || i.type === 'INFERENCE') && i.verificationStatus !== 'REJECTED');
  }

  getUnknowns() {
    return this.items.filter(i => i.type === 'OPEN_QUESTION' && i.verificationStatus !== 'RESOLVED');
  }

  getEvidenceById(id) {
    return this.items.find(i => i.evidenceId === id);
  }

  getAll() {
    return this.items;
  }

  getAllEvidence() {
    return this.items;
  }
}
