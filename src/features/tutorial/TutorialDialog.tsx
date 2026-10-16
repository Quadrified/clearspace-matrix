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
  const [index, setIndex] = useState(0);
  const step = tutorialSteps[index]!,
    last = index === tutorialSteps.length - 1;
  return (
    <Modal
      id="helpDialog"
      title={`Getting started · ${index + 1} of ${tutorialSteps.length}`}
      onClose={onClose}
    >
      <div id="tutorialContent">
        <div className="tutorial-icon">
          <Icon name={'q' in step ? (labels[step.q].icon ?? step.icon) : step.icon} />
        </div>
        <h3 id="tutorialTitle">{'q' in step ? labels[step.q].title : step.title}</h3>
        <p id="tutorialDescription">{step.description}</p>
        <div className="tutorial-example">
          <strong>{step.exampleTitle}</strong>
          {step.example}
        </div>
      </div>
      <div className="tutorial-progress">
        {tutorialSteps.map((_, i) => (
          <button
            key={i}
            aria-label={`Tutorial step ${i + 1}`}
            aria-current={index === i ? 'step' : undefined}
            className={index === i ? 'active' : ''}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
      <div className="tutorial-actions">
        <button className="btn" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          Back
        </button>
        <button className="iconbtn" id="tutorialSkip" onClick={onClose}>
          {last ? 'Use my own tasks' : 'Skip tutorial'}
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
