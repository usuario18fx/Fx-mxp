const TimeSelector = ({ currentTime, onTimeChange }) => {
  const times = [
    { id: 'dawn', label: 'Amanecer' },
    { id: 'day', label: 'Día' },
    { id: 'dusk', label: 'Atardecer' },
    { id: 'night', label: 'Noche' }
  ];

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 flex space-x-2 p-1 glass rounded-lg"
         data-testid="time-selector">
      {times.map((time) => (
        <button
          key={time.id}
          onClick={() => onTimeChange(time.id)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-smooth ${
            currentTime === time.id
              ? 'bg-[#4ADE80] text-[#07090F]'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/10'
          }`}
          data-testid={`time-button-${time.id}`}
        >
          {time.label}
        </button>
      ))}
    </div>
  );
};

export default TimeSelector;