import { useMemo } from 'react';
import { motion } from 'motion/react';
import { BaseCanvas } from '../base';
import type { TeamOwnershipStory, TeamOwnershipStep, Team, Service } from '../../schemas/team-ownership';
import { SERVICE_TYPE_ICONS } from '../../schemas/team-ownership';

// Team type colors
const TEAM_COLORS: Record<string, string> = {
  platform: '#2196F3',
  product: '#4CAF50',
  sre: '#FF9800',
  security: '#F44336',
  data: '#9C27B0',
};
import './team-ownership.css';

interface TeamOwnershipCanvasProps {
  story: TeamOwnershipStory;
  currentStepIndex: number;
  onStepChange?: (step: number) => void;
  hideOverlay?: boolean;
}

function TeamCard({ team, services, isHighlighted, delay = 0 }: {
  team: Team;
  services: Service[];
  isHighlighted?: boolean;
  delay?: number;
}) {
  const color = team.color || TEAM_COLORS[team.type || 'platform'] || '#666';
  
  return (
    <motion.div
      className={`team-card ${isHighlighted ? 'highlighted' : ''}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay / 1000 }}
      style={{ borderTopColor: color }}
    >
      <div className="team-header">
        <span className="team-name">{team.name}</span>
        {team.lead && <span className="team-lead">👤 {team.lead}</span>}
      </div>
      <div className="team-size">{team.members?.length || 0} members</div>
      <div className="team-services">
        {services.map(svc => (
          <div key={svc.id} className="service-item">
            {SERVICE_TYPE_ICONS[svc.type || 'service']} {svc.name}
            {svc.sla && <span className="sla-badge">{svc.sla}</span>}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function TeamOwnershipCanvas({ story, currentStepIndex, onStepChange, hideOverlay = false }: TeamOwnershipCanvasProps) {
  const currentStep = story.steps[currentStepIndex] as TeamOwnershipStep | undefined;
  
  const highlightedTeams = useMemo(() => 
    new Set(currentStep?.highlightTeams || []), [currentStep]);
  
  const teamServices = useMemo(() => {
    const map: Record<string, Service[]> = {};
    story.teams.forEach(t => map[t.id] = []);
    story.services?.forEach(s => {
      if (map[s.team]) map[s.team].push(s);
    });
    return map;
  }, [story.teams, story.services]);
  
  return (
    <BaseCanvas
      className="team-ownership-canvas"
      currentStepIndex={currentStepIndex}
      totalSteps={story.steps.length}
      stepTitle={currentStep?.title}
      stepDescription={currentStep?.description}
      onStepChange={onStepChange}
      showInfo={!hideOverlay}
      showNav={!hideOverlay}
      infoClassName="team-info"
      navClassName="team-nav"
    >
      <h2>{story.title}</h2>
      
      <div className="teams-grid">
        {story.teams.map((team, i) => (
          <TeamCard
            key={team.id}
            team={team}
            services={teamServices[team.id] || []}
            isHighlighted={highlightedTeams.size === 0 || highlightedTeams.has(team.id)}
            delay={i * 100}
          />
        ))}
      </div>
    </BaseCanvas>
  );
}

export default TeamOwnershipCanvas;
