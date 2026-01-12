import { MeetingState } from '@prisma/client'
import { AppError } from '../errors/AppError.js'

/**
 * State Guard - Single source of truth for state transitions
 * Per 08_STATE_MACHINE.md specification
 */

// Valid state transitions (from → to[])
const ALLOWED_TRANSITIONS: Record<MeetingState, MeetingState[]> = {
    CREATED: ['RECORDING'],
    RECORDING: ['PROCESSING'],
    PROCESSING: ['SUMMARY_READY'],
    SUMMARY_READY: ['PROCESSING'] // Allow loop back for regeneration
}

/**
 * Validates if a state transition is allowed
 */
export function canTransition(from: MeetingState, to: MeetingState): boolean {
    return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Asserts that a state transition is valid, throws AppError if not
 */
export function assertTransition(from: MeetingState, to: MeetingState): void {
    if (!canTransition(from, to)) {
        throw new AppError('INVALID_MEETING_STATE')
    }
}

/**
 * Validates that meeting is in expected state
 */
export function assertState(current: MeetingState, expected: MeetingState | MeetingState[]): void {
    const expectedStates = Array.isArray(expected) ? expected : [expected]
    if (!expectedStates.includes(current)) {
        throw new AppError('INVALID_MEETING_STATE')
    }
}

/**
 * State invariant checks per 08_STATE_MACHINE.md
 */
export const StateInvariants = {
    RECORDING: {
        // endedAt must be null
        canUploadChunk: true,
        canCloseRecording: true,
        summaryJobMustNotRun: true
    },
    PROCESSING: {
        // endedAt must exist, totalChunks must exist
        canUploadChunk: false,
        canSSEStream: true,
        canResumeSummary: true,
        summaryJobMustRun: true
    },
    SUMMARY_READY: {
        // summary must exist
        canViewSummary: true,
        sseMusBeClosed: true,
        canResumeSummary: true
    }
}
