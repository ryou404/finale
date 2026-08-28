/**
 * CareerDNA Orchestrator Facade
 * Direct export of MasterOrchestrator for top-level imports.
 */

const { MasterOrchestrator } = require('./agents/masterOrchestrator');
const { generateDeterministicOutput } = require('./engines/deterministicEngine');
const { ProfileAgent } = require('./agents/profileAgent');
const { ResumeBuilderAgent } = require('./agents/resumeBuilderAgent');
const { ATSAuditorAgent } = require('./agents/atsAuditorAgent');
const { AcademicGapFillerAgent } = require('./agents/academicGapFillerAgent');

module.exports = {
  MasterOrchestrator,
  ProfileAgent,
  ResumeBuilderAgent,
  ATSAuditorAgent,
  AcademicGapFillerAgent,
  generateDeterministicOutput
};
