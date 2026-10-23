import { motion } from 'motion/react';
import { softEase, useMotionSettings } from '../../lib/motion';
import { useState } from 'react';
import { tutorialSteps } from './content';
import { Modal } from '../../components/Modal';
import { Icon } from '../../components/Icon';
import type { Labels } from '../../domain/models';
export function TutorialDialog({
  labels,
  hasTasks,
  onClose,
  onExamples,
}: {
  labels: Labels;
  /** A board that already has tasks ends with a plain "Got it" instead of offering examples. */
  hasTasks: boolean;
  onClose: () => void;
  onExamples: () => void;
}) {
  const { instant } = useMotionSettings();
  const [index, setIndex] = useState(0);
  const step = tutorialSteps[index]!,
    last = index === tutorialSteps.length - 1,
    offerExamples = last && !hasTasks;
  return (
    <Modal id="helpDialog" title="Welcome to Clearspace" kicker="getting started" onClose={onClose}>
      <div className="tutorial-progress-header">
        {/* The dots below show progress; screen readers still hear each step change. */}
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          Step {index + 1} of {tutorialSteps.length}
        </span>
        {!(last && hasTasks) && (
          <button type="button" className="iconbtn" id="tutorialSkip" onClick={onClose}>
            {last ? 'Use my own tasks' : 'Skip tutorial'}
          </button>
        )}
      </div>
      <motion.div
        key={index}
        id="tutorialContent"
        initial={instant ? false : { opacity: 0, transform: 'translateY(4px)' }}
        animate={{ opacity: 1, transform: 'translateY(0)' }}
        transition={{ duration: instant ? 0 : 0.18, ease: softEase }}
      >
        <div className="tutorial-heading" data-q={'q' in step ? step.q : undefined}>
          <div className="tutorial-icon">
            <Icon name={'q' in step ? (labels[step.q].icon ?? step.icon) : step.icon} />
          </div>
          <h3 id="tutorialTitle">
            <mark className="hl">{'q' in step ? labels[step.q].title : step.title}</mark>
          </h3>
        </div>
        <p id="tutorialDescription">{step.description}</p>
        <div className="tutorial-example">
          <strong>{step.exampleTitle}</strong>
          {step.example}
          {offerExamples && 'emptyBoardNote' in step && <> {step.emptyBoardNote}</>}
        </div>
      </motion.div>
      <div className="tutorial-actions">
        <div
          className="tutorial-progress"
          role="progressbar"
          aria-label="Tutorial progress"
          aria-valuemin={0}
          aria-valuemax={tutorialSteps.length}
          aria-valuenow={index + 1}
          aria-valuetext={`Step ${index + 1} of ${tutorialSteps.length}`}
        >
          {tutorialSteps.map((_, dot) => (
            <motion.span
              key={dot}
              className="tutorial-dot"
              data-state={dot === index ? 'current' : dot < index ? 'done' : undefined}
              initial={false}
              animate={{ width: dot === index ? 26 : 12 }}
              transition={{ duration: instant ? 0 : 0.2, ease: softEase }}
            />
          ))}
        </div>
        {index > 0 && (
          <button className="btn" onClick={() => setIndex(index - 1)}>
            Back
          </button>
        )}
        <button
          id="tutorialNext"
          className="btn primary"
          onClick={() => (offerExamples ? onExamples() : last ? onClose() : setIndex(index + 1))}
        >
          {offerExamples ? 'Start with example tasks' : last ? 'Got it' : 'Next'}
        </button>
      </div>
    </Modal>
  );
}
