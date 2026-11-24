import React, { useEffect, useState } from 'react'

interface NotificationSettingProps {
  id: number;
  title?: string;
  description?: string;
}

type ChannelState = { push: boolean; email: boolean };

type ChannelKey = keyof ChannelState; // 'push' | 'email'

/**
 * Pure helper: returns new states array after attempting to toggle.
 * It never mutates the input `states` array.
 * If the toggle would result in both channels off, it returns the original `states`.
 */
export const computeToggledStates = (
  states: ChannelState[],
  index: number,
  type: ChannelKey
): ChannelState[] => {
  if (!Array.isArray(states) || index < 0 || index >= states.length) return states;

  const current = states[index];
  const otherType: ChannelKey = type === 'push' ? 'email' : 'push';
  const newValue = !current[type];

  // Prevent turning both channels off
  if (!newValue && !current[otherType]) return states;

  return states.map((item, idx) => (idx === index ? { ...item, [type]: newValue } : item));
};

export const NotificationSetting: React.FC = () => {
  const notificationSettings: NotificationSettingProps[] = [
    {
      id: 1,
      title: 'Ticket Title Changes',
      description: 'Get notified when a ticket title is updated.',
    },
    {
      id: 2,
      title: 'Organization and Location Changes',
      description: 'Receive alerts for changes to organization or location details.',
    },
    {
      id: 3,
      title: 'Device / Assets Changes',
      description: 'Get notifications for any device or asset updates.',
    },
    {
      id: 4,
      title: 'Add or Remove Indicators and Incident',
      description: 'Get alerts when indicators or incidents are added or removed.',
    },
    {
      id: 5,
      title: 'Assignee Change',
      description: 'Receive notifications when a ticket’s assignee changes.',
    },
    {
      id: 6,
      title: 'Priority Change',
      description: 'Get notified when the ticket priority is updated.',
    },
    {
      id: 7,
      title: 'Comments',
      description: 'Get notifications for new comments added.',
    },
  ]

  // Initialize states from settings. If you want persistent storage, replace this with localStorage/back-end sync.
  const [states, setStates] = useState<ChannelState[]>(
    notificationSettings.map(() => ({ push: true, email: false }))
  );

  // If notificationSettings length ever changes (unlikely here, but safe), sync the states array
  useEffect(() => {
    setStates((prev) => {
      if (prev.length === notificationSettings.length) return prev;
      // preserve existing values where possible, otherwise default
      const next: ChannelState[] = notificationSettings.map((_, i) => prev[i] ?? { push: true, email: false });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationSettings.length]);

  const toggle = (index: number, type: ChannelKey) => {
    setStates((prev) => computeToggledStates(prev, index, type));
  };

  return (
    <div className="p-5 rounded-md bg-surface-primary">
      <div className="grid grid-cols-12 gap-4">
        <h3 className="col-span-8 text-base font-medium">Personal details</h3>
        <h3 className="col-span-2 text-base font-medium text-center">Push</h3>
        <h3 className="col-span-2 text-base font-medium text-center">Email</h3>
      </div>

      {notificationSettings.map((setting, i) => (
        <div key={setting.id} className="grid grid-cols-12 gap-4 items-center mt-4 border-b border-borderColor-secondary pb-4">
          <div className="col-span-8">
            <p className="font-medium">{setting.title}</p>
            <p className="text-sm text-textColor-muted">{setting.description}</p>
          </div>

          <div className="col-span-2 flex justify-center">
            <input
              aria-label={`Push ${setting.title}`}
              type="checkbox"
              checked={states[i]?.push ?? false}
              onChange={() => toggle(i, 'push')}
              className="h-5 w-5 accent-secondary-500 border-gray-300"
            />
          </div>

          <div className="col-span-2 flex justify-center">
            <input
              aria-label={`Email ${setting.title}`}
              type="checkbox"
              checked={states[i]?.email ?? false}
              onChange={() => toggle(i, 'email')}
              className="h-5 w-5 accent-secondary-500 border-gray-300"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default NotificationSetting

