import { motion } from 'motion/react';
import { softEase, useMotionSettings } from '../../lib/motion';
import { useState } from 'react';
import { tutorialSteps } from './content';
import { Modal } from '../../components/Modal';
import { Icon } from '../../components/Icon';
import type { Labels } from '../../domain/models';
export function TutorialDialog({
  labels,
  onClose,
  onExamples,
}: {
  labels: Labels;
  onClose: () => void;
  onExamples: () => void;
}) {
  const { instant } = useMotionSettings();
  const [index, setIndex] = useState(0);
  const step = tutorialSteps[index]!,
    last = index === tutorialSteps.length - 1;
  return (
    <Modal id="helpDialog" title="Getting Started" onClose={onClose}>
      <div className="tutorial-progress-header">
        <span className="tutorial-step-label" aria-live="polite" aria-atomic="true">
          Step {index + 1} of {tutorialSteps.length}
        </span>
        <button type="button" className="iconbtn" id="tutorialSkip" onClick={onClose}>
          {last ? 'Use my own tasks' : 'Skip tutorial'}
        </button>
      </div>
      <div
        className="tutorial-progress"
        role="progressbar"
        aria-label="Tutorial progress"
        aria-valuemin={0}
        aria-valuemax={tutorialSteps.length}
        aria-valuenow={index + 1}
        aria-valuetext={`Step ${index + 1} of ${tutorialSteps.length}`}
      >
        <motion.span
          className="tutorial-progress-fill"
          initial={false}
          animate={{ scaleX: (index + 1) / tutorialSteps.length }}
          transition={{ duration: instant ? 0 : 0.2, ease: softEase }}
        />
      </div>
      <motion.div
        key={index}
        id="tutorialContent"
        initial={instant ? false : { opacity: 0, transform: 'translateY(4px)' }}
        animate={{ opacity: 1, transform: 'translateY(0)' }}
        transition={{ duration: instant ? 0 : 0.18, ease: softEase }}
      >
        <div className="tutorial-icon">
          <Icon name={'q' in step ? (labels[step.q].icon ?? step.icon) : step.icon} />
        </div>
        <h3 id="tutorialTitle">{'q' in step ? labels[step.q].title : step.title}</h3>
        <p id="tutorialDescription">{step.description}</p>
        <div className="tutorial-example">
          <strong>{step.exampleTitle}</strong>
          {step.example}
        </div>
      </motion.div>
      <div className="tutorial-actions">
        <button className="btn" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          Back
        </button>
        <button
          id="tutorialNext"
          className="btn primary"
          onClick={() => (last ? onExamples() : setIndex(index + 1))}
        >
          {last ? 'Start with example tasks' : 'Next'}
        </button>
      </div>
    </Modal>
  );
}
